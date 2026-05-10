-- =============================================================
-- ARKO — Drop the redundant general time range on sitter_profiles
-- =============================================================
-- The columns sitter_profiles.available_from and .available_until
-- duplicated information already encoded in sitter_availability
-- (per-weekday slots). Two sources of truth are guaranteed to drift
-- once a sitter edits one without the other, and the booking flow
-- always trusts the granular slots, not the global range.
--
-- Public-facing summaries ("Disponible 9h-19h") will be derived at
-- read time from MIN(start_time)/MAX(end_time) over the sitter's
-- active availability rows.
-- =============================================================

-- Drop the public view that depends on these columns; we recreate it without them.
drop view if exists public.sitters_public;

alter table public.sitter_profiles
  drop column if exists available_from,
  drop column if exists available_until;

-- Recreate sitters_public minus the dropped columns. Front-end code derives a
-- summary range from sitter_availability when needed.
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
    sp.service_zones
  from public.profiles p
  inner join public.sitter_profiles sp on sp.id = p.id
  where p.role = 'sitter';

grant select on public.sitters_public to anon, authenticated;
