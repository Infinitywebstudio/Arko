import "server-only";

import { createAdminClient } from "@/lib/supabase/server";
import { sendSms } from "./client";

const PARIS_TZ = "Europe/Paris";

/**
 * Compact date for SMS: "22/05 à 14h30". Kept short and GSM-7-safe so the whole
 * message stays in a single 160-char segment (one billable SMS). The `à` is in
 * the GSM-7 base alphabet (same 1-byte cost as ASCII letters); avoid `â`/`ê`/
 * curly quotes/emoji which would force UCS-2 and split the SMS.
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
  return `${get("day")}/${get("month")} à ${get("hour")}h${get("minute")}`;
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
      .select("id, sitter_id, start_at, duration_hours, client_full_name, client_phone")
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

    const when = formatShort(booking.start_at);

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    // Structured layout mirrors the sitter email so the SMS is scannable at
    // a glance: who, how to reach them, when, and where to read the rest.
    // Stays in a single GSM-7 segment for typical French names (<=50 chars):
    // `é`/`à` are in the base alphabet, no UCS-2 fallback. The `Tél` line is
    // omitted if the booking has no phone on file (defensive — the booking
    // flow normally requires it).
    const content = [
      "ARKO - Garde confirmée",
      `Client : ${booking.client_full_name}`,
      booking.client_phone ? `Tél : ${booking.client_phone}` : null,
      `Date : ${when} (${booking.duration_hours}h)`,
      `Détails : ${siteUrl}/sitter`,
    ]
      .filter(Boolean)
      .join("\n");

    await sendSms({ to: sitterPhone, content, context: "booking" });
  } catch (e) {
    // Defensive: the helpers above are already best-effort, but the webhook
    // must never fail because of an SMS.
    console.error("[sms/booking] unexpected error", bookingId, e);
  }
}
