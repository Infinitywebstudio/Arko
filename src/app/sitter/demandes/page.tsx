import type { Metadata } from "next";
import Link from "next/link";

import { requireRole } from "@/lib/auth/helpers";
import { createClient } from "@/lib/supabase/server";
import { Arko } from "@/components/mascot";
import { formatEuros } from "@/lib/booking/pricing";
import RequestCard from "@/components/booking/sitter/RequestCard";
import ActiveCard from "@/components/booking/sitter/ActiveCard";
import type { Database } from "@/lib/supabase/database.types";

const PARIS_TZ = "Europe/Paris";

type Booking = Database["public"]["Tables"]["bookings"]["Row"];

export const metadata: Metadata = {
  title: "Mes demandes · ARKO Sitter",
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

export default async function SitterDemandesPage() {
  const session = await requireRole("sitter");
  const supabase = await createClient();

  // All non-pending_payment bookings for this sitter, oldest first so that
  // the "en attente de ta réponse" block surfaces what they need to act on.
  const { data } = await supabase
    .from("bookings")
    .select(
      "id, status, start_at, duration_hours, price_cents, sitter_payout_cents, dangerous_breed, urgent, late, meeting_zone_id, client_id, client_full_name, client_phone, client_notes, sitter_comment, sitter_closed_at, client_comment, client_closed_at",
    )
    .eq("sitter_id", session.userId)
    .neq("status", "pending_payment")
    .order("start_at", { ascending: true });

  const bookings = (data ?? []) as Booking[];
  const now = Date.now();

  const pending = bookings.filter((b) => b.status === "pending_acceptance");
  const confirmed = bookings.filter((b) => b.status === "confirmed");
  const past = bookings.filter(
    (b) => !["pending_acceptance", "confirmed"].includes(b.status),
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
      <header>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--ink-500)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          Demandes
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: "clamp(36px, 4vw, 48px)",
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
            margin: 0,
          }}
        >
          Mes <span style={{ fontStyle: "italic", color: "var(--coral-500)" }}>gardes</span>
        </h1>
      </header>

      {/* Pending acceptance — the actionable bucket comes first */}
      <Section
        title="En attente de ta réponse"
        count={pending.length}
        empty="Aucune demande pour l'instant."
      >
        {pending.map((b) => (
          <RequestCard key={b.id} booking={serialize(b)} />
        ))}
      </Section>

      {/* Confirmed — upcoming + active gardes with live countdown + close */}
      {confirmed.length > 0 && (
        <Section title="Gardes confirmées" count={confirmed.length} empty="">
          {confirmed.map((b) => (
            <ActiveCard key={b.id} booking={serialize(b)} />
          ))}
        </Section>
      )}

      {/* History */}
      {past.length > 0 && (
        <Section title="Historique" count={past.length} empty="">
          {past.slice(0, 20).map((b) => (
            <HistoryRow key={b.id} booking={b} now={now} />
          ))}
        </Section>
      )}

      {bookings.length === 0 && (
        <div
          style={{
            background: "white",
            border: "1px dashed var(--ink-300)",
            borderRadius: 16,
            padding: "var(--space-8)",
            textAlign: "center",
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            color: "var(--ink-600)",
            lineHeight: 1.6,
          }}
        >
          Aucune demande pour l&apos;instant.<br />
          <Link
            href="/sitter/disponibilites"
            style={{ color: "var(--coral-600)", fontWeight: 600, textDecoration: "underline" }}
          >
            Vérifie tes disponibilités →
          </Link>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  count,
  empty,
  children,
}: {
  title: string;
  count: number;
  empty: string;
  children: React.ReactNode;
}) {
  if (count === 0 && !empty) return null;
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
        {title} {count > 0 && <span style={{ color: "var(--coral-600)" }}>· {count}</span>}
      </h2>
      {count === 0 && empty ? (
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

// Serialise the Booking into the plain shape the client components expect.
// Keeps the contract narrow and explicit (next time we add a column it doesn't
// silently leak to the client unless we want it).
function serialize(b: Booking) {
  return {
    id: b.id,
    status: b.status,
    start_at: b.start_at,
    duration_hours: b.duration_hours,
    sitter_payout_cents: b.sitter_payout_cents,
    dangerous_breed: b.dangerous_breed,
    urgent: b.urgent,
    late: b.late,
    meeting_zone_id: b.meeting_zone_id,
    client_full_name: b.client_full_name,
    client_phone: b.client_phone,
    client_notes: b.client_notes,
  };
}

const STATUS_LABEL_PAST: Record<string, string> = {
  cancelled_by_client: "Annulée par le client",
  refused_by_sitter: "Tu as refusé",
  no_response: "Sans réponse — remboursée",
  completed: "Terminée",
};

function HistoryRow({ booking, now }: { booking: Booking; now: number }) {
  const isFuture = new Date(booking.start_at).getTime() > now;
  return (
    <div
      style={{
        background: "white",
        border: "1px solid var(--ink-200)",
        borderRadius: 14,
        padding: "var(--space-4) var(--space-5)",
        display: "flex",
        gap: 14,
        alignItems: "center",
        flexWrap: "wrap",
        opacity: booking.status === "completed" ? 1 : 0.75,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          background: "var(--peach-100)",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Arko
          size={28}
          mood={booking.status === "completed" ? "waggy" : "sleepy"}
          collar="#1B2A49"
        />
      </div>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{booking.client_full_name}</div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--ink-500)",
            marginTop: 2,
            textTransform: "capitalize",
          }}
        >
          {formatDateTime(booking.start_at)} · {booking.duration_hours}h
        </div>
        {booking.sitter_comment && (
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 12,
              fontStyle: "italic",
              color: "var(--ink-600)",
              marginTop: 6,
            }}
          >
            <span style={{ fontFamily: "var(--font-mono)", fontStyle: "normal", fontSize: 10, color: "var(--ink-500)", marginRight: 4 }}>
              Toi :
            </span>
            &ldquo;{booking.sitter_comment}&rdquo;
          </div>
        )}
        {booking.client_comment && (
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 12,
              fontStyle: "italic",
              color: "var(--coral-700)",
              marginTop: 4,
            }}
          >
            <span style={{ fontFamily: "var(--font-mono)", fontStyle: "normal", fontSize: 10, color: "var(--ink-500)", marginRight: 4 }}>
              {booking.client_full_name.split(" ")[0]} :
            </span>
            &ldquo;{booking.client_comment}&rdquo;
          </div>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--ink-500)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {isFuture ? "À venir · " : ""}
          {STATUS_LABEL_PAST[booking.status] ?? booking.status}
        </span>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            fontWeight: 700,
            color: booking.status === "completed" ? "var(--success-700)" : "var(--ink-400)",
            textDecoration: booking.status === "completed" ? "none" : "line-through",
          }}
        >
          {formatEuros(booking.sitter_payout_cents)}
        </div>
      </div>
    </div>
  );
}

