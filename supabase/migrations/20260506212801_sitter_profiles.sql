-- =============================================================
-- ARKO — Sitter profiles, availability, badges, storage buckets
-- =============================================================
-- Adds the sitter-specific data layer on top of the generic
-- public.profiles row created in the auth migration.
--
-- Three new tables:
--   * sitter_profiles    → 1:1 with profiles where role='sitter'
--   * sitter_availability → recurring weekly schedule (multiple slots/day allowed)
--   * sitter_badges       → verification status (id check, background, first aid)
--
-- Two storage buckets:
--   * avatars            → public read, sitter writes own folder
--   * sitter-documents   → private, sitter reads/writes own folder, admin via service_role
--
-- Security model:
--   * RLS enabled on every new table.
--   * sitter_profiles, sitter_availability, sitter_badges are publicly readable
--     (needed for browsing and booking) but writable only by the sitter themselves.
--   * Verification (sitter_badges.verified_at, .verified_by) is settable only by
--     service_role — there is NO authenticated insert/update policy. Sitters cannot
--     mark themselves verified.
--   * The avatars bucket is public for browsing; sitter-documents is strictly private.
--     Both enforce a folder = auth.uid() pattern so users only touch their own files.
--   * A trigger ensures a sitter_profiles row only references a profiles row whose
--     role is 'sitter' — defence against cross-role data corruption.
-- =============================================================

