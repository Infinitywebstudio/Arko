"use client";

import { useMemo, useState, useTransition } from "react";

import { createBookingAction } from "@/lib/booking/actions";
import { calculatePrice, formatEuros, type Duration } from "@/lib/booking/pricing";
import { ZONES, zoneLabel } from "@/lib/zones";
import { Arko, Icon } from "@/components/mascot";

const PARIS_TZ = "Europe/Paris";

type Slot = { weekday: number; start_time: string; end_time: string };

type Props = {
  sitter: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    accepts_dangerous_breeds: boolean;
    service_zones: string[];
  };
  slots: Slot[];
  clientName: string;
};

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--ink-700)",
  display: "block",
  marginBottom: 6,
};

const inputStyle = (hasError: boolean): React.CSSProperties => ({
  width: "100%",
  height: 44,
  padding: "0 14px",
  background: "white",
  border: `1px solid ${hasError ? "var(--danger-500)" : "var(--ink-300)"}`,
  borderRadius: 12,
  fontFamily: "var(--font-mono)",
  fontSize: 14,
  color: "var(--ink-900)",
  outline: "none",
});

const textareaStyle = (hasError: boolean): React.CSSProperties => ({
  ...inputStyle(hasError),
  height: "auto",
  minHeight: 80,
  padding: 12,
  resize: "vertical",
  lineHeight: 1.5,
});

function timeToMinutes(t: string): number {
  const [h = "0", m = "0"] = t.split(":");
  return Number(h) * 60 + Number(m);
}

function todayInParis(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: PARIS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function maxDateInParis(daysAhead: number): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: PARIS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000));
}

function weekdayOfDateString(dateStr: string): number {
  // Using noon avoids any DST edge — we only care about the calendar day in Paris.
  const d = new Date(`${dateStr}T12:00:00Z`);
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone: PARIS_TZ,
    weekday: "short",
  }).format(d);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(name);
}

function currentHourInParis(): number {
  const h = new Intl.DateTimeFormat("en-GB", {
    timeZone: PARIS_TZ,
    hour: "2-digit",
    hour12: false,
  }).format(new Date());
  return Number(h);
}

const DURATIONS: Duration[] = [1, 2, 3];

