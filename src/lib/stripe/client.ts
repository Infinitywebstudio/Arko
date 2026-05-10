import "server-only";

import Stripe from "stripe";

let _stripe: Stripe | null = null;

/**
 * Lazy server-side Stripe client. We don't pin an apiVersion — the installed
 * SDK ships with its own default and will be updated whenever we bump the
 * `stripe` package. Reading the env var inside the getter (instead of at
 * module load) means a missing key surfaces a clear error at first use rather
 * than a cryptic stack on cold boot.
 */
export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  _stripe = new Stripe(key);
  return _stripe;
}
