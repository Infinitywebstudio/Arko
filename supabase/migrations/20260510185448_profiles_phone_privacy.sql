-- =============================================================
-- ARKO — Tighten RLS on profiles so sitter phone numbers aren't
-- readable by every authenticated user
-- =============================================================
-- The original policy "authenticated reads sitter rows" let any logged-in
-- user SELECT * from a sitter's profile, which leaks the phone column even
-- though no UI displays it. With phone numbers being central to the
-- post-acceptance coordination flow (call / WhatsApp click-to-chat), we
-- want them visible to clients only when there's an actual contractual
-- link.
--
-- Replacement model:
--   * Anonymous + browsing-authenticated paths keep using `sitters_public`,
--     a SECURITY DEFINER view that exposes only safe-to-publish columns
--     (no phone). Browsing the homepage, /sitters listing, and individual
--     /sitters/[id] pages still works exactly as before.
--   * Direct table reads on `profiles` for sitter rows now require the
--     reader to have a booking with the sitter. The booking flow itself
--     does not need direct access (it queries through `sitters_public`).
--   * The /compte/bookings page can JOIN from bookings to profiles to get
--     the sitter's phone — by definition the booking exists, so the new
--     policy passes.
--
-- The narrower policy still reveals the whole sitter row (incl. phone) —
-- there's no column-level RLS in Postgres. That's fine because everything
-- in `profiles` for a sitter is either already in `sitters_public` or is
-- the phone we WANT exposed to that contracted client.
-- =============================================================

drop policy if exists "authenticated reads sitter rows" on public.profiles;

create policy "client reads sitter row of own booking"
  on public.profiles
  for select
  to authenticated
  using (
    role = 'sitter'
    and exists (
      select 1
      from public.bookings
      where bookings.sitter_id = profiles.id
        and bookings.client_id = auth.uid()
    )
  );
