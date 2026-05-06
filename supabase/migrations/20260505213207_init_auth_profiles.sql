-- =============================================================
-- ARKO — Initial auth schema: profiles + RLS + triggers
-- =============================================================
-- This migration sets up the application-side user profile linked
-- 1:1 to auth.users, with role-based access (client | sitter),
-- automatic profile creation on signup, and row-level security.
--
-- Security model:
--   * RLS is enabled on public.profiles. No table ships without it.
--   * Direct INSERT/DELETE on profiles by users is denied; profile
--     rows are created by a SECURITY DEFINER trigger on auth.users
--     and removed via ON DELETE CASCADE.
--   * Users may UPDATE their own profile, but a trigger forbids
--     mutating the `role` column (only service_role can).
--   * Anonymous users cannot read public.profiles directly at all
--     (we revoke table-level access). Public sitter listings go
--     exclusively through public.sitters_public (a view that
--     exposes only safe columns and bypasses RLS via owner
--     privileges).
--   * Authenticated users may read sitters' full profile rows
--     (needed for booking flows); their phone number is treated as
--     contactable PII once a booking exists, not as marketing data.
-- =============================================================

-- ---------- 1. Role enum --------------------------------------
create type public.user_role as enum ('client', 'sitter');

-- ---------- 2. Profiles table ---------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null,
  full_name text not null check (length(trim(full_name)) > 0),
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Application-level user profile, 1:1 with auth.users.';
comment on column public.profiles.role is 'client = books a sitter; sitter = provides dog-sitting. Locked after creation by trigger.';

-- Index on role for sitter listings / role-based queries.
create index profiles_role_idx on public.profiles (role);

-- ---------- 3. updated_at trigger -----------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------- 4. Block role mutation by users -------------------
-- service_role (admin / server-side) can still change roles, e.g.
-- for support actions. Regular authenticated users cannot.
create or replace function public.prevent_user_role_change()
returns trigger
language plpgsql
as $$
begin
  if coalesce(
       current_setting('request.jwt.claims', true)::json ->> 'role',
       ''
     ) = 'service_role' then
    return new;
  end if;
  if old.role is distinct from new.role then
    raise exception 'role cannot be changed' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_user_role_change
  before update on public.profiles
  for each row execute function public.prevent_user_role_change();

-- ---------- 5. Auto-create profile on signup ------------------
-- The signup Server Action calls supabase.auth.signUp({ options: { data: ... } })
-- which populates auth.users.raw_user_meta_data. This trigger reads it and
-- inserts the corresponding profile row.
--
-- SECURITY DEFINER is required because the auth.users insert context lacks
-- direct privilege to write to public.profiles. search_path is locked to
-- prevent function-hijacking via shadow schemas.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
begin
  -- Validate the role from metadata; fall back to 'client' if missing/invalid.
  begin
    v_role := (new.raw_user_meta_data ->> 'role')::public.user_role;
  exception when others then
    v_role := 'client';
  end;

  insert into public.profiles (id, role, full_name, phone)
  values (
    new.id,
    coalesce(v_role, 'client'),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'Utilisateur'),
    nullif(trim(new.raw_user_meta_data ->> 'phone'), '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- 6. Lock down anon access to the table -------------
-- Supabase grants SELECT on new public-schema tables to anon by default.
-- We revoke that here: anon must not read profiles directly under any
-- circumstance — public access is mediated by the sitters_public view.
revoke all on table public.profiles from anon;

-- ---------- 7. Row-Level Security -----------------------------
alter table public.profiles enable row level security;

-- Users may read their own profile (full row).
create policy "users read own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

-- Authenticated users may read sitter rows (booking flows need this).
-- anon is excluded by the REVOKE above plus the absence of an anon policy.
create policy "authenticated reads sitter rows"
  on public.profiles
  for select
  to authenticated
  using (role = 'sitter');

-- Users may update their own profile (trigger blocks role mutation).
create policy "users update own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No INSERT policy → only handle_new_user (SECURITY DEFINER) inserts.
-- No DELETE policy → cascade from auth.users handles deletion.

-- ---------- 8. Public sitter listing view ---------------------
-- Anonymous and authenticated visitors can read this view to browse
-- sitters on the homepage. The view runs with OWNER privileges (the
-- default for Postgres views — security_invoker is intentionally NOT
-- set), so it bypasses the underlying table RLS, but it only selects
-- safe columns. Phone numbers and emails are NEVER exposed here.
-- security_barrier prevents leaky predicates from extracting data
-- through aggressive query rewriting.
create or replace view public.sitters_public
with (security_barrier = true)
as
  select
    id,
    full_name,
    avatar_url,
    created_at
  from public.profiles
  where role = 'sitter';

grant select on public.sitters_public to anon, authenticated;

-- =============================================================
-- End of migration
-- =============================================================
