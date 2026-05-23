import "server-only";

import { createAdminClient } from "@/lib/supabase/server";
import { sendSms } from "./client";

const PARIS_TZ = "Europe/Paris";

/**
 * Compact date for SMS: "22/05 a 14h30". Kept short and GSM-7-safe so the whole
 * message stays in a single 160-char segment (one billable SMS).
 */
const formatShort = (iso: string): string => {
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: PARIS_TZ,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("day")}/${get("month")} a ${get("hour")}h${get("minute")}`;
};

/**
 * SMS the sitter that they've got a new paid garde. Called from the Stripe
 * webhook right after the email notification, as a higher-salience nudge for a
 * time-sensitive product (short-term, sometimes urgent gardes).
 *
 * Best-effort: never throws. Reads via the service-role admin client because
 * this runs server-to-server with no user session. The full contact details
 * (client phone, WhatsApp/call buttons) live in the email and the dashboard;
 * the SMS only needs to drive the sitter there quickly.
 */
export async function sendSitterBookingSms(bookingId: string): Promise<void> {
  try {
    const admin = createAdminClient();

    const { data: booking, error } = await admin
      .from("bookings")
      .select("id, sitter_id, start_at, duration_hours, client_full_name")
      .eq("id", bookingId)
      .single();
    if (error || !booking) {
      console.error("[sms/booking] booking not found", bookingId, error);
      return;
    }

    const { data: sitter } = await admin
      .from("profiles")
      .select("phone")
      .eq("id", booking.sitter_id)
      .maybeSingle();
    const sitterPhone = sitter?.phone ?? null;
    if (!sitterPhone) {
      // No number on file - the email still went out, so this isn't an error
      // worth raising loudly; just note it for observability.
      console.info("[sms/booking] sitter has no phone, skipping SMS", booking.sitter_id);
      return;
    }

    const firstName = booking.client_full_name.split(" ")[0] || booking.client_full_name;
    const when = formatShort(booking.start_at);

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    // Single GSM-7 segment. No emoji/curly quotes (would force UCS-2 and split
    // into multiple billable segments).
    const content = `ARKO - Nouvelle garde confirmee : ${firstName}, ${when} (${booking.duration_hours}h). Contact + details dans votre espace : ${siteUrl}/sitter`;

    await sendSms({ to: sitterPhone, content, context: "booking" });
  } catch (e) {
    // Defensive: the helpers above are already best-effort, but the webhook
    // must never fail because of an SMS.
    console.error("[sms/booking] unexpected error", bookingId, e);
  }
}
