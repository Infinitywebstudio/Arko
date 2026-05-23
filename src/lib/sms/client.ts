import "server-only";

import { digitsOnly } from "@/lib/contact";
import { isDemoMode } from "@/lib/demo";

/**
 * Transactional SMS via Brevo (ex-Sendinblue). We send a single transactional
 * SMS to the sitter when a booking is paid - a high-salience ping on top of the
 * email, since a missed email can mean a missed (often urgent) garde.
 *
 * Why Brevo: French/EU host (RGPD-friendly, no extra-EU transfer to document),
 * ~0.045EUR per FR SMS, plain REST API. We keep the provider behind this one
 * module so swapping it later touches a single file.
 *
 * Design mirrors src/lib/email/client.ts + the deliver() discipline in
 * src/lib/email/booking.ts:
 *   - Demo mode short-circuits to a console dump - no account needed for demos.
 *   - Sends are best-effort: any error is logged, never thrown. SMS is a
 *     notification on top of the in-app dashboard and the email; bubbling an
 *     error here would (e.g.) put the Stripe webhook into a retry loop for a
 *     recoverable issue.
 */

const BREVO_SMS_ENDPOINT = "https://api.brevo.com/v3/transactionalSMS/sms";

/**
 * Alphanumeric sender ID shown on the recipient's phone. Max 11 chars, letters
 * and digits only. France requires alphanumeric senders to be registered with
 * the operator; such SMS are one-way (no replies) - which is fine here, replies
 * happen over WhatsApp / call from the dashboard.
 */
function smsSender(): string {
  return process.env.BREVO_SMS_SENDER ?? "ARKO";
}

/**
 * Convert a stored E.164 phone ("+33612345678") into Brevo's expected
 * recipient format: country code + number, digits only, no leading "+".
 * Returns null when the number is missing or too short to carry a country code
 * (we'd rather skip the SMS than pay for one that can't route).
 */
export function toBrevoRecipient(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = digitsOnly(phone);
  // E.164 is 8-15 significant digits including the country code. Same envelope
  // the whatsappLink helper enforces.
  if (digits.length < 8 || digits.length > 15) return null;
  return digits;
}

/**
 * Send one transactional SMS. Resolves regardless of outcome; returns true only
 * on a confirmed send so callers can log/observe, never to gate user flow.
 */
export async function sendSms(args: {
  to: string | null | undefined;
  content: string;
  context: string;
}): Promise<boolean> {
  const recipient = toBrevoRecipient(args.to);
  if (!recipient) {
    console.error(`[sms/${args.context}] no routable recipient`, args.to);
    return false;
  }

  if (isDemoMode()) {
    console.info(
      `[demo sms] ${args.context} would send to +${recipient}: "${args.content}"`,
    );
    return true;
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error(`[sms/${args.context}] BREVO_API_KEY is not set - skipping send`);
    return false;
  }

  try {
    const res = await fetch(BREVO_SMS_ENDPOINT, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        type: "transactional",
        sender: smsSender(),
        recipient,
        content: args.content,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`[sms/${args.context}] Brevo responded ${res.status}`, detail);
      return false;
    }
    return true;
  } catch (e) {
    console.error(`[sms/${args.context}] send threw`, e);
    return false;
  }
}
