import "server-only";

import { Resend } from "resend";

let _resend: Resend | null = null;

/**
 * Lazy Resend client. As with Stripe, env-var validation deferred to first
 * call so a missing key fails loudly at the actual send rather than at boot.
 */
export function getResend(): Resend {
  if (_resend) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  _resend = new Resend(key);
  return _resend;
}

/**
 * Configured "from" header for transactional emails. The default points to
 * Resend's onboarding sender so dev never silently 401s; in prod we override
 * to a verified domain like `bookings@arko.fr`.
 */
export function emailFrom(): string {
  return process.env.RESEND_FROM_EMAIL ?? "ARKO <onboarding@resend.dev>";
}
