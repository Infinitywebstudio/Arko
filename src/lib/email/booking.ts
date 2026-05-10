import "server-only";

import { createAdminClient } from "@/lib/supabase/server";
import { emailFrom, getResend } from "./client";
import { formatEuros } from "@/lib/booking/pricing";
import { telLink, whatsappLink } from "@/lib/contact";
import { isDemoMode } from "@/lib/demo";
import { zoneLabel } from "@/lib/zones";

/**
 * Internal helper — every booking email goes through this so the demo-mode
 * short-circuit is enforced in one place. In demo mode we never call Resend;
 * a console.info dump shows operators what *would* have shipped. In real
 * mode any send error is logged but never thrown — emails are best-effort
 * notifications on top of the in-app dashboards.
 */
async function deliver(args: {
  to: string;
  subject: string;
  text: string;
  html: string;
  context: string;
  bookingId: string;
}): Promise<void> {
  if (isDemoMode()) {
    console.info(
      `[demo email] ${args.context} would send to ${args.to} — subject: "${args.subject}"`,
    );
    return;
  }
  try {
    const { error } = await getResend().emails.send({
      from: emailFrom(),
      to: args.to,
      subject: args.subject,
      text: args.text,
      html: args.html,
    });
    if (error) {
      console.error(`[email/${args.context}] send failed`, args.bookingId, error);
    }
  } catch (e) {
    console.error(`[email/${args.context}] send threw`, args.bookingId, e);
  }
}

const PARIS_TZ = "Europe/Paris";

const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", {
    timeZone: PARIS_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));

/**
 * Notify a sitter that they've received a paid booking. Called from the Stripe
 * webhook once the client's payment goes through.
 *
 * Uses the service-role admin client because we're server-to-server here (no
 * user session) and need to read both the booking row and the sitter's auth
 * email — neither of which a session-bound client can access.
 *
 * Failures are logged but never thrown. Email delivery is a best-effort
 * notification on top of the in-app dashboard; bouncing the webhook would put
 * Stripe into retry loops for a recoverable issue, and the booking is already
 * persisted regardless.
 */