-- ---------- 1. sitter_profiles -------------------------------
create table public.sitter_profiles (
  id uuid primary key references public.profiles (id) on delete cascade,
  bio text check (bio is null or length(bio) <= 2000),
  experience_years smallint check (experience_years is null or (experience_years >= 0 and experience_years <= 80)),
  accepts_dangerous_breeds boolean not null default false,
  service_zones text[] not null default '{}'::text[]
    check (coalesce(array_length(service_zones, 1), 0) <= 30),
  available_from time,
  available_until time check (available_until is null or available_from is null or available_until > available_from),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.sitter_profiles is 'Sitter-specific data, 1:1 with profiles where role=sitter.';
comment on column public.sitter_profiles.service_zones is 'Free-form list of neighbourhoods/cities the sitter operates in.';
comment on column public.sitter_profiles.accepts_dangerous_breeds is 'Mirror of the +5€ booking option — sitter must opt in.';

create trigger sitter_profiles_set_updated_at
  before update on public.sitter_profiles
  for each row execute function public.set_updated_at();

-- Enforce that sitter_profiles.id references a profile with role='sitter'.
-- A plain FK can't express this; we use a trigger.
create or replace function public.ensure_sitter_role()
returns trigger
language plpgsql
as $$
declare
  v_role public.user_role;
begin
  select role into v_role from public.profiles where id = new.id;
  if v_role is null then
    raise exception 'profile % not found', new.id;
  end if;
  if v_role <> 'sitter' then
    raise exception 'sitter_profiles.id must reference a profile with role=sitter (got %)', v_role
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger sitter_profiles_ensure_role
  before insert or update of id on public.sitter_profiles
  for each row execute function public.ensure_sitter_role();

-- Auto-create a sitter_profiles row when a profile becomes (or starts as) a sitter.
-- Runs after handle_new_user has populated the profiles row.
create or replace function public.handle_sitter_role_assigned()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'sitter' then
    insert into public.sitter_profiles (id) values (new.id)
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

create trigger profiles_after_insert_sitter
  after insert on public.profiles
  for each row execute function public.handle_sitter_role_assigned();

create trigger profiles_after_update_sitter
  after update of role on public.profiles
  for each row
  when (old.role is distinct from new.role and new.role = 'sitter')
  execute function public.handle_sitter_role_assigned();

-- ---------- 2. sitter_availability ---------------------------
create table public.sitter_availability (
  id uuid primary key default gen_random_uuid(),
  sitter_id uuid not null references public.sitter_profiles (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null check (end_time > start_time),
  created_at timestamptz not null default now()
);

comment on column public.sitter_availability.weekday is '0=Sunday, 1=Monday, ..., 6=Saturday (ISO day-of-week minus 1)';

create index sitter_availability_sitter_idx on public.sitter_availability (sitter_id);
create index sitter_availability_weekday_idx on public.sitter_availability (weekday);

-- ---------- 3. sitter_badges ---------------------------------
create type public.sitter_badge_kind as enum (
  'id_check',
  'background_check',
  'first_aid'
);

create table public.sitter_badges (
  id uuid primary key default gen_random_uuid(),
  sitter_id uuid not null references public.sitter_profiles (id) on delete cascade,
  kind public.sitter_badge_kind not null,
  verified_at timestamptz,
  verified_by uuid references auth.users (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  unique (sitter_id, kind)
);

comment on table public.sitter_badges is 'Verification milestones — only service_role can set verified_at/verified_by.';

create index sitter_badges_sitter_idx on public.sitter_badges (sitter_id);
create index sitter_badges_pending_idx
  on public.sitter_badges (created_at)
  where verified_at is null;

-- ---------- 4. RLS — sitter_profiles -------------------------
alter table public.sitter_profiles enable row level security;

-- Public browsing (homepage listing, sitter detail page).
create policy "anyone reads sitter_profiles"
  on public.sitter_profiles for select
  to anon, authenticated
  using (true);

-- Sitters update their own.
create policy "sitter updates own sitter_profile"
  on public.sitter_profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No INSERT policy → only handle_sitter_role_assigned (SECURITY DEFINER) inserts.
-- No DELETE policy → cascade from profiles.

-- ---------- 5. RLS — sitter_availability ---------------------
alter table public.sitter_availability enable row level security;

create policy "anyone reads sitter_availability"
  on public.sitter_availability for select
  to anon, authenticated
  using (true);

-- Sitters fully manage their own availability slots.
create policy "sitter inserts own availability"
  on public.sitter_availability for insert
  to authenticated
  with check (sitter_id = auth.uid());

create policy "sitter updates own availability"
  on public.sitter_availability for update
  to authenticated
  using (sitter_id = auth.uid())
  with check (sitter_id = auth.uid());

create policy "sitter deletes own availability"
  on public.sitter_availability for delete
  to authenticated
  using (sitter_id = auth.uid());

-- ---------- 6. RLS — sitter_badges ---------------------------
alter table public.sitter_badges enable row level security;

-- Anyone can see badge status (for trust signalling on listings).
create policy "anyone reads sitter_badges"
  on public.sitter_badges for select
  to anon, authenticated
  using (true);

-- NO insert/update/delete policies for users — only service_role (admin tooling)
-- can record verification outcomes.

-- ---------- 7. Backfill existing sitters ---------------------
-- Sitters created before this migration don't have a sitter_profiles row.
-- Create empty rows so they can edit them through the UI.
insert into public.sitter_profiles (id)
select id from public.profiles where role = 'sitter'
on conflict (id) do nothing;

-- ---------- 8. Storage buckets -------------------------------
-- avatars: public read for displaying on listings.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- sitter-documents: private, holds ID/background-check/first-aid uploads.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'sitter-documents',
  'sitter-documents',
  false,
  10 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ---------- 9. Storage object policies -----------------------
-- avatars: anyone can read (public bucket already grants this), users can only
-- write/delete files under <auth.uid()>/... — defence against folder squatting.
create policy "avatars: user uploads own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars: user updates own folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars: user deletes own folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- sitter-documents: private bucket — read/write/delete restricted to owner.
-- service_role bypasses RLS for admin reviews.
create policy "sitter-documents: owner reads"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'sitter-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "sitter-documents: owner uploads"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'sitter-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "sitter-documents: owner deletes"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'sitter-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------- 10. Refresh sitters_public view ------------------
-- Now that sitter-specific data exists, expand the public view to include
-- the safe-to-publish columns. Phone, email, ID docs and badge notes stay
-- out — those live on profiles or sitter_badges with stricter access.
drop view if exists public.sitters_public;

create view public.sitters_public
with (security_barrier = true)
as
  select
    p.id,
    p.full_name,
    p.avatar_url,
    p.created_at,
    sp.bio,
    sp.experience_years,
    sp.accepts_dangerous_breeds,
    sp.service_zones,
    sp.available_from,
    sp.available_until
  from public.profiles p
  inner join public.sitter_profiles sp on sp.id = p.id
  where p.role = 'sitter';

grant select on public.sitters_public to anon, authenticated;

-- =============================================================
-- End of migration
-- =============================================================
