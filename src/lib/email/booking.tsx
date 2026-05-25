import "server-only";

import { render } from "react-email";
import { createAdminClient } from "@/lib/supabase/server";
import { emailFrom, getResend } from "./client";
import { formatEuros } from "@/lib/booking/pricing";
import { telLink, whatsappLink } from "@/lib/contact";
import { isDemoMode } from "@/lib/demo";
import { zoneLabel } from "@/lib/zones";
import { SitterBookingNotification } from "@/emails/SitterBookingNotification";
import { ClientBookingConfirmed } from "@/emails/ClientBookingConfirmed";
import { ClientBookingCancelledBySitter } from "@/emails/ClientBookingCancelledBySitter";
import { SitterBookingCancelledByClient } from "@/emails/SitterBookingCancelledByClient";
import { ClientBookingCancellationConfirmed } from "@/emails/ClientBookingCancellationConfirmed";

/**
 * Internal helper - every booking email goes through this so the demo-mode
 * short-circuit is enforced in one place. In demo mode we never call Resend;
 * a console.info dump shows operators what *would* have shipped. In real
 * mode any send error is logged but never thrown - emails are best-effort
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
      `[demo email] ${args.context} would send to ${args.to} - subject: "${args.subject}"`,
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

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

/**
 * Notify a sitter that they've received a paid booking. Called from the Stripe
 * webhook once the client's payment goes through.
 *
 * Uses the service-role admin client because we're server-to-server here (no
 * user session) and need to read both the booking row and the sitter's auth
 * email - neither of which a session-bound client can access.
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
    booking.late ? "tardive (+8€)" : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const meetingLabel = booking.meeting_zone_id
    ? zoneLabel(booking.meeting_zone_id)
    : "à convenir avec le client";

  const tel = telLink(booking.client_phone);
  const wa = whatsappLink(
    booking.client_phone,
    `Bonjour ${booking.client_full_name}, c'est votre dog-sitter ARKO pour la garde de ${dateLabel}.`,
  );

  const element = (
    <SitterBookingNotification
      clientFullName={booking.client_full_name}
      clientPhone={booking.client_phone ?? null}
      clientNotes={booking.client_notes ?? null}
      durationHours={booking.duration_hours}
      dateLabel={dateLabel}
      meetingLabel={meetingLabel}
      optionsLabel={optionsLabel || null}
      payoutLabel={formatEuros(booking.sitter_payout_cents)}
      telHref={tel}
      whatsappHref={wa}
      dashboardUrl={`${siteUrl()}/sitter`}
    />
  );
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);

  await deliver({
    to: sitterEmail,
    subject: `ARKO - Nouvelle garde · ${dateLabel}`,
    text,
    html,
    context: "booking",
    bookingId,
  });
}

/**
 * Notify the client that their booking is confirmed. Sent straight after a
 * successful payment (the Stripe webhook), since there is no sitter-acceptance
 * step anymore. Includes the sitter's name + phone + click-to-contact buttons.
 */
export async function sendClientBookingConfirmedNotification(
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
    console.error("[email/booking confirmed] booking not found", bookingId);
    return;
  }

  const { data: clientUser } = await admin.auth.admin.getUserById(booking.client_id);
  const clientEmail = clientUser?.user?.email;
  if (!clientEmail) {
    console.error("[email/booking confirmed] client email not found", booking.client_id);
    return;
  }

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

  const element = (
    <ClientBookingConfirmed
      sitterName={sitterName}
      sitterPhone={sitterPhone}
      dateLabel={dateLabel}
      durationHours={booking.duration_hours}
      meetingLabel={meetingLabel}
      telHref={tel}
      whatsappHref={wa}
    />
  );
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);

  await deliver({
    to: clientEmail,
    subject: `ARKO - Ta garde du ${dateLabel} est confirmée`,
    text,
    html,
    context: "booking confirmed",
    bookingId,
  });
}

/**
 * Notify the client that their sitter cancelled the confirmed booking - payment
 * refunded automatically. Wired in by the sitter's cancel action.
 */
