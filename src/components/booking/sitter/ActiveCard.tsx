"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import { closeBookingAction } from "@/lib/booking/actions";
import { formatEuros } from "@/lib/booking/pricing";
import { telLink, whatsappLink } from "@/lib/contact";
import { zoneLabel } from "@/lib/zones";
import { Arko, Icon } from "@/components/mascot";
import type { SitterBookingView } from "./RequestCard";

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

type Phase = "before" | "during" | "after";

function formatDelta(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (hours > 0) return `${hours}h${String(minutes).padStart(2, "0")}`;
  return `${minutes} min`;
}

export default function ActiveCard({ booking }: { booking: SitterBookingView }) {
  // Tick once a minute — booking timelines are in hours, second-precision is
  // CPU for no UX gain. Initial state from Date.now() avoids the hydration
  // mismatch you'd hit with a useState constant.
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const startMs = useMemo(() => new Date(booking.start_at).getTime(), [booking.start_at]);
  const endMs = useMemo(
    () => startMs + booking.duration_hours * 60 * 60 * 1000,
    [startMs, booking.duration_hours],
  );

  const phase: Phase = now < startMs ? "before" : now < endMs ? "during" : "after";

  const meetingLabel = booking.meeting_zone_id ? zoneLabel(booking.meeting_zone_id) : null;
  const tel = telLink(booking.client_phone);
  const wa = whatsappLink(
    booking.client_phone,
    `Bonjour ${booking.client_full_name}, c'est votre dog-sitter ARKO pour la garde du ${formatDateTime(booking.start_at)}.`,
  );

  const [error, setError] = useState<string | null>(null);
  const [showClose, setShowClose] = useState(false);
  const [comment, setComment] = useState("");
  const [pending, startTransition] = useTransition();

  const handleClose = () => {
    setError(null);
    startTransition(async () => {
      const result = await closeBookingAction(booking.id, comment);
      if (!result.ok) {
        setError(result.error);
      }
    });
  };

  const countdownLabel =
    phase === "before"
      ? `Garde dans ${formatDelta(startMs - now)}`
      : phase === "during"
        ? `En cours · ${formatDelta(endMs - now)} restants`
        : "Garde terminée — à clôturer";

  const countdownTone =
    phase === "before"
      ? { bg: "var(--ink-100)", fg: "var(--ink-700)" }
      : phase === "during"
        ? { bg: "var(--success-50)", fg: "var(--success-700)" }
        : { bg: "var(--peach-100)", fg: "var(--coral-700)" };

  return (
    <div
      style={{
        background: "white",
        border: "1px solid var(--ink-200)",
        borderRadius: 18,
        padding: "var(--space-5)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
      }}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            background: "var(--peach-100)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Arko size={40} mood={phase === "during" ? "waggy" : "happy"} collar="#2E7D5B" />
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
        <span
          style={{
            padding: "4px 10px",
            borderRadius: 999,
            background: countdownTone.bg,
            color: countdownTone.fg,
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.04em",
          }}
        >
          {countdownLabel}
        </span>
      </div>

      {(meetingLabel || booking.client_notes) && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            paddingTop: 8,
            borderTop: "1px dashed var(--ink-200)",
          }}
        >
          {meetingLabel && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "var(--ink-700)",
              }}
            >
              <Icon name="pin" size={12} /> {meetingLabel}
            </div>
          )}
          {booking.client_notes && (
            <div
              style={{
                padding: "8px 12px",
                background: "var(--ink-50)",
                borderRadius: 10,
                fontFamily: "var(--font-display)",
                fontSize: 13,
                fontStyle: "italic",
                color: "var(--ink-700)",
                lineHeight: 1.5,
              }}
            >
              &ldquo;{booking.client_notes}&rdquo;
            </div>
          )}
        </div>
      )}

      {(tel || wa) && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {tel && (
            <a href={tel} className="btn btn-outline btn-sm">
              <Icon name="phone" size={13} /> Appeler {booking.client_full_name.split(" ")[0]}
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

      {/* Close-out section. Visible only once the garde has started (phase !=
          "before"). Sitters can close early if needed — they're the source of
          truth on whether the garde wrapped. */}
      {phase !== "before" && (
        <div
          style={{
            paddingTop: 8,
            borderTop: "1px dashed var(--ink-200)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {!showClose && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setShowClose(true)}
              disabled={pending}
            >
              Clôturer la garde
            </button>
          )}
          {showClose && (
            <>
              <label
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--ink-700)",
                }}
              >
                Commentaire (facultatif)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={1000}
                placeholder="Ex : Milo était adorable, balade au parc, bien mangé."
                rows={3}
                style={{
                  width: "100%",
                  padding: 10,
                  background: "white",
                  border: "1px solid var(--ink-300)",
                  borderRadius: 10,
                  fontFamily: "var(--font-mono)",
                  fontSize: 13,
                  color: "var(--ink-900)",
                  outline: "none",
                  resize: "vertical",
                  minHeight: 60,
                }}
                disabled={pending}
              />
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
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setShowClose(false);
                    setComment("");
                    setError(null);
                  }}
                  disabled={pending}
                  style={{ flex: 1 }}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleClose}
                  disabled={pending}
                  style={{ flex: 2 }}
                >
                  {pending ? "Clôture…" : `Confirmer · ${formatEuros(booking.sitter_payout_cents)}`}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {phase === "before" && (
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--ink-500)",
            paddingTop: 4,
          }}
        >
          La clôture sera disponible une fois la garde commencée.
        </div>
      )}
    </div>
  );
}
