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

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS: Record<Step, string> = {
  1: "Date",
  2: "Durée",
  3: "Options",
  4: "Récap",
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

// Sun=0…Sat=6 to match sitter_availability.weekday.
function weekdayOfDateString(dateStr: string): number {
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

// "Late" surcharge mirrors the server: starts at or after 19h00 Paris time.
const LATE_MINUTES_THRESHOLD = 19 * 60;

function formatDateLong(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: PARIS_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
}

/** "07:00" -> "Tôt le matin", "09:30" -> "Matinée", etc. */
function periodLabel(startMin: number): string {
  if (startMin < 9 * 60) return "Tôt le matin";
  if (startMin < 12 * 60) return "Matinée";
  if (startMin < 14 * 60) return "Midi";
  if (startMin < 18 * 60) return "Après-midi";
  return "Soirée";
}

const DURATIONS: Duration[] = [1, 2, 3];

// =============================================================
// Component
// =============================================================
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

  // Step 1 picks date + start time using the most permissive filter (1h),
  // so the client sees every viable starting point before committing to a
  // duration. Duration is picked in step 2 where impossible options are
  // disabled per the actually-available window at the chosen start.
  const validStartMins = useMemo(() => {
    return computeValidStartMins({ date, duration: 1, slots, today });
  }, [date, slots, today]);

  // Max duration (1/2/3 h) that fits the sitter's weekly slots at the
  // currently selected start. 0 means nothing fits (shouldn't happen since
  // validStartMins guarantees ≥ 1h).
  const maxDuration = useMemo<Duration | 0>(() => {
    if (startMin === null) return 0;
    const weekday = weekdayOfDateString(date);
    const slotsForDay = slots.filter((s) => s.weekday === weekday);
    for (const d of [3, 2, 1] as const) {
      const fits = slotsForDay.some(
        (s) => timeToMinutes(s.start_time) <= startMin && timeToMinutes(s.end_time) >= startMin + d * 60,
      );
      if (fits) return d;
    }
    return 0;
  }, [date, slots, startMin]);

  // Live pricing preview. Server is authoritative; this is purely for UX.
  const breakdown = useMemo(() => {
    const late = (startMin ?? 0) >= LATE_MINUTES_THRESHOLD;
    return calculatePrice({
      duration,
      dangerous_breed: dangerous,
      late,
      urgent: false,
    });
  }, [duration, dangerous, startMin]);

  // Drop the selected start time if it's no longer valid after a date change.
  if (startMin !== null && !validStartMins.includes(startMin)) {
    setStartMin(null);
  }
  // Snap duration down if it no longer fits the chosen start.
  if (maxDuration !== 0 && duration > maxDuration) {
    setDuration(maxDuration);
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
    setStep((s) => (s < 4 ? ((s + 1) as Step) : s));
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
        window.location.href = result.redirectTo;
      } else {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  };

  const onBackArrow = () => {
    if (step > 1) {
      goPrev();
    } else if (typeof window !== "undefined") {
      window.location.href = `/sitters/${sitter.id}`;
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}
    >
      {/* Back arrow (top-left): goes to previous step, or sitter profile on step 1 */}
      <button
        type="button"
        onClick={onBackArrow}
        aria-label={step > 1 ? "Étape précédente" : "Retour au profil du sitter"}
        disabled={isPending}
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          border: "1.5px solid var(--ink-200)",
          background: "white",
          color: "var(--ink-700)",
          fontSize: 20,
          fontWeight: 700,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          lineHeight: 1,
          alignSelf: "flex-start",
        }}
      >
        ‹
      </button>

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
          <h2 id="step-1-title" style={stepTitleStyle}>Date &amp; heure</h2>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              color: "var(--ink-600)",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Quand veux-tu que la garde commence ? Tu choisiras la durée juste après.
          </p>

          <div className="booking-datetime-grid">
            <BookingCalendar
              selectedDate={date}
              onSelect={setDate}
              today={today}
              maxDate={maxDate}
              slots={slots}
            />
            <SlotList
              validStartMins={validStartMins}
              selected={startMin}
              onSelect={setStartMin}
              date={date}
            />
          </div>
        </section>
      )}

      {step === 2 && (
        <section style={cardStyle} aria-labelledby="step-2-title">
          <h2 id="step-2-title" style={stepTitleStyle}>Durée</h2>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              color: "var(--ink-600)",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Combien de temps la garde doit-elle durer ?{" "}
            {maxDuration > 0 && maxDuration < 3 && (
              <span style={{ color: "var(--ink-500)" }}>
                À partir de {startMin !== null ? formatHHMM(startMin) : "ce créneau"}, jusqu'à {maxDuration}h possible.
              </span>
            )}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {DURATIONS.map((d) => {
              const on = d === duration;
              const disabled = isPending || (maxDuration > 0 && d > maxDuration);
              const price = calculatePrice({ duration: d }).price_cents;
              return (
                <button
                  type="button"
                  key={d}
                  aria-pressed={on}
                  onClick={() => setDuration(d)}
                  disabled={disabled}
                  title={disabled && !isPending ? "Ne rentre pas dans le créneau choisi" : undefined}
                  style={{
                    padding: "18px 8px",
                    borderRadius: 14,
                    border: `2px solid ${on ? "var(--coral-500)" : "var(--ink-200)"}`,
                    background: on ? "var(--coral-50)" : "white",
                    color: on ? "var(--coral-700)" : "var(--ink-900)",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled && !on ? 0.4 : 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 400, lineHeight: 1 }}>
                    {d}h
                  </span>
                  <span style={{ fontSize: 12, color: on ? "var(--coral-700)" : "var(--ink-500)" }}>
                    {formatEuros(price)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {step === 3 && (
        <section style={cardStyle} aria-labelledby="step-3-title">
          <h2 id="step-3-title" style={stepTitleStyle}>Options</h2>
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

      {step === 4 && (
        <>
          <section style={cardStyle} aria-labelledby="step-4-title">
            <h2 id="step-4-title" style={stepTitleStyle}>Récapitulatif</h2>
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

      {/* Nav (Précédent now lives in the top-left arrow above) */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {step < 4 ? (
          <button
            type="button"
            className="btn btn-primary btn-lg btn-block"
            onClick={goNext}
            disabled={isPending || (step === 1 && !canLeaveStep1)}
          >
            Suivant
            <Icon name="arrow" size={16} color="white" />
          </button>
        ) : (
          <button
            type="submit"
            className="btn btn-primary btn-lg btn-block"
            disabled={isPending || startMin === null || validStartMins.length === 0}
          >
            {isPending ? "Redirection…" : "Payer et confirmer"}
            <Icon name="arrow" size={16} color="white" />
          </button>
        )}
        {step === 4 && (
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

// =============================================================
// Calendar
// =============================================================

// Returns YYYY-MM-DD using Paris semantics (we only care about calendar date).
function isoFromYMD(y: number, m0: number, d: number): string {
  return `${y}-${String(m0 + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function computeValidStartMins({
  date,
  duration,
  slots,
  today,
}: {
  date: string;
  duration: Duration;
  slots: Slot[];
  today: string;
}): number[] {
  const weekday = weekdayOfDateString(date);
  const slotsForDay = slots.filter((s) => s.weekday === weekday);
  if (slotsForDay.length === 0) return [];
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
}

const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const WEEKDAY_LABELS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

function BookingCalendar({
  selectedDate,
  onSelect,
  today,
  maxDate,
  slots,
}: {
  selectedDate: string;
  onSelect: (date: string) => void;
  today: string;
  maxDate: string;
  slots: Slot[];
}) {
  // Open the calendar on the month of the currently selected date.
  const [year, month0] = useMemo(() => {
    const [y, m] = selectedDate.split("-").map(Number);
    return [y ?? new Date().getFullYear(), (m ?? 1) - 1];
  }, [selectedDate]);
  const [viewYear, setViewYear] = useState(year);
  const [viewMonth0, setViewMonth0] = useState(month0);

  // Step 1 only filters days that have at least 1h available - duration is
  // picked in step 2 so we stay permissive here.
  const { cells, canPrev, canNext } = useMemo(() => {
    return buildCalendarCells({ viewYear, viewMonth0, today, maxDate, duration: 1, slots });
  }, [viewYear, viewMonth0, today, maxDate, slots]);

  const goPrev = () => {
    if (!canPrev) return;
    const next0 = viewMonth0 - 1;
    if (next0 < 0) {
      setViewMonth0(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth0(next0);
    }
  };
  const goNext = () => {
    if (!canNext) return;
    const next0 = viewMonth0 + 1;
    if (next0 > 11) {
      setViewMonth0(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth0(next0);
    }
  };

  return (
    <div
      className="booking-calendar-card"
      style={{
        border: "1px solid var(--ink-200)",
        borderRadius: 18,
        background: "white",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <button
          type="button"
          aria-label="Mois précédent"
          onClick={goPrev}
          disabled={!canPrev}
          style={calendarNavBtn}
        >
          ‹
        </button>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 14,
            fontWeight: 700,
            color: "var(--ink-900)",
            textAlign: "center",
            flex: 1,
          }}
        >
          {MONTH_NAMES[viewMonth0]} {viewYear}
        </div>
        <button
          type="button"
          aria-label="Mois suivant"
          onClick={goNext}
          disabled={!canNext}
          style={calendarNavBtn}
        >
          ›
        </button>
      </div>

      {/* Weekday header */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {WEEKDAY_LABELS.map((w) => (
          <div
            key={w}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              fontWeight: 600,
              color: "var(--ink-500)",
              textAlign: "center",
              padding: "4px 0",
            }}
          >
            {w}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {cells.map((c) => {
          const isSelected = c.date === selectedDate;
          const clickable = c.isAvailable;
          // Visual states:
          //  - selected (filled coral circle)
          //  - today (coral text, ring)
          //  - available (default ink)
          //  - faded (out of range or no slot)
          //  - out-of-month (very faded)
          const color = isSelected
            ? "white"
            : !c.inMonth
              ? "var(--ink-300)"
              : !clickable
                ? "var(--ink-300)"
                : c.isToday
                  ? "var(--coral-600)"
                  : "var(--ink-900)";
          return (
            <div key={c.date} style={{ display: "flex", justifyContent: "center", padding: "2px 0", minWidth: 0 }}>
              <button
                type="button"
                onClick={() => clickable && onSelect(c.date)}
                disabled={!clickable}
                aria-pressed={isSelected}
                aria-label={c.date}
                style={{
                  width: "100%",
                  maxWidth: 44,
                  aspectRatio: "1 / 1",
                  borderRadius: "50%",
                  border: c.isToday && !isSelected ? "1.5px solid var(--coral-500)" : "1.5px solid transparent",
                  background: isSelected ? "var(--coral-500)" : "transparent",
                  color,
                  fontFamily: "var(--font-mono)",
                  fontSize: 14,
                  fontWeight: isSelected || c.isToday ? 700 : 500,
                  cursor: clickable ? "pointer" : "not-allowed",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 120ms ease",
                }}
              >
                {c.dayOfMonth}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const calendarNavBtn: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 16,
  border: "1.5px solid var(--ink-200)",
  background: "white",
  color: "var(--ink-700)",
  fontSize: 18,
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
  padding: 0,
};

type CalendarCell = {
  date: string;
  dayOfMonth: number;
  inMonth: boolean;
  isToday: boolean;
  isAvailable: boolean;
};

function buildCalendarCells({
  viewYear,
  viewMonth0,
  today,
  maxDate,
  duration,
  slots,
}: {
  viewYear: number;
  viewMonth0: number;
  today: string;
  maxDate: string;
  duration: Duration;
  slots: Slot[];
}): { cells: CalendarCell[]; canPrev: boolean; canNext: boolean } {
  // First day of the displayed month (UTC noon to avoid DST shifts).
  const firstOfMonth = new Date(Date.UTC(viewYear, viewMonth0, 1, 12, 0, 0));
  // JS getUTCDay: Sun=0..Sat=6. Calendar is Monday-first, so shift.
  const jsDay = firstOfMonth.getUTCDay();
  const offsetToMonday = (jsDay + 6) % 7;
  // Start = Monday on or before the 1st.
  const start = new Date(firstOfMonth);
  start.setUTCDate(firstOfMonth.getUTCDate() - offsetToMonday);

  const cells: CalendarCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const y = d.getUTCFullYear();
    const m0 = d.getUTCMonth();
    const dom = d.getUTCDate();
    const date = isoFromYMD(y, m0, dom);
    const inMonth = m0 === viewMonth0 && y === viewYear;
    const inRange = date >= today && date <= maxDate;
    const isToday = date === today;
    let isAvailable = false;
    if (inRange) {
      // Cheap day-level check: does the sitter have ANY weekly slot for this
      // weekday that can fit the chosen duration? For today, also require at
      // least one half-hour increment ≥ now.
      const weekday = weekdayOfDateString(date);
      const slotsForDay = slots.filter((s) => s.weekday === weekday);
      if (slotsForDay.length > 0) {
        const earliest = date === today ? currentMinutesInParis() + 1 : 0;
        outer: for (let mins = 0; mins <= 23 * 60 + 30; mins += 30) {
          if (mins < earliest) continue;
          const endMin = mins + duration * 60;
          for (const s of slotsForDay) {
            if (timeToMinutes(s.start_time) <= mins && timeToMinutes(s.end_time) >= endMin) {
              isAvailable = true;
              break outer;
            }
          }
        }
      }
    }
    cells.push({ date, dayOfMonth: dom, inMonth, isToday, isAvailable });
  }

  // Prev/next month navigation gates: don't go past today's month, nor past
  // the maxDate month.
  const [ty, tm0] = parseYearMonth(today);
  const [xy, xm0] = parseYearMonth(maxDate);
  const canPrev = viewYear > ty || (viewYear === ty && viewMonth0 > tm0);
  const canNext = viewYear < xy || (viewYear === xy && viewMonth0 < xm0);

  return { cells, canPrev, canNext };
}

function parseYearMonth(iso: string): [number, number] {
  const [y, m] = iso.split("-").map(Number);
  return [y ?? 0, (m ?? 1) - 1];
}

// =============================================================
// Slot list
// =============================================================

function SlotList({
  validStartMins,
  selected,
  onSelect,
  date,
}: {
  validStartMins: number[];
  selected: number | null;
  onSelect: (m: number) => void;
  date: string;
}) {
  if (validStartMins.length === 0) {
    return (
      <div
        style={{
          border: "1px dashed var(--ink-300)",
          borderRadius: 18,
          padding: "var(--space-6)",
          background: "var(--ink-50)",
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          color: "var(--ink-600)",
          lineHeight: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        Aucun créneau disponible le {formatDateLong(date)}. Choisis une autre date.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {validStartMins.map((m) => {
        const on = selected === m;
        const late = m >= LATE_MINUTES_THRESHOLD;
        return (
          <button
            key={m}
            type="button"
            onClick={() => onSelect(m)}
            aria-pressed={on}
            style={{
              border: `2px solid ${on ? "var(--coral-500)" : "var(--ink-200)"}`,
              borderRadius: 14,
              background: on ? "var(--coral-50)" : "white",
              padding: "14px 16px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              textAlign: "left",
              transition: "border-color 120ms ease, background 120ms ease",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 16,
                  fontWeight: 700,
                  color: on ? "var(--coral-700)" : "var(--ink-900)",
                }}
              >
                {formatHHMM(m)}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--ink-500)",
                }}
              >
                {periodLabel(m)}
              </span>
            </div>
            {late && (
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--coral-700)",
                  background: "var(--peach-100)",
                  borderRadius: 999,
                  padding: "4px 10px",
                  whiteSpace: "nowrap",
                }}
              >
                +8€
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// =============================================================
// Small helpers (recap row, step indicator, field error)
// =============================================================

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
  const steps: Step[] = [1, 2, 3, 4];
  return (
    <ol
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
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
            style={{ display: "flex", alignItems: "center", flex: 1, gap: 6, minWidth: 0 }}
            aria-current={isCurrent ? "step" : undefined}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                flex: "0 0 auto",
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
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
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: isCurrent ? "var(--coral-600)" : "var(--ink-500)",
                  whiteSpace: "nowrap",
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
                  minWidth: 8,
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
