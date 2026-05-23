"use client";

import { useMemo, useState, useTransition } from "react";

import { createBookingAction } from "@/lib/booking/actions";
import { calculatePrice, formatEuros, type Duration } from "@/lib/booking/pricing";
import { ZONES, zoneLabel } from "@/lib/zones";
import { Icon } from "@/components/mascot";
import { Initials } from "@/components/Initials";

const PARIS_TZ = "Europe/Paris";

type Slot = { weekday: number; start_time: string; end_time: string };

type Props = {
  sitter: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    accepts_dangerous_breeds: boolean;
  };
  slots: Slot[];
  clientName: string;
};

type Step = 1 | 2 | 3;

const STEP_LABELS: Record<Step, string> = {
  1: "Date",
  2: "Options",
  3: "Récap",
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

const cardStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid var(--ink-200)",
  borderRadius: 18,
  padding: "var(--space-6)",
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-5)",
};

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
  // Using noon avoids any DST edge - we only care about the calendar day in Paris.
  const d = new Date(`${dateStr}T12:00:00Z`);
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone: PARIS_TZ,
    weekday: "short",
  }).format(d);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(name);
}

function currentMinutesInParis(): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: PARIS_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return h * 60 + m;
}

function formatHHMM(minutesSinceMidnight: number): string {
  const h = Math.floor(minutesSinceMidnight / 60);
  const m = minutesSinceMidnight % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// "Late" surcharge mirrors the server: starts at or after 19h30 Paris time.
const LATE_MINUTES_THRESHOLD = 19 * 60 + 30;

function formatDateLong(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: PARIS_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
}

const DURATIONS: Duration[] = [1, 2, 3];

export default function ReservationForm({ sitter, slots, clientName }: Props) {
  const today = todayInParis();
  const maxDate = maxDateInParis(30);

  const [step, setStep] = useState<Step>(1);
  const [date, setDate] = useState<string>(today);
  // Start time as minutes since midnight (Paris). Half-hour grid: 0, 30, 60, 90…
  const [startMin, setStartMin] = useState<number | null>(null);
  const [duration, setDuration] = useState<Duration>(1);
  const [dangerous, setDangerous] = useState(false);
  const [meetingZoneId, setMeetingZoneId] = useState<string>("");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  // Half-hour start slots the sitter actually offers on the chosen date for
  // the chosen duration. Computed locally - server re-validates the same rule.
  const validStartMins = useMemo(() => {
    const weekday = weekdayOfDateString(date);
    const slotsForDay = slots.filter((s) => s.weekday === weekday);
    if (slotsForDay.length === 0) return [];
    // For today, only propose slots starting strictly after "now + 1 min" -
    // matches the spirit of the previous "next full hour" guard while
    // supporting the finer 30-min grid.
    const earliest = date === today ? currentMinutesInParis() + 1 : 0;
    const result: number[] = [];
    for (let m = 0; m <= 23 * 60 + 30; m += 30) {
      if (m < earliest) continue;
      const endMin = m + duration * 60;
      const fits = slotsForDay.some(
        (s) => timeToMinutes(s.start_time) <= m && timeToMinutes(s.end_time) >= endMin,
      );
      if (fits) result.push(m);
    }
    return result;
  }, [date, duration, slots, today]);

  // Live pricing preview. Server is authoritative; this is purely for UX.
  const breakdown = useMemo(() => {
    const late = (startMin ?? 0) >= LATE_MINUTES_THRESHOLD;
    return calculatePrice({
      duration,
      dangerous_breed: dangerous,
      late,
      // Urgent isn't shown live (the threshold is 30min and we'd need a tick) -
      // we lean on server to apply it. UI stays calm.
      urgent: false,
    });
  }, [duration, dangerous, startMin]);

  // Drop the selected start time if it's no longer valid after a date/duration change.
  if (startMin !== null && !validStartMins.includes(startMin)) {
    // setState during render is acceptable here: it self-converges in one extra
    // render and no effect/event would land before the user's next interaction.
    setStartMin(null);
  }

  const dangerousAvailable = sitter.accepts_dangerous_breeds;
  const zoneOptions = ZONES;

  const canLeaveStep1 = startMin !== null;

  const goNext = () => {
    setError(null);
    if (step === 1 && !canLeaveStep1) {
      setError("Choisis une heure de début.");
      return;
    }
    setStep((s) => (s < 3 ? ((s + 1) as Step) : s));
  };

  const goPrev = () => {
    setError(null);
    setStep((s) => (s > 1 ? ((s - 1) as Step) : s));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (startMin === null) {
      setError("Choisis une heure de début.");
      setFieldErrors({ start_hour: "Heure requise" });
      setStep(1);
      return;
    }

    const fd = new FormData();
    fd.append("sitter_id", sitter.id);
    fd.append("start_date", date);
    fd.append("start_hour", String(Math.floor(startMin / 60)));
    fd.append("start_minute", String(startMin % 60));
    fd.append("duration_hours", String(duration));
    fd.append("dangerous_breed", dangerous ? "true" : "false");
    if (meetingZoneId) fd.append("meeting_zone_id", meetingZoneId);
    if (notes.trim()) fd.append("client_notes", notes.trim());

    startTransition(async () => {
      const result = await createBookingAction(fd);
      if (result.ok) {
        // Hard redirect to Stripe - leaves the SPA cleanly.
        window.location.href = result.redirectTo;
      } else {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}
    >
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
            <Initials name={sitter.full_name} size={64} />
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

      <StepIndicator current={step} />

      {step === 1 && (
        <section style={cardStyle} aria-labelledby="step-1-title">
          <h2 id="step-1-title" style={stepTitleStyle}>Date de garde</h2>
          <div>
            <label htmlFor="start_date" style={labelStyle}>
              Date
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
            {validStartMins.length === 0 ? (
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
                value={startMin ?? ""}
                onChange={(e) => setStartMin(e.target.value === "" ? null : Number(e.target.value))}
                style={inputStyle(!!fieldErrors.start_hour)}
                disabled={isPending}
                required
              >
                <option value="" disabled>
                  Choisir…
                </option>
                {validStartMins.map((m) => (
                  <option key={m} value={m}>
                    {formatHHMM(m)} – {formatHHMM(m + duration * 60)}
                  </option>
                ))}
              </select>
            )}
            {fieldErrors.start_hour && <FieldError>{fieldErrors.start_hour}</FieldError>}
          </div>
        </section>
      )}

      {step === 2 && (
        <section style={cardStyle} aria-labelledby="step-2-title">
          <h2 id="step-2-title" style={stepTitleStyle}>Options</h2>
          <div>
            <label style={labelStyle}>Catégorie du chien</label>
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
      )}

      {step === 3 && (
        <>
          <section style={cardStyle} aria-labelledby="step-3-title">
            <h2 id="step-3-title" style={stepTitleStyle}>Récapitulatif</h2>
            <dl style={recapListStyle}>
              <RecapRow label="Date" value={date ? formatDateLong(date) : "—"} />
              <RecapRow
                label="Créneau"
                value={
                  startMin !== null
                    ? `${formatHHMM(startMin)} – ${formatHHMM(startMin + duration * 60)}`
                    : "—"
                }
              />
              <RecapRow label="Durée" value={`${duration}h`} />
              {dangerous && <RecapRow label="Catégorie 1/2" value="Oui (+5€)" />}
              <RecapRow
                label="Lieu"
                value={meetingZoneId ? zoneLabel(meetingZoneId) : "À convenir avec le sitter"}
              />
              {notes.trim() && <RecapRow label="Instructions" value={notes.trim()} multiline />}
            </dl>
          </section>

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
                {(startMin ?? 0) >= LATE_MINUTES_THRESHOLD && " · tardive"}
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
        </>
      )}

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

      {/* Nav */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", gap: 10 }}>
          {step > 1 && (
            <button
              type="button"
              className="btn btn-outline btn-lg"
              onClick={goPrev}
              disabled={isPending}
              style={{ flex: "0 0 auto" }}
            >
              Précédent
            </button>
          )}
          {step < 3 ? (
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={goNext}
              disabled={isPending || (step === 1 && !canLeaveStep1)}
              style={{ flex: 1 }}
            >
              Suivant
              <Icon name="arrow" size={16} color="white" />
            </button>
          ) : (
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={isPending || startMin === null || validStartMins.length === 0}
              style={{ flex: 1 }}
            >
              {isPending ? "Redirection…" : "Payer et confirmer"}
              <Icon name="arrow" size={16} color="white" />
            </button>
          )}
        </div>
        {step === 3 && (
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--ink-500)",
              textAlign: "center",
            }}
          >
            Paiement sécurisé Stripe - réservation au nom de {clientName}
          </div>
        )}
      </div>
    </form>
  );
}

const stepTitleStyle: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontWeight: 400,
  fontSize: 20,
  letterSpacing: "-0.01em",
  margin: 0,
  color: "var(--ink-900)",
};

