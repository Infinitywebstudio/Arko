/**
 * Demo mode: a single env-flag switch that lets the app run the entire
 * booking lifecycle without a Stripe account, without Resend, without any
 * external dependency beyond Supabase. The pre-launch demo to the client
 * needs to walk through reservation → confirmation → cancellation flows
 * without holding hostage for two third-party signups.
 *
 * When `DEMO_MODE=true`:
 *   - Booking creation skips Stripe Checkout entirely. Status jumps from
 *     `pending_payment` straight to `confirmed`, mimicking what the webhook
 *     would do, and the client lands on the merci page.
 *   - Refunds (client cancel, sitter cancel) skip the Stripe API call. The
 *     booking still flips state + stamps refunded_at - only the actual money
 *     movement is bypassed.
 *   - Email sends short-circuit to a console.info dump prefixed with
 *     `[demo email]` so we can observe what *would* have shipped.
 *
 * Set this to `false` (or unset) for real-world operation. There's no
 * intermediate mode - everything is either fully real or fully simulated.
 *
 * Treat demo mode as a build-time-shaped, runtime-evaluated flag: it MUST
 * NOT be on in production. On top of the documented discipline rule, we now
 * enforce a HARD guard below so a leaked/misplaced env var can never let
 * bookings confirm without payment on the production deployment.
 */
export function isDemoMode(): boolean {
  // Hard guard: never honour DEMO_MODE on the production Vercel deployment,
  // regardless of how the var got set. VERCEL_ENV is 'production' there.
  if (process.env.VERCEL_ENV === "production") return false;
  return process.env.DEMO_MODE === "true";
}
