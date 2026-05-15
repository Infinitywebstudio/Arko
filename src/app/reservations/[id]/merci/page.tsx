import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/helpers";
import { createClient } from "@/lib/supabase/server";
import { formatEuros } from "@/lib/booking/pricing";
import { zoneLabel } from "@/lib/zones";
import { Arko, Icon } from "@/components/mascot";

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

export const metadata: Metadata = {
  title: "Réservation confirmée · ARKO",
};

export default async function ReservationThankYouPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireUser(`/reservations/${id}/merci`);

  // RLS only lets the booking's client read it — anyone else hits the notFound
  // path instead of leaking that the row exists.
  const supabase = await createClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "id, status, start_at, duration_hours, price_cents, dangerous_breed, urgent, late, meeting_zone_id, sitter_id",
    )
    .eq("id", id)
    .eq("client_id", session.userId)
    .maybeSingle();

  if (!booking) notFound();

  const dateLabel = formatDateTime(booking.start_at);
  const meetingLabel = booking.meeting_zone_id ? zoneLabel(booking.meeting_zone_id) : null;
  const optionsLabel = [
    booking.dangerous_breed ? "chien cat. 1/2" : null,
    booking.urgent ? "urgente" : null,
    booking.late ? "tardive" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  // The webhook may not have fired yet when Stripe redirects back — show a
  // softer message in that case so the user isn't told "confirmed" until
  // pending_acceptance lands.
  const stillPending = booking.status === "pending_payment";

  return (
    <article
      style={{
        maxWidth: 640,
        margin: "0 auto",
        padding: "var(--space-12) var(--space-6)",
      }}
    >
      <div
        style={{
          background: "white",
          border: "1px solid var(--ink-200)",
          borderRadius: 24,
          padding: "var(--space-10) var(--space-8)",
          boxShadow: "var(--shadow-md)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            margin: "0 auto var(--space-5)",
            borderRadius: 48,
            background: stillPending ? "var(--peach-100)" : "var(--success-50)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {stillPending ? <Arko size={72} mood="alert" /> : <Arko size={72} mood="happy" />}
        </div>

        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: stillPending ? "var(--coral-600)" : "var(--success-700)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          {stillPending ? "Paiement en cours" : "Paiement confirmé"}
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: "clamp(24px, 3vw, 34px)",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            margin: 0,
            marginBottom: "var(--space-4)",
          }}
        >
          {stillPending ? (
            <>
              On <span style={{ color: "var(--coral-500)" }}>finalise</span>
            </>
          ) : (
            <>
              <span style={{ color: "var(--coral-500)" }}>Merci</span> !
            </>
          )}
        </h1>

        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 14,
            color: "var(--ink-600)",
            lineHeight: 1.6,
            margin: 0,
            marginBottom: "var(--space-7)",
          }}
        >
          {stillPending
            ? "Ton paiement est en cours de validation, on confirme ta réservation dans quelques secondes par email."
            : "On a notifié le sitter par email. Tu reçois une confirmation dès qu'il accepte ta demande."}
        </p>

        <div
          style={{
            background: "var(--ink-50)",
            border: "1px solid var(--ink-200)",
            borderRadius: 16,
            padding: "var(--space-5)",
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: "10px 24px",
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            textAlign: "left",
          }}
        >
          <div style={{ color: "var(--ink-500)" }}>Quand</div>
          <div style={{ fontWeight: 600 }}>{dateLabel}</div>
          <div style={{ color: "var(--ink-500)" }}>Durée</div>
          <div style={{ fontWeight: 600 }}>
            {booking.duration_hours}h {optionsLabel && <span style={{ color: "var(--ink-500)", fontWeight: 400 }}>· {optionsLabel}</span>}
          </div>
          {meetingLabel && (
            <>
              <div style={{ color: "var(--ink-500)" }}>Lieu</div>
              <div style={{ fontWeight: 600 }}>{meetingLabel}</div>
            </>
          )}
          <div style={{ color: "var(--ink-500)" }}>Total payé</div>
          <div style={{ fontWeight: 700, color: "var(--coral-600)" }}>
            {formatEuros(booking.price_cents)}
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: "var(--space-7)", flexWrap: "wrap" }}>
          <Link href="/compte/bookings" className="btn btn-primary">
            Mes réservations <Icon name="arrow" size={14} color="white" />
          </Link>
          <Link href="/sitters" className="btn btn-ghost">
            Voir d&apos;autres sitters
          </Link>
        </div>
      </div>
    </article>
  );
}