export async function sendClientBookingCancelledBySitterNotification(
  bookingId: string,
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
    console.error(
      "[email/booking cancellation] client email not found",
      booking.client_id,
    );
    return;
  }

  const { data: sitterProfile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", booking.sitter_id)
    .maybeSingle();
  const sitterName = sitterProfile?.full_name ?? "Le sitter";

  const dateLabel = formatDateTime(booking.start_at);

  const element = (
    <ClientBookingCancelledBySitter
      sitterName={sitterName}
      dateLabel={dateLabel}
      refundAmountLabel={formatEuros(booking.price_cents)}
      sittersUrl={`${siteUrl()}/sitters`}
    />
  );
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);

  await deliver({
    to: clientEmail,
    subject: "ARKO - Garde annulée · remboursée",
    text,
    html,
    context: "booking cancelled_by_sitter",
    bookingId,
  });
}

/**
 * Notify the sitter that the client cancelled the confirmed booking. The
 * client was refunded automatically; the sitter just loses the slot.
 */
export async function sendSitterBookingCancelledByClientNotification(
  bookingId: string,
): Promise<void> {
  const admin = createAdminClient();

  const { data: booking } = await admin
    .from("bookings")
    .select(
      "id, sitter_id, start_at, duration_hours, client_full_name",
    )
    .eq("id", bookingId)
    .single();
  if (!booking) {
    console.error(
      "[email/booking cancelled_by_client] booking not found",
      bookingId,
    );
    return;
  }

  const { data: userResp, error: userErr } = await admin.auth.admin.getUserById(
    booking.sitter_id,
  );
  if (userErr || !userResp?.user?.email) {
    console.error(
      "[email/booking cancelled_by_client] sitter email not found",
      booking.sitter_id,
      userErr,
    );
    return;
  }
  const sitterEmail = userResp.user.email;

  const dateLabel = formatDateTime(booking.start_at);

  const element = (
    <SitterBookingCancelledByClient
      clientFullName={booking.client_full_name}
      dateLabel={dateLabel}
      durationHours={booking.duration_hours}
      dashboardUrl={`${siteUrl()}/sitter`}
    />
  );
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);

  await deliver({
    to: sitterEmail,
    subject: `ARKO - Garde annulée par ${booking.client_full_name}`,
    text,
    html,
    context: "booking cancelled_by_client (sitter)",
    bookingId,
  });
}

/**
 * Receipt sent to the client confirming their own cancellation went through
 * (booking flipped + Stripe refund issued). Stripe also sends a refund
 * receipt; this one frames it as an ARKO confirmation and points the user
 * back to the sitter list to rebook.
 */
export async function sendClientBookingCancellationConfirmedNotification(
  bookingId: string,
): Promise<void> {
  const admin = createAdminClient();

  const { data: booking } = await admin
    .from("bookings")
    .select("id, client_id, sitter_id, start_at, price_cents")
    .eq("id", bookingId)
    .single();
  if (!booking) {
    console.error(
      "[email/booking cancellation_confirmed] booking not found",
      bookingId,
    );
    return;
  }

  const { data: clientUser } = await admin.auth.admin.getUserById(booking.client_id);
  const clientEmail = clientUser?.user?.email;
  if (!clientEmail) {
    console.error(
      "[email/booking cancellation_confirmed] client email not found",
      booking.client_id,
    );
    return;
  }

  const { data: sitterProfile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", booking.sitter_id)
    .maybeSingle();
  const sitterName = sitterProfile?.full_name ?? "le sitter";

  const dateLabel = formatDateTime(booking.start_at);

  const element = (
    <ClientBookingCancellationConfirmed
      sitterName={sitterName}
      dateLabel={dateLabel}
      refundAmountLabel={formatEuros(booking.price_cents)}
      sittersUrl={`${siteUrl()}/sitters`}
    />
  );
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);

  await deliver({
    to: clientEmail,
    subject: "ARKO - Annulation confirmée · remboursée",
    text,
    html,
    context: "booking cancellation_confirmed (client)",
    bookingId,
  });
}