const recapListStyle: React.CSSProperties = {
  margin: 0,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

function RecapRow({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: multiline ? "column" : "row",
        gap: multiline ? 4 : 12,
        justifyContent: "space-between",
        alignItems: multiline ? "flex-start" : "baseline",
        paddingBottom: 10,
        borderBottom: "1px dashed var(--ink-200)",
      }}
    >
      <dt
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--ink-500)",
        }}
      >
        {label}
      </dt>
      <dd
        style={{
          margin: 0,
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          color: "var(--ink-900)",
          textAlign: multiline ? "left" : "right",
          whiteSpace: multiline ? "pre-wrap" : "normal",
        }}
      >
        {value}
      </dd>
    </div>
  );
}

function StepIndicator({ current }: { current: Step }) {
  const steps: Step[] = [1, 2, 3];
  return (
    <ol
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        listStyle: "none",
        padding: 0,
        margin: 0,
      }}
      aria-label="Étapes de réservation"
    >
      {steps.map((s, i) => {
        const isCurrent = s === current;
        const isDone = s < current;
        const isFuture = s > current;
        return (
          <li
            key={s}
            style={{ display: "flex", alignItems: "center", flex: 1, gap: 8 }}
            aria-current={isCurrent ? "step" : undefined}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flex: "0 0 auto",
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  fontWeight: 700,
                  background: isDone || isCurrent ? "var(--coral-500)" : "white",
                  color: isDone || isCurrent ? "white" : "var(--ink-500)",
                  border: `1.5px solid ${isFuture ? "var(--ink-300)" : "var(--coral-500)"}`,
                }}
              >
                {isDone ? "✓" : s}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: isCurrent ? "var(--coral-600)" : "var(--ink-500)",
                }}
              >
                {STEP_LABELS[s]}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span
                aria-hidden
                style={{
                  flex: 1,
                  height: 1.5,
                  background: isDone ? "var(--coral-500)" : "var(--ink-200)",
                  borderRadius: 1,
                }}
              />
            )}
          </li>
        );
      })}
    </ol>
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
