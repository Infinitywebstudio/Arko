-- =============================================================
-- ARKO — Client comment on completed bookings
-- =============================================================
-- Mirrors the sitter side: `sitter_comment` + `sitter_closed_at` (set when the
-- sitter closes the garde via closeBookingAction) now have a client-side
-- counterpart so the client can leave a free-text comment once the booking
-- reaches the `completed` status.
--
-- Per MVP scope (memory: arko_mvp_cuts.md), this is intentionally a single
-- text field — no rating, no checklist, no photos. The field is editable for
-- as long as the booking stays `completed`; `client_closed_at` records the
-- first submission and is left untouched on subsequent edits.
--
-- Visibility:
--   * Client sees their own comment (RLS: "client reads own bookings")
--   * Sitter sees the client's comment on the booking they hosted (RLS:
--     "sitter reads own bookings" — already in place)
-- =============================================================

-- ---------- 1. Columns ---------------------------------------
alter table public.bookings
  add column client_comment text check (
    client_comment is null or length(client_comment) <= 1000
  ),
  add column client_closed_at timestamptz;

comment on column public.bookings.client_comment is
  'Free-text comment left by the client after the garde completed. Optional, max 1000 chars.';
comment on column public.bookings.client_closed_at is
  'Timestamp of the first time the client submitted client_comment. Edits do not bump this.';

-- ---------- 2. RLS — client comments on completed booking ----
-- A separate UPDATE policy from "client cancels own future booking" (that one
-- only fires while start_at > now()). The new one fires after completion so
-- the client can write a comment. The action layer narrows column-scope to
-- `client_comment` + `client_closed_at` only; this policy is the safety net
-- and ensures the row belongs to the client and is actually completed.
create policy "client comments on completed booking"
  on public.bookings
  for update
  to authenticated
  using (
    auth.uid() = client_id
    and status = 'completed'
  )
  with check (
    auth.uid() = client_id
    and status = 'completed'
  );

-- ---------- 3. Guard against column escalation ---------------
-- Even though the action layer only writes the two new columns, a hostile
-- client crafting their own request could try to flip status / amounts /
-- snapshots via the same RLS policy. This trigger gates the "client comments"
-- path: when the row is being updated by the client (auth.uid() = client_id)
-- and the row was already `completed`, only client_comment + client_closed_at
-- + updated_at may differ between OLD and NEW.
--
-- service_role bypasses RLS entirely so admin tooling is unaffected. Sitters
-- write to the same row via "sitter updates own booking" — that path has
-- auth.uid() = sitter_id and the trigger lets it through.
create or replace function public.bookings_prevent_client_column_escalation()
returns trigger
language plpgsql
as $$
begin
  -- Only constrain when the actor is the booking's client AND the row was
  -- already completed before this UPDATE. Other client paths (cancel) and
  -- sitter / service_role paths are not affected.
  if old.status = 'completed' and auth.uid() = old.client_id then
    if new.id is distinct from old.id
       or new.client_id is distinct from old.client_id
       or new.sitter_id is distinct from old.sitter_id
       or new.status is distinct from old.status
       or new.start_at is distinct from old.start_at
       or new.duration_hours is distinct from old.duration_hours
       or new.price_cents is distinct from old.price_cents
       or new.sitter_payout_cents is distinct from old.sitter_payout_cents
       or new.platform_fee_cents is distinct from old.platform_fee_cents
       or new.dangerous_breed is distinct from old.dangerous_breed
       or new.urgent is distinct from old.urgent
       or new.late is distinct from old.late
       or new.stripe_payment_intent_id is distinct from old.stripe_payment_intent_id
       or new.refunded_at is distinct from old.refunded_at
       or new.client_full_name is distinct from old.client_full_name
       or new.client_phone is distinct from old.client_phone
       or new.meeting_zone_id is distinct from old.meeting_zone_id
       or new.client_notes is distinct from old.client_notes
       or new.sitter_comment is distinct from old.sitter_comment
       or new.sitter_closed_at is distinct from old.sitter_closed_at
       or new.created_at is distinct from old.created_at
    then
      raise exception 'client may only update client_comment / client_closed_at on completed bookings'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger bookings_prevent_client_column_escalation
  before update on public.bookings
  for each row execute function public.bookings_prevent_client_column_escalation();
