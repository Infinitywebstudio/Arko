"use client";

import { useState, useTransition } from "react";

import { acceptBookingAction, refuseBookingAction } from "@/lib/booking/actions";
import { formatEuros } from "@/lib/booking/pricing";
import { telLink, whatsappLink } from "@/lib/contact";
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

export type SitterBookingView = {
  id: string;
  status: string;
  start_at: string;
  duration_hours: number;
  sitter_payout_cents: number;
  dangerous_breed: boolean;
  urgent: boolean;
  late: boolean;
  meeting_zone_id: string | null;
  client_full_name: string;
  client_phone: string | null;
  client_notes: string | null;
};

export default function RequestCard({ booking }: { booking: SitterBookingView }) {
  const [error, setError] = useState<string | null>(null);
  const [pendingAccept, startAccept] = useTransition();
  const [pendingRefuse, startRefuse] = useTransition();
  const [confirmRefuse, setConfirmRefuse] = useState(false);

  const meetingLabel = booking.meeting_zone_id ? zoneLabel(booking.meeting_zone_id) : null;
  const optionsLabel = [
    booking.dangerous_breed ? "cat. 1/2 (+5€)" : null,
    booking.urgent ? "urgente (+7€)" : null,
    booking.late ? "tardive (+7€)" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const tel = telLink(booking.client_phone);
  const wa = whatsappLink(
    booking.client_phone,
    `Bonjour ${booking.client_full_name}, c'est votre dog-sitter ARKO pour la garde du ${formatDateTime(booking.start_at)}.`,
  );

  const handleAccept = () => {
    setError(null);
    startAccept(async () => {
      const result = await acceptBookingAction(booking.id);
      if (!result.ok) setError(result.error);
    });
  };

  const handleRefuse = () => {
    setError(null);
    startRefuse(async () => {
      const result = await refuseBookingAction(booking.id);
      if (!result.ok) setError(result.error);
    });
  };

  const isBusy = pendingAccept || pendingRefuse;

  return (
    <div
      style={{
        background: "white",
        border: "1.5px solid var(--coral-300)",
        borderRadius: 18,
        padding: "var(--space-5)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
        boxShadow: "0 4px 12px rgba(255, 90, 95, 0.08)",
      }}
    >
      {/* Top: client + date */}
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            background: "var(--peach-200)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Arko size={40} mood="alert" collar="#2D5A3F" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{booking.client_full_name}</div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--ink-600)",
              marginTop: 2,
              textTransform: "capitalize",
            }}
          >
            {formatDateTime(booking.start_at)} · {booking.duration_hours}h
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--ink-500)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Tu reçois
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 24,
              color: "var(--coral-500)",
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            {formatEuros(booking.sitter_payout_cents)}
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: "6px 16px",
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          paddingTop: 12,
          borderTop: "1px dashed var(--ink-200)",
        }}
      >
        {meetingLabel && (
          <>
            <span style={{ color: "var(--ink-500)" }}>Lieu</span>
            <span style={{ fontWeight: 600, color: "var(--ink-900)" }}>{meetingLabel}</span>
          </>
        )}
        {optionsLabel && (
          <>
            <span style={{ color: "var(--ink-500)" }}>Options</span>
            <span style={{ color: "var(--ink-700)" }}>{optionsLabel}</span>
          </>
        )}
        {booking.client_phone && (
          <>
            <span style={{ color: "var(--ink-500)" }}>Contact</span>
            <span style={{ color: "var(--ink-900)" }}>{booking.client_phone}</span>
          </>
        )}
      </div>

      {booking.client_notes && (
        <div
          style={{
            padding: "10px 12px",
            background: "var(--peach-100)",
            borderRadius: 10,
            fontFamily: "var(--font-display)",
            fontSize: 13,
            color: "var(--ink-800)",
            lineHeight: 1.5,
          }}
        >
          &ldquo;{booking.client_notes}&rdquo;
        </div>
      )}

      {/* Contact buttons */}
      {(tel || wa) && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
        </div>
      )}

      {error && (
        <div
          style={{
            background: "var(--danger-50)",
            color: "var(--danger-700)",
            border: "1px solid var(--danger-500)",
            padding: "8px 12px",
            borderRadius: 10,
            fontFamily: "var(--font-mono)",
            fontSize: 11,
          }}
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Accept / Refuse actions */}
      <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
        {!confirmRefuse && (
          <>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setConfirmRefuse(true)}
              disabled={isBusy}
              style={{ flex: 1, color: "var(--ink-700)" }}
            >
              Refuser
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAccept}
              disabled={isBusy}
              style={{ flex: 2 }}
            >
              {pendingAccept ? "Acceptation…" : `Accepter · ${formatEuros(booking.sitter_payout_cents)}`}
              {!pendingAccept && <Icon name="arrow" size={14} color="white" />}
            </button>
          </>
        )}
        {confirmRefuse && (
          <>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setConfirmRefuse(false)}
              disabled={isBusy}
              style={{ flex: 1 }}
            >
              Garder
            </button>
            <button
              type="button"
              onClick={handleRefuse}
              disabled={isBusy}
              className="btn btn-sm"
              style={{
                flex: 2,
                background: "var(--danger-500)",
                color: "white",
                borderColor: "var(--danger-500)",
              }}
            >
              {pendingRefuse ? "Refus…" : "Confirmer le refus (refund client)"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
