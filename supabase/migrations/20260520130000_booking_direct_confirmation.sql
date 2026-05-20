-- =============================================================
-- ARKO - Direct booking confirmation (drop sitter acceptance step)
-- =============================================================
-- Product change: the sitter no longer accepts/refuses a request before it
-- becomes active. The client pays, and a successful payment confirms the
-- booking outright (pending_payment -> confirmed). The sitter may still
-- cancel an active booking at any time before start_at, which auto-refunds
-- the client.
--
-- State machine after this migration:
--   pending_payment      -> client filled the form; awaiting Stripe
--   confirmed            -> Stripe captured; the garde is locked in (active)
--   cancelled_by_client  -> terminal — client cancelled before start; refund auto
--   cancelled_by_sitter  -> terminal — sitter cancelled before start; refund auto
--   completed            -> terminal — garde ended (auto at start+duration or manually)
--
-- Legacy enum values (pending_acceptance, refused_by_sitter, no_response) are
-- intentionally LEFT in the type: Postgres cannot drop a value from an enum
-- without recreating it, and no live code path emits them anymore. They remain
-- only so historical rows (if any) stay valid. New bookings never use them.
-- =============================================================

-- ADD VALUE cannot run alongside its first use in the same transaction, so this
-- migration only extends the enum. The application code does the rest.
alter type public.booking_status add value if not exists 'cancelled_by_sitter';

comment on column public.bookings.status is
  'See booking_status enum. Active flow: pending_payment -> confirmed -> completed, with cancelled_by_client / cancelled_by_sitter as terminal refund states.';

-- =============================================================
-- End of migration
-- =============================================================
