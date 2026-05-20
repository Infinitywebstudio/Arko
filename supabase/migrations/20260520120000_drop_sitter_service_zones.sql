-- =============================================================
-- ARKO - Drop sitter service_zones
-- =============================================================
-- Sitters are now considered available across every zone, so the
-- per-sitter "service zones" declaration is removed entirely. The
-- booking-time meeting point (bookings.meeting_zone_id) is unaffected:
-- it still references the static zone list in src/lib/zones.ts and now
-- offers the full list regardless of the sitter.
-- =============================================================

-- The public view selects service_zones, so it must be dropped before the
-- column can go, then recreated without it.
drop view if exists public.sitters_public;

alter table public.sitter_profiles
  drop column if exists service_zones;

-- Recreate sitters_public minus service_zones.
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
    sp.accepts_dangerous_breeds
  from public.profiles p
  inner join public.sitter_profiles sp on sp.id = p.id
  where p.role = 'sitter';

grant select on public.sitters_public to anon, authenticated;
