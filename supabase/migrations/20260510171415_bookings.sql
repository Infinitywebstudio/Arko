-- =============================================================
-- ARKO — Bookings: schema, status state machine, RLS, indexes
-- =============================================================
-- A booking is the contract between a client and a sitter for a
-- short-duration garde (1, 2 or 3 hours) at a precise start time.
--
-- Lifecycle:
--   pending_payment      → client has filled the form; awaiting Stripe
--   pending_acceptance   → Stripe captured; sitter has the ball
--   confirmed            → sitter accepted; the garde is locked in
--   cancelled_by_client  → terminal — client cancelled before start; refund auto
--   refused_by_sitter    → terminal — sitter said no; refund auto
--   no_response          → terminal — sitter never replied by start_at; refund auto
--   completed            → terminal — garde ended (auto at start+duration or manually)
--
-- Pricing is a snapshot: total = sitter payout + platform fee, computed
-- server-side at creation time and stored verbatim. Future tariff changes
-- never alter past bookings. Validated by trigger.
--
-- ON DELETE behaviour: profiles → bookings is CASCADE for the MVP. This means
-- a user deleting their account loses their booking history. Acceptable while
-- volumes are tiny; revisit before any volume picks up (we will likely want
-- soft-delete on profiles or a "deleted_user" placeholder so financial records
-- survive an account closure).
-- =============================================================

-- ---------- 1. Status enum -----------------------------------
create type public.booking_status as enum (
  'pending_payment',
  'pending_acceptance',
  'confirmed',
  'cancelled_by_client',
  'refused_by_sitter',
  'no_response',
  'completed'
);

-- ---------- 2. Bookings table --------------------------------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),

  -- Parties (cascade so account-deletion stays simple for MVP — see header note).
  client_id uuid not null references public.profiles (id) on delete cascade,
  sitter_id uuid not null references public.profiles (id) on delete cascade,

  status public.booking_status not null default 'pending_payment',

  -- Schedule
  start_at timestamptz not null,
  duration_hours smallint not null check (duration_hours in (1, 2, 3)),

  -- Pricing snapshot in euro cents (avoids floating point). Total must equal
  -- sitter_payout + platform_fee — enforced by trigger below.
  price_cents integer not null check (price_cents > 0),
  sitter_payout_cents integer not null check (sitter_payout_cents >= 0),
  platform_fee_cents integer not null check (platform_fee_cents >= 0),

  -- Booking options (each adds a flat surcharge captured in price_cents).
  dangerous_breed boolean not null default false,
  urgent boolean not null default false,
  late boolean not null default false,

  -- Stripe
  stripe_payment_intent_id text unique,
  refunded_at timestamptz,

  -- Sitter close-out (free-form, no rating per MVP scope).
  sitter_comment text check (sitter_comment is null or length(sitter_comment) <= 1000),
  sitter_closed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.bookings is 'Short-duration dog-sitting contracts between a client and a sitter.';
comment on column public.bookings.status is 'See booking_status enum and migration header for the state machine.';
comment on column public.bookings.price_cents is 'What the client pays in cents (TTC). Snapshot at creation.';
comment on column public.bookings.sitter_payout_cents is 'What the sitter is owed in cents. Paid manually out-of-platform for MVP.';
comment on column public.bookings.platform_fee_cents is 'ARKO commission in cents. price = sitter_payout + platform_fee, enforced by trigger.';

-- ---------- 3. Pricing-integrity trigger ---------------------
-- Defence against any code path that builds these numbers wrong. The split is
-- not derivable from a fixed percentage (the brief gives concrete cents for
-- each duration), so we don't enforce a ratio — only the sum invariant.
create or replace function public.bookings_check_price_split()
returns trigger
language plpgsql
as $$
begin
  if new.price_cents <> new.sitter_payout_cents + new.platform_fee_cents then
    raise exception 'price_cents (%) must equal sitter_payout_cents (%) + platform_fee_cents (%)',
      new.price_cents, new.sitter_payout_cents, new.platform_fee_cents
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger bookings_check_price_split_ins
  before insert on public.bookings
  for each row execute function public.bookings_check_price_split();

create trigger bookings_check_price_split_upd
  before update of price_cents, sitter_payout_cents, platform_fee_cents
  on public.bookings
  for each row execute function public.bookings_check_price_split();

-- ---------- 4. updated_at trigger ----------------------------
create trigger bookings_set_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

-- ---------- 5. Indexes ---------------------------------------
-- Client's "my bookings" view, ordered by upcoming first.
create index bookings_client_start_idx
  on public.bookings (client_id, start_at desc);

-- Sitter's "my requests / today" view.
create index bookings_sitter_start_idx
  on public.bookings (sitter_id, start_at desc);

-- Cron lookups: find pending_acceptance whose start_at has passed (auto-refund),
-- or confirmed whose start+duration has passed (auto-complete).
create index bookings_status_start_idx
  on public.bookings (status, start_at);

-- ---------- 6. Lock down anon access -------------------------
-- Bookings are private financial records. Anon never reads anything here.
revoke all on table public.bookings from anon;

-- ---------- 7. Row-Level Security ----------------------------
alter table public.bookings enable row level security;

-- Clients read their own bookings.
create policy "client reads own bookings"
  on public.bookings
  for select
  to authenticated
  using (auth.uid() = client_id);

-- Sitters read their own bookings (incoming requests, today, history).
create policy "sitter reads own bookings"
  on public.bookings
  for select
  to authenticated
  using (auth.uid() = sitter_id);

-- Clients create bookings for themselves only, only with safe initial state.
-- Status starts at pending_payment; payment-intent + price come from server-side
-- pricing so a malicious client can't arbitrate cents — the action enforces values.
create policy "client creates own pending booking"
  on public.bookings
  for insert
  to authenticated
  with check (
    auth.uid() = client_id
    and status = 'pending_payment'
    and sitter_closed_at is null
    and refunded_at is null
  );

-- Clients can cancel their own booking if not yet started. The action layer
-- additionally restricts which status transitions are allowed; this RLS policy
-- is the safety net.
create policy "client cancels own future booking"
  on public.bookings
  for update
  to authenticated
  using (auth.uid() = client_id and start_at > now())
  with check (auth.uid() = client_id);

-- Sitters update their own bookings (accept / refuse / close + comment). The
-- action layer narrows status transitions; RLS ensures only the right sitter
-- can write at all.
create policy "sitter updates own booking"
  on public.bookings
  for update
  to authenticated
  using (auth.uid() = sitter_id)
  with check (auth.uid() = sitter_id);

-- No DELETE policy. Bookings are append-only from the user's side; deletes go
-- through service_role (admin) or via profile cascade.

-- =============================================================
-- End of migration
-- =============================================================
