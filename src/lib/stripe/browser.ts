import { loadStripe, type Stripe } from "@stripe/stripe-js";

/**
 * Browser-side Stripe singleton. `loadStripe` lazy-loads Stripe.js from
 * js.stripe.com on first call, then caches the promise so subsequent <Elements>
 * trees on the page reuse the same Stripe instance (the SDK is heavy and
 * shouldn't be re-fetched). Returns null if the publishable key is missing -
 * the UI surfaces a clear error in that case instead of throwing during render.
 *
 * MUST be imported from a client component only; `loadStripe` will not work
 * server-side.
 */
let _stripePromise: Promise<Stripe | null> | null = null;

export function getStripePromise(): Promise<Stripe | null> {
  if (_stripePromise) return _stripePromise;
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    console.error("[stripe] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set");
    _stripePromise = Promise.resolve(null);
    return _stripePromise;
  }
  _stripePromise = loadStripe(key);
  return _stripePromise;
}