export default function ReservationForm({ sitter, slots, clientName }: Props) {
  const today = todayInParis();
  const maxDate = maxDateInParis(30);

  const [date, setDate] = useState<string>(today);
  const [hour, setHour] = useState<number | null>(null);
  const [duration, setDuration] = useState<Duration>(1);
  const [dangerous, setDangerous] = useState(false);
  const [meetingZoneId, setMeetingZoneId] = useState<string>("");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  // The list of hours the sitter actually offers on the chosen date for the
  // chosen duration. Computed locally — server re-validates the same rule.
  const validHours = useMemo(() => {
    const weekday = weekdayOfDateString(date);
    const slotsForDay = slots.filter((s) => s.weekday === weekday);
    if (slotsForDay.length === 0) return [];
    const minNowHour = date === today ? currentHourInParis() + 1 : 0;
    const result: number[] = [];
    for (let h = Math.max(0, minNowHour); h <= 23; h++) {
      const startMin = h * 60;
      const endMin = startMin + duration * 60;
      const fits = slotsForDay.some(
        (s) => timeToMinutes(s.start_time) <= startMin && timeToMinutes(s.end_time) >= endMin,
      );
      if (fits) result.push(h);
    }
    return result;
  }, [date, duration, slots, today]);

  // Live pricing preview. Server is authoritative; this is purely for UX.
  const breakdown = useMemo(() => {
    const late = (hour ?? 0) >= 19;
    return calculatePrice({
      duration,
      dangerous_breed: dangerous,
      late,
      // Urgent isn't shown live (the threshold is 30min and we'd need a tick) —
      // we lean on server to apply it. UI stays calm.
      urgent: false,
    });
  }, [duration, dangerous, hour]);

  // Drop the selected hour if it's no longer valid after a date/duration change.
  if (hour !== null && !validHours.includes(hour)) {
    // setState during render is acceptable here: it self-converges in one extra
    // render and no effect/event would land before the user's next interaction.
    setHour(null);
  }

  const dangerousAvailable = sitter.accepts_dangerous_breeds;
  const zoneOptions = ZONES.filter((z) => sitter.service_zones.includes(z.id));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (hour === null) {
      setError("Choisis une heure de début.");
      setFieldErrors({ start_hour: "Heure requise" });
      return;
    }

    const fd = new FormData();
    fd.append("sitter_id", sitter.id);
    fd.append("start_date", date);
    fd.append("start_hour", String(hour));
    fd.append("duration_hours", String(duration));
    fd.append("dangerous_breed", dangerous ? "true" : "false");
    if (meetingZoneId) fd.append("meeting_zone_id", meetingZoneId);
    if (notes.trim()) fd.append("client_notes", notes.trim());

    startTransition(async () => {
      const result = await createBookingAction(fd);
      if (result.ok) {
        // Hard redirect to Stripe — leaves the SPA cleanly.
        window.location.href = result.redirectTo;
      } else {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* Sitter banner */}
      <header style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            overflow: "hidden",
            background: "var(--peach-100)",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {sitter.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- remote Supabase URL
            <img src={sitter.avatar_url} alt={sitter.full_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <Arko size={52} mood="happy" />
          )}
        </div>
        <div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--coral-600)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Réservation
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              fontSize: "clamp(22px, 3vw, 28px)",
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            avec <span style={{ color: "var(--coral-500)" }}>{sitter.full_name}</span>
          </h1>
        </div>
      </header>

      {/* Date + duration grid */}
      <section
        style={{
          background: "white",
          border: "1px solid var(--ink-200)",
          borderRadius: 18,
          padding: "var(--space-6)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-5)",
        }}
      >
        <div>
          <label htmlFor="start_date" style={labelStyle}>
            Date de garde
          </label>
          <input
            id="start_date"
            type="date"
            value={date}
            min={today}
            max={maxDate}
            onChange={(e) => setDate(e.target.value)}
            style={inputStyle(!!fieldErrors.start_date)}
            disabled={isPending}
            required
          />
          {fieldErrors.start_date && <FieldError>{fieldErrors.start_date}</FieldError>}
        </div>

        <div>
          <label style={labelStyle}>Durée</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {DURATIONS.map((d) => {
              const on = d === duration;
              return (
                <button
                  type="button"
                  key={d}
                  aria-pressed={on}
                  onClick={() => setDuration(d)}
                  disabled={isPending}
                  style={{
                    padding: "12px 8px",
                    borderRadius: 12,
                    border: `1.5px solid ${on ? "var(--coral-500)" : "var(--ink-300)"}`,
                    background: on ? "var(--coral-50)" : "white",
                    color: on ? "var(--coral-700)" : "var(--ink-700)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: isPending ? "not-allowed" : "pointer",
                  }}
                >
                  {d}h
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor="start_hour" style={labelStyle}>
            Heure de début
          </label>
          {validHours.length === 0 ? (
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "var(--ink-500)",
                padding: "10px 14px",
                background: "var(--ink-50)",
                border: "1px dashed var(--ink-300)",
                borderRadius: 12,
              }}
            >
              Aucun créneau disponible ce jour pour {duration}h.
            </div>
          ) : (
            <select
              id="start_hour"
              value={hour ?? ""}
              onChange={(e) => setHour(e.target.value ? Number(e.target.value) : null)}
              style={inputStyle(!!fieldErrors.start_hour)}
              disabled={isPending}
              required
            >
              <option value="" disabled>
                Choisir…
              </option>
              {validHours.map((h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, "0")}:00 – {String(h + duration).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          )}
          {fieldErrors.start_hour && <FieldError>{fieldErrors.start_hour}</FieldError>}
        </div>
      </section>

      {/* Options */}
      <section
        style={{
          background: "white",
          border: "1px solid var(--ink-200)",
          borderRadius: 18,
          padding: "var(--space-6)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-5)",
        }}
      >
        <div>
          <label style={labelStyle}>Options</label>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 14px",
              border: `1px solid ${dangerousAvailable ? "var(--ink-300)" : "var(--ink-200)"}`,
              borderRadius: 12,
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              color: dangerousAvailable ? "var(--ink-700)" : "var(--ink-400)",
              background: "white",
              cursor: dangerousAvailable && !isPending ? "pointer" : "not-allowed",
            }}
          >
            <input
              type="checkbox"
              checked={dangerous}
              disabled={!dangerousAvailable || isPending}
              onChange={(e) => setDangerous(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: "var(--coral-500)" }}
            />
            <span style={{ flex: 1 }}>Mon chien est de catégorie 1 ou 2 (+5€)</span>
            {!dangerousAvailable && (
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: "var(--ink-500)",
                }}
              >
                Sitter non compatible
              </span>
            )}
          </label>
        </div>

        {zoneOptions.length > 0 && (
          <div>
            <label htmlFor="meeting_zone_id" style={labelStyle}>
              Lieu de prise en charge
            </label>
            <select
              id="meeting_zone_id"
              value={meetingZoneId}
              onChange={(e) => setMeetingZoneId(e.target.value)}
              style={inputStyle(!!fieldErrors.meeting_zone_id)}
              disabled={isPending}
            >
              <option value="">À convenir avec le sitter</option>
              {zoneOptions.map((z) => (
                <option key={z.id} value={z.id}>
                  {zoneLabel(z.id)}
                </option>
              ))}
            </select>
            {fieldErrors.meeting_zone_id && <FieldError>{fieldErrors.meeting_zone_id}</FieldError>}
          </div>
        )}

        <div>
          <label htmlFor="client_notes" style={labelStyle}>
            Instructions pour le sitter (facultatif)
          </label>
          <textarea
            id="client_notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            placeholder="Ex : Milo est calme, il a peur des feux d'artifice. Sa laisse est rouge."
            style={textareaStyle(!!fieldErrors.client_notes)}
            disabled={isPending}
          />
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--ink-500)",
              marginTop: 4,
              textAlign: "right",
            }}
          >
            {notes.length} / 500
          </div>
          {fieldErrors.client_notes && <FieldError>{fieldErrors.client_notes}</FieldError>}
        </div>
      </section>

      {/* Total */}
      <section
        style={{
          background: "var(--ink-900)",
          color: "white",
          borderRadius: 18,
          padding: "var(--space-5) var(--space-6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              opacity: 0.7,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Total à payer
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, opacity: 0.6, marginTop: 4 }}>
            {duration}h
            {dangerous && " · cat. 1/2"}
            {(hour ?? 0) >= 19 && " · tardive"}
          </div>
        </div>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 36,
            letterSpacing: "-0.02em",
            lineHeight: 1,
          }}
        >
          {formatEuros(breakdown.price_cents)}
        </div>
      </section>

      {error && (
        <div
          style={{
            background: "var(--danger-50)",
            color: "var(--danger-700)",
            border: "1px solid var(--danger-500)",
            padding: "10px 14px",
            borderRadius: 12,
            fontFamily: "var(--font-mono)",
            fontSize: 12,
          }}
          role="alert"
        >
          {error}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={isPending || hour === null || validHours.length === 0}
        >
          {isPending ? "Redirection…" : "Payer et confirmer"}
          <Icon name="arrow" size={16} color="white" />
        </button>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--ink-500)",
            textAlign: "center",
          }}
        >
          Paiement sécurisé Stripe — réservation au nom de {clientName}
        </div>
      </div>
    </form>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        color: "var(--danger-700)",
        marginTop: 4,
      }}
    >
      {children}
    </div>
  );
}
