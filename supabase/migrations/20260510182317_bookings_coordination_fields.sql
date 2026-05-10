-- =============================================================
-- ARKO — Bookings: snapshot fields for sitter↔client coordination
-- =============================================================
-- The bookings table as initially shipped doesn't carry the info a
-- sitter needs to actually meet the client: name to call out, phone
-- to call, where to meet, any special instructions.
--
-- A JOIN to profiles wouldn't surface this info under current RLS:
-- the sitter has no policy to read a client's profile (clients can
-- only read their own + sitter rows). Adding a cross-role profile
-- policy would expose client phone numbers more broadly than needed.
--
-- Snapshotting at booking creation has three benefits:
--   * No RLS gymnastics — the sitter reads their own bookings and
--     gets everything they need in one row.
--   * Historical truth — even if the client later changes phone or
--     deletes their account, the booking row preserves the contact
--     that was valid at the time.
--   * Fewer queries on the sitter dashboard.
-- =============================================================

alter table public.bookings
  add column client_full_name text not null default '',
  add column client_phone text,
  -- Slug from src/lib/zones.ts. Not a FK because zones live in code, not DB.
  add column meeting_zone_id text,
  add column client_notes text check (client_notes is null or length(client_notes) <= 500);

comment on column public.bookings.client_full_name is 'Snapshot of the client''s name at booking time. NOT NULL — empty default exists only for the alter; new rows must set this.';
comment on column public.bookings.client_phone is 'Snapshot of the client''s phone. May be null if the client never registered one.';
comment on column public.bookings.meeting_zone_id is 'Slug from the static zones list (src/lib/zones.ts) where the sitter picks up the dog. Not a FK because the canonical list lives in code.';
comment on column public.bookings.client_notes is 'Free-text instructions from the client (e.g. dog quirks, special needs). Up to 500 chars.';

-- Drop the empty default now that the column is created — going forward, every
-- INSERT must specify client_full_name explicitly.
alter table public.bookings
  alter column client_full_name drop default;
