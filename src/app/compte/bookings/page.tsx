import type { Metadata } from "next";
import Link from "next/link";

import { requireRole } from "@/lib/auth/helpers";
import { createClient } from "@/lib/supabase/server";
import { Arko, Icon } from "@/components/mascot";
import { formatEuros } from "@/lib/booking/pricing";
import { zoneLabel } from "@/lib/zones";
import { signOutAction } from "@/lib/auth/actions";
import { telLink, whatsappLink } from "@/lib/contact";
import CancelBookingButton from "@/components/booking/CancelBookingButton";
import type { Database } from "@/lib/supabase/database.types";

const PARIS_TZ = "Europe/Paris";

type Booking = Database["public"]["Tables"]["bookings"]["Row"] & {
  sitter: Pick<
    Database["public"]["Tables"]["profiles"]["Row"],
    "full_name" | "avatar_url" | "phone"
  > | null;
};
type BookingStatus = Database["public"]["Enums"]["booking_status"];

export const metadata: Metadata = {
  title: "Mes réservations · ARKO",
};

const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", {
    timeZone: PARIS_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending_payment: "Paiement en cours",
  pending_acceptance: "En attente du sitter",
  confirmed: "Confirmée",
  cancelled_by_client: "Annulée",
  refused_by_sitter: "Refusée par le sitter",
  no_response: "Sans réponse — remboursée",
  completed: "Terminée",
};

const STATUS_TONE: Record<BookingStatus, { bg: string; fg: string }> = {
  pending_payment: { bg: "var(--ink-100)", fg: "var(--ink-700)" },
  pending_acceptance: { bg: "var(--peach-100)", fg: "var(--coral-700)" },
  confirmed: { bg: "var(--success-50)", fg: "var(--success-700)" },
  cancelled_by_client: { bg: "var(--ink-100)", fg: "var(--ink-500)" },
  refused_by_sitter: { bg: "var(--ink-100)", fg: "var(--ink-500)" },
  no_response: { bg: "var(--ink-100)", fg: "var(--ink-500)" },
  completed: { bg: "var(--ink-100)", fg: "var(--ink-700)" },
};

export default async function ClientBookingsPage() {
  const session = await requireRole("client", "/compte/bookings");

  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select(
      "id, status, start_at, duration_hours, price_cents, dangerous_breed, urgent, late, meeting_zone_id, sitter_id, client_full_name, sitter:profiles!sitter_id (full_name, avatar_url, phone)",
    )
    // Hide pending_payment from the user-facing list — they're either still
    // in the Stripe Checkout flow or about to expire and get cleaned up.
    .neq("status", "pending_payment")
    .order("start_at", { ascending: false });

  const bookings = (data ?? []) as Booking[];
  const now = Date.now();
  const upcoming = bookings.filter(
    (b) =>
      new Date(b.start_at).getTime() > now &&
      (b.status === "pending_acceptance" || b.status === "confirmed"),
  );
  const past = bookings.filter((b) => !upcoming.includes(b));

  return (
    <div style={{ minHeight: "100vh", background: "var(--peach-50)" }}>
      <header style={{ borderBottom: "1px solid var(--ink-200)", background: "var(--ink-50)" }}>
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Arko size={32} mood="alert" collar="#FF5A5F" />
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 26,
                fontStyle: "italic",
                color: "var(--coral-500)",
                lineHeight: 1,
              }}
            >
              arko
            </span>
          </Link>
          <nav style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link
              href="/compte"
              style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--ink-700)" }}
            >
              Mon compte
            </Link>
            <form action={signOutAction}>
              <button type="submit" className="btn btn-ghost btn-sm">
                <Icon name="arrow" size={14} /> Déconnexion
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 880, margin: "0 auto", padding: "var(--space-12) var(--space-6)" }}>
        <header style={{ marginBottom: "var(--space-8)" }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--coral-600)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontWeight: 600,
              marginBottom: "var(--space-3)",
            }}
          >
            Bonjour, {session.profile.full_name.split(" ")[0]}
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              fontSize: "clamp(36px, 5vw, 56px)",
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
              margin: 0,
            }}
          >
            Mes <span style={{ fontStyle: "italic", color: "var(--coral-500)" }}>réservations</span>
          </h1>
        </header>

        <Section title="À venir" empty="Aucune réservation à venir.">
          {upcoming.map((b) => (
            <BookingCard key={b.id} booking={b} cancellable />
          ))}
        </Section>

        {past.length > 0 && (
          <div style={{ marginTop: "var(--space-10)" }}>
            <Section title="Historique" empty="">
              {past.map((b) => (
                <BookingCard key={b.id} booking={b} cancellable={false} />
              ))}
            </Section>
          </div>
        )}

        <div style={{ marginTop: "var(--space-10)", textAlign: "center" }}>
          <Link href="/sitters" className="btn btn-primary">
            Réserver une nouvelle garde <Icon name="arrow" size={14} color="white" />
          </Link>
        </div>
      </main>
    </div>
  );
}

