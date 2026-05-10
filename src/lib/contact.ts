/**
 * Tiny helpers for "contact this person" links. We surface phone numbers as
 * tap-to-call (`tel:`) and tap-to-WhatsApp (`https://wa.me/...`) once a
 * booking has been accepted. WhatsApp's wa.me API:
 *   - accepts only digits (no `+`, no spaces, no dashes)
 *   - the prefilled `text` query param must be URL-encoded
 *
 * Phones are stored in our DB after Zod normalisation: optional `+`, then
 * 6–15 digits, with separators stripped. So we mostly need to drop a leading
 * `+`. We also strip anything non-digit defensively in case a hand-entered
 * value sneaks through.
 */

export function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** `tel:` link for native dialler. Returns null if phone is missing/empty. */
export function telLink(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  return trimmed ? `tel:${trimmed}` : null;
}

/**
 * `wa.me` click-to-chat link. Returns null if phone is missing/empty or if
 * the digit count doesn't look international (a number we can't be sure
 * WhatsApp will route — better to hide the button than to show a broken one).
 */
export function whatsappLink(
  phone: string | null | undefined,
  prefilledText?: string,
): string | null {
  if (!phone) return null;
  const digits = digitsOnly(phone);
  // wa.me requires the country code. Domestic 10-digit numbers won't route.
  // We accept 8-15 digits as a permissive range — same envelope Zod allows.
  if (digits.length < 8 || digits.length > 15) return null;
  const url = `https://wa.me/${digits}`;
  return prefilledText ? `${url}?text=${encodeURIComponent(prefilledText)}` : url;
}
