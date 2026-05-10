/**
 * Demo mode: a single env-flag switch that lets the app run the entire
 * booking lifecycle without a Stripe account, without Resend, without any
 * external dependency beyond Supabase. The pre-launch demo to the client
 * needs to walk through reservation → acceptance → cancellation flows
 * without holding hostage for two third-party signups.
 *
 * When `DEMO_MODE=true`:
 *   - Booking creation skips Stripe Checkout entirely. Status jumps from
 *     `pending_payment` straight to `pending_acceptance`, mimicking what the
 *     webhook would do, and the client lands on the merci page.
 *   - Refunds (cancel, refuse, no-response cron) skip the Stripe API call.
 *     The booking still flips state + stamps refunded_at — only the actual
 *     money movement is bypassed.
 *   - Email sends short-circuit to a console.info dump prefixed with
 *     `[demo email]` so we can observe what *would* have shipped.
 *
 * Set this to `false` (or unset) for real-world operation. There's no
 * intermediate mode — everything is either fully real or fully simulated.
 *
 * Treat demo mode as a build-time-shaped, runtime-evaluated flag: it MUST
 * NOT be on in production. The infrastructure has no hard guard for this;
 * it's a discipline rule documented here.
 */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}