function Section({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const isEmpty = Array.isArray(children) && children.length === 0;
  return (
    <section>
      <h2
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--ink-500)",
          margin: 0,
          marginBottom: "var(--space-4)",
        }}
      >
        {title}
      </h2>
      {isEmpty && empty ? (
        <div
          style={{
            background: "white",
            border: "1px dashed var(--ink-300)",
            borderRadius: 16,
            padding: "var(--space-6)",
            textAlign: "center",
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            color: "var(--ink-500)",
          }}
        >
          {empty}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {children}
        </div>
      )}
    </section>
  );
}

function BookingCard({ booking, cancellable }: { booking: Booking; cancellable: boolean }) {
  const tone = STATUS_TONE[booking.status];
  const sitterName = booking.sitter?.full_name ?? "Sitter";
  const meetingLabel = booking.meeting_zone_id ? zoneLabel(booking.meeting_zone_id) : null;
  const optionsLabel = [
    booking.dangerous_breed ? "cat. 1/2" : null,
    booking.urgent ? "urgente" : null,
    booking.late ? "tardive" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  // Contact buttons only after the sitter has accepted — privacy gate matches
  // the user-facing model. Phone surfaces only via the JOIN, and the new RLS
  // policy already ensures it's only readable to the booking's owner.
  const showContact = booking.status === "confirmed" && booking.sitter?.phone;
  const tel = showContact ? telLink(booking.sitter!.phone) : null;
  const wa = showContact
    ? whatsappLink(
        booking.sitter!.phone,
        `Bonjour ${sitterName}, c'est ${booking.client_full_name} pour la garde de ${formatDateTime(booking.start_at)} via ARKO.`,
      )
    : null;

  return (
    <div
      style={{
        background: "white",
        border: "1px solid var(--ink-200)",
        borderRadius: 16,
        padding: "var(--space-5)",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            overflow: "hidden",
            background: "var(--peach-100)",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {booking.sitter?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={booking.sitter.avatar_url} alt={sitterName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <Arko size={40} mood="happy" />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <Link
            href={`/sitters/${booking.sitter_id}`}
            style={{ fontWeight: 600, fontSize: 15, color: "var(--ink-900)", textDecoration: "none" }}
          >
            {sitterName}
          </Link>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--ink-600)",
              marginTop: 4,
              textTransform: "capitalize",
            }}
          >
            {formatDateTime(booking.start_at)} · {booking.duration_hours}h
            {optionsLabel && ` · ${optionsLabel}`}
          </div>
          {meetingLabel && (
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--ink-500)",
                marginTop: 2,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Icon name="pin" size={10} /> {meetingLabel}
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <span
            style={{
              padding: "4px 10px",
              borderRadius: 999,
              background: tone.bg,
              color: tone.fg,
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            {STATUS_LABEL[booking.status]}
          </span>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 20,
              letterSpacing: "-0.02em",
              color: booking.status === "cancelled_by_client" ? "var(--ink-500)" : "var(--ink-900)",
              textDecoration: booking.status === "cancelled_by_client" ? "line-through" : "none",
            }}
          >
            {formatEuros(booking.price_cents)}
          </div>
          {cancellable && <CancelBookingButton bookingId={booking.id} />}
        </div>
      </div>

      {showContact && (tel || wa) && (
        <div
          style={{
            display: "flex",
            gap: 8,
            paddingTop: 12,
            borderTop: "1px solid var(--ink-200)",
            flexWrap: "wrap",
          }}
        >
          {tel && (
            <a href={tel} className="btn btn-outline btn-sm">
              <Icon name="phone" size={13} /> Appeler
            </a>
          )}
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm"
              style={{
                background: "#25D366",
                color: "white",
                borderColor: "#25D366",
              }}
            >
              <Icon name="message" size={13} color="white" /> WhatsApp
            </a>
          )}
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--ink-500)",
              alignSelf: "center",
              marginLeft: "auto",
            }}
          >
            {booking.sitter?.phone}
          </span>
        </div>
      )}
    </div>
  );
}