export async function sendSitterBookingNotification(bookingId: string): Promise<void> {
  const admin = createAdminClient();

  const { data: booking, error: bookingErr } = await admin
    .from("bookings")
    .select(
      "id, sitter_id, start_at, duration_hours, price_cents, sitter_payout_cents, dangerous_breed, urgent, late, client_full_name, client_phone, meeting_zone_id, client_notes",
    )
    .eq("id", bookingId)
    .single();
  if (bookingErr || !booking) {
    console.error("[email/booking] booking not found", bookingId, bookingErr);
    return;
  }

  // Resolve the sitter's auth email via the admin user lookup.
  const { data: userResp, error: userErr } = await admin.auth.admin.getUserById(
    booking.sitter_id,
  );
  if (userErr || !userResp?.user?.email) {
    console.error("[email/booking] sitter email not found", booking.sitter_id, userErr);
    return;
  }
  const sitterEmail = userResp.user.email;

  const dateLabel = formatDateTime(booking.start_at);
  const optionsLabel = [
    booking.dangerous_breed ? "chien cat. 1/2 (+5€)" : null,
    booking.urgent ? "urgente (+7€)" : null,
    booking.late ? "tardive (+7€)" : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const meetingLabel = booking.meeting_zone_id
    ? zoneLabel(booking.meeting_zone_id)
    : "à convenir avec le client";

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const dashboardUrl = `${siteUrl}/sitter`;

  const subject = `ARKO — Nouvelle garde · ${dateLabel}`;

  // Click-to-contact links — only included once the sitter has visibility on the
  // client (i.e. as soon as they receive this email). They're shortcuts on top
  // of the phone number, not a separate channel.
  const tel = telLink(booking.client_phone);
  const wa = whatsappLink(
    booking.client_phone,
    `Bonjour ${booking.client_full_name}, c'est votre dog-sitter ARKO pour la garde de ${dateLabel}.`,
  );
  const contactLines = [
    `Client : ${booking.client_full_name}${booking.client_phone ? ` · ${booking.client_phone}` : ""}`,
    tel ? `Appeler : ${tel}` : null,
    wa ? `WhatsApp : ${wa}` : null,
  ].filter((l) => l !== null);

  const lines = [
    `${booking.client_full_name} a réservé une garde de ${booking.duration_hours}h.`,
    ``,
    `Quand : ${dateLabel}`,
    `Lieu : ${meetingLabel}`,
    optionsLabel ? `Options : ${optionsLabel}` : null,
    `Tu reçois : ${formatEuros(booking.sitter_payout_cents)}`,
    ``,
    ...contactLines,
    booking.client_notes ? `Note du client : ${booking.client_notes}` : null,
    ``,
    `Connecte-toi à ARKO pour accepter ou refuser :`,
    dashboardUrl,
  ]
    .filter((l) => l !== null)
    .join("\n");

  const contactButtonsHtml = booking.client_phone
    ? `
        <div style="margin: 8px 0 16px; display: flex; gap: 8px; flex-wrap: wrap;">
          ${tel ? `<a href="${tel}" style="display: inline-block; padding: 8px 14px; border: 1px solid #ddd; border-radius: 999px; text-decoration: none; color: #1a1a1a; font-size: 13px;">📞 Appeler</a>` : ""}
          ${wa ? `<a href="${wa}" style="display: inline-block; padding: 8px 14px; background: #25D366; color: white; border-radius: 999px; text-decoration: none; font-size: 13px;">💬 WhatsApp</a>` : ""}
        </div>`
    : "";

  const html = `
    <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
      <h2 style="font-size: 20px; margin-bottom: 16px;">Nouvelle garde ARKO</h2>
      <p style="line-height: 1.6;"><strong>${booking.client_full_name}</strong> a réservé une garde de <strong>${booking.duration_hours}h</strong>.</p>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin: 16px 0;">
        <tr><td style="padding: 6px 0; color: #666;">Quand</td><td style="padding: 6px 0; font-weight: 600;">${dateLabel}</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">Lieu</td><td style="padding: 6px 0; font-weight: 600;">${meetingLabel}</td></tr>
        ${optionsLabel ? `<tr><td style="padding: 6px 0; color: #666;">Options</td><td style="padding: 6px 0;">${optionsLabel}</td></tr>` : ""}
        <tr><td style="padding: 6px 0; color: #666;">Tu reçois</td><td style="padding: 6px 0; font-weight: 700; color: #FF5A5F;">${formatEuros(booking.sitter_payout_cents)}</td></tr>
      </table>
      <h3 style="font-size: 14px; margin-top: 24px;">Client</h3>
      <p style="margin: 4px 0;">${booking.client_full_name}${booking.client_phone ? ` &middot; ${booking.client_phone}` : ""}</p>
      ${contactButtonsHtml}
      ${booking.client_notes ? `<p style="margin: 8px 0; padding: 12px; background: #FFF5F3; border-radius: 8px; font-style: italic;">"${booking.client_notes}"</p>` : ""}
      <p style="margin-top: 28px;">
        <a href="${dashboardUrl}" style="display: inline-block; background: #FF5A5F; color: white; padding: 12px 20px; border-radius: 999px; text-decoration: none; font-weight: 600;">Voir et répondre</a>
      </p>
      <p style="font-size: 11px; color: #999; margin-top: 24px;">ARKO — dog-sitting court terme</p>
    </div>
  `;

  await deliver({
    to: sitterEmail,
    subject,
    text: lines,
    html,
    context: "booking",
    bookingId,
  });
}

/**
 * Notify the client that their sitter accepted the booking. Includes the
 * sitter's name + phone + click-to-contact buttons. Wired in by the sitter's
 * accept action in Phase 4.
 */
export async function sendClientBookingAcceptedNotification(
  bookingId: string,
): Promise<void> {
  const admin = createAdminClient();

  const { data: booking } = await admin
    .from("bookings")
    .select(
      "id, client_id, sitter_id, start_at, duration_hours, price_cents, meeting_zone_id",
    )
    .eq("id", bookingId)
    .single();
  if (!booking) {
    console.error("[email/booking accepted] booking not found", bookingId);
    return;
  }

  const { data: clientUser } = await admin.auth.admin.getUserById(booking.client_id);
  const clientEmail = clientUser?.user?.email;
  if (!clientEmail) {
    console.error("[email/booking accepted] client email not found", booking.client_id);
    return;
  }

  // Read sitter's current name + phone for the contact block.
  const { data: sitterProfile } = await admin
    .from("profiles")
    .select("full_name, phone")
    .eq("id", booking.sitter_id)
    .maybeSingle();
  const sitterName = sitterProfile?.full_name ?? "Le sitter";
  const sitterPhone = sitterProfile?.phone ?? null;

  const dateLabel = formatDateTime(booking.start_at);
  const meetingLabel = booking.meeting_zone_id
    ? zoneLabel(booking.meeting_zone_id)
    : "à convenir avec le sitter";
  const tel = telLink(sitterPhone);
  const wa = whatsappLink(
    sitterPhone,
    `Bonjour ${sitterName}, c'est pour la garde de ${dateLabel} via ARKO.`,
  );

  const subject = `ARKO — ${sitterName} a accepté ta garde du ${dateLabel}`;

  const text = [
    `Bonne nouvelle ! ${sitterName} a accepté ta réservation.`,
    ``,
    `Quand : ${dateLabel}`,
    `Durée : ${booking.duration_hours}h`,
    `Lieu : ${meetingLabel}`,
    ``,
    `Contact ${sitterName} :${sitterPhone ? ` ${sitterPhone}` : ""}`,
    tel ? `Appeler : ${tel}` : null,
    wa ? `WhatsApp : ${wa}` : null,
    ``,
    `À très vite,`,
    `L'équipe ARKO`,
  ]
    .filter((l) => l !== null)
    .join("\n");

  const contactButtonsHtml = sitterPhone
    ? `
        <div style="margin: 12px 0 24px; display: flex; gap: 8px; flex-wrap: wrap;">
          ${tel ? `<a href="${tel}" style="display: inline-block; padding: 10px 16px; border: 1px solid #ddd; border-radius: 999px; text-decoration: none; color: #1a1a1a; font-size: 13px; font-weight: 600;">📞 Appeler ${sitterName.split(" ")[0]}</a>` : ""}
          ${wa ? `<a href="${wa}" style="display: inline-block; padding: 10px 16px; background: #25D366; color: white; border-radius: 999px; text-decoration: none; font-size: 13px; font-weight: 600;">💬 WhatsApp</a>` : ""}
        </div>`
    : "";

  const html = `
    <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
      <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #2E7D5B; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 600; margin-bottom: 8px;">Réservation confirmée</div>
      <h2 style="font-size: 22px; margin: 0 0 16px;"><strong>${sitterName}</strong> a accepté ta garde 🎉</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin: 16px 0;">
        <tr><td style="padding: 6px 0; color: #666;">Quand</td><td style="padding: 6px 0; font-weight: 600;">${dateLabel}</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">Durée</td><td style="padding: 6px 0; font-weight: 600;">${booking.duration_hours}h</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">Lieu</td><td style="padding: 6px 0; font-weight: 600;">${meetingLabel}</td></tr>
      </table>
      <h3 style="font-size: 14px; margin-top: 24px;">Contacter ${sitterName}</h3>
      ${sitterPhone ? `<p style="margin: 4px 0;">${sitterPhone}</p>` : `<p style="margin: 4px 0; color: #888;">Numéro non disponible — contacte le support.</p>`}
      ${contactButtonsHtml}
      <p style="font-size: 11px; color: #999; margin-top: 24px;">ARKO — dog-sitting court terme</p>
    </div>
  `;

  await deliver({
    to: clientEmail,
    subject,
    text,
    html,
    context: "booking accepted",
    bookingId,
  });
}

/**
 * Notify the client that their sitter declined the booking — payment refunded
 * automatically. Wired in by the sitter's refuse action in Phase 4.
 */
export async function sendClientBookingRefusedNotification(
  bookingId: string,
): Promise<void> {
  await sendClientCancellationNotification(bookingId, {
    reason: "refused",
  });
}

/**
 * Notify the client that the sitter never responded by the start time, so we
 * auto-refunded. Wired in by the no-response cron in Phase 5.
 */
export async function sendClientBookingNoResponseNotification(
  bookingId: string,
): Promise<void> {
  await sendClientCancellationNotification(bookingId, {
    reason: "no_response",
  });
}

async function sendClientCancellationNotification(
  bookingId: string,
  opts: { reason: "refused" | "no_response" },
): Promise<void> {
  const admin = createAdminClient();

  const { data: booking } = await admin
    .from("bookings")
    .select("id, client_id, sitter_id, start_at, duration_hours, price_cents")
    .eq("id", bookingId)
    .single();
  if (!booking) {
    console.error("[email/booking cancellation] booking not found", bookingId);
    return;
  }

  const { data: clientUser } = await admin.auth.admin.getUserById(booking.client_id);
  const clientEmail = clientUser?.user?.email;
  if (!clientEmail) {
    console.error("[email/booking cancellation] client email not found", booking.client_id);
    return;
  }

  const { data: sitterProfile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", booking.sitter_id)
    .maybeSingle();
  const sitterName = sitterProfile?.full_name ?? "Le sitter";

  const dateLabel = formatDateTime(booking.start_at);
  const refundAmount = formatEuros(booking.price_cents);

  const reasonText = opts.reason === "refused"
    ? `${sitterName} n'est pas disponible pour la garde du ${dateLabel}.`
    : `${sitterName} n'a pas répondu à temps pour la garde du ${dateLabel}.`;

  const subject = opts.reason === "refused"
    ? `ARKO — Réservation non confirmée — remboursée`
    : `ARKO — Réservation expirée — remboursée`;

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const sittersUrl = `${siteUrl}/sitters`;

  const text = [
    reasonText,
    ``,
    `Le paiement de ${refundAmount} a été automatiquement remboursé sur ta carte.`,
    `Le retour des fonds peut prendre 5 à 10 jours selon ta banque.`,
    ``,
    `Trouve un autre sitter disponible :`,
    sittersUrl,
    ``,
    `À très vite,`,
    `L'équipe ARKO`,
  ].join("\n");

  const html = `
    <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
      <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #888; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 600; margin-bottom: 8px;">${opts.reason === "refused" ? "Réservation refusée" : "Réservation expirée"}</div>
      <h2 style="font-size: 20px; margin: 0 0 16px;">${reasonText}</h2>
      <p style="line-height: 1.6;">Le paiement de <strong>${refundAmount}</strong> a été automatiquement remboursé sur ta carte. Le retour des fonds peut prendre 5 à 10 jours selon ta banque.</p>
      <p style="margin-top: 24px;">
        <a href="${sittersUrl}" style="display: inline-block; background: #FF5A5F; color: white; padding: 12px 20px; border-radius: 999px; text-decoration: none; font-weight: 600;">Voir d'autres sitters</a>
      </p>
      <p style="font-size: 11px; color: #999; margin-top: 24px;">ARKO — dog-sitting court terme</p>
    </div>
  `;

  await deliver({
    to: clientEmail,
    subject,
    text,
    html,
    context: `booking ${opts.reason}`,
    bookingId,
  });
}
