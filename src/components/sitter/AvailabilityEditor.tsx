"use client";

import { useState, useTransition } from "react";

import { replaceAvailabilityAction } from "@/lib/sitter/actions";

type Slot = {
  // Stable client-only id for React keys; not sent to the server.
  key: string;
  weekday: number;
  start_time: string;
  end_time: string;
};

type Props = {
  initial: { weekday: number; start_time: string; end_time: string }[];
};

// Display order: Monday first (French convention), Sunday last.
// DB uses 0=Sunday … 6=Saturday, so we map back/forth.
const DAYS = [
  { dbValue: 1, label: "Lundi" },
  { dbValue: 2, label: "Mardi" },
  { dbValue: 3, label: "Mercredi" },
  { dbValue: 4, label: "Jeudi" },
  { dbValue: 5, label: "Vendredi" },
  { dbValue: 6, label: "Samedi" },
  { dbValue: 0, label: "Dimanche" },
];

const MAX_SLOTS_PER_DAY = 4;

let __slotCounter = 0;
const nextKey = () => `slot-${++__slotCounter}-${Date.now()}`;

function trimSeconds(t: string): string {
  // DB returns "HH:MM:SS"; the <input type="time"> wants "HH:MM".
  return /^\d{2}:\d{2}/.test(t) ? t.slice(0, 5) : t;
}

export default function AvailabilityEditor({ initial }: Props) {
  const [slots, setSlots] = useState<Slot[]>(() =>
    initial.map((s) => ({
      key: nextKey(),
      weekday: s.weekday,
      start_time: trimSeconds(s.start_time),
      end_time: trimSeconds(s.end_time),
    })),
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const slotsForDay = (weekday: number) => slots.filter((s) => s.weekday === weekday);

  const addSlot = (weekday: number) => {
    if (slotsForDay(weekday).length >= MAX_SLOTS_PER_DAY) return;
    setSlots((s) => [
      ...s,
      { key: nextKey(), weekday, start_time: "09:00", end_time: "12:00" },
    ]);
    setSuccess(null);
  };

  const removeSlot = (key: string) => {
    setSlots((s) => s.filter((slot) => slot.key !== key));
    setSuccess(null);
  };

  const updateSlot = (key: string, patch: Partial<Pick<Slot, "start_time" | "end_time">>) => {
    setSlots((s) => s.map((slot) => (slot.key === key ? { ...slot, ...patch } : slot)));
    setSuccess(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Client-side guard for clearer messages; server re-validates with Zod.
    for (const s of slots) {
      if (s.end_time <= s.start_time) {
        setError(`L'heure de fin doit être après l'heure de début sur tous les créneaux.`);
        return;
      }
    }

    const payload = slots.map((s) => ({
      weekday: s.weekday,
      start_time: s.start_time,
      end_time: s.end_time,
    }));
    const fd = new FormData();
    fd.append("slots", JSON.stringify(payload));

    startTransition(async () => {
      const result = await replaceAvailabilityAction(fd);
      if (result.ok) {
        setSuccess("Planning enregistré.");
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {DAYS.map((day) => {
          const daySlots = slotsForDay(day.dbValue);
          const canAdd = daySlots.length < MAX_SLOTS_PER_DAY;
          return (
            <div
              key={day.dbValue}
              style={{
                background: "white",
                border: "1px solid var(--ink-200)",
                borderRadius: 16,
                padding: "var(--space-5)",
                display: "grid",
                gridTemplateColumns: "120px 1fr",
                gap: 16,
                alignItems: "start",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--ink-900)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  paddingTop: 8,
                }}
              >
                {day.label}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {daySlots.length === 0 ? (
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: "var(--ink-500)",
                      padding: "8px 0",
                    }}
                  >
                    Indisponible
                  </div>
                ) : (
                  daySlots.map((slot) => (
                    <div key={slot.key} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        type="time"
                        value={slot.start_time}
                        onChange={(e) => updateSlot(slot.key, { start_time: e.target.value })}
                        disabled={isPending}
                        style={timeInput}
                      />
                      <span style={{ color: "var(--ink-500)", fontFamily: "var(--font-mono)", fontSize: 12 }}>→</span>
                      <input
                        type="time"
                        value={slot.end_time}
                        onChange={(e) => updateSlot(slot.key, { end_time: e.target.value })}
                        disabled={isPending}
                        style={timeInput}
                      />
                      <button
                        type="button"
                        onClick={() => removeSlot(slot.key)}
                        disabled={isPending}
                        aria-label="Supprimer ce créneau"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          background: "transparent",
                          color: "var(--ink-500)",
                          border: "1px solid var(--ink-200)",
                          cursor: "pointer",
                          fontSize: 18,
                          lineHeight: 1,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
                {canAdd && (
                  <button
                    type="button"
                    onClick={() => addSlot(day.dbValue)}
                    disabled={isPending}
                    style={{
                      alignSelf: "flex-start",
                      padding: "6px 12px",
                      background: "var(--coral-50)",
                      color: "var(--coral-700)",
                      border: "1px dashed var(--coral-300)",
                      borderRadius: 999,
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    + Ajouter un créneau
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

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

      {success && (
        <div
          style={{
            background: "var(--success-50)",
            color: "var(--success-700)",
            border: "1px solid var(--success-500)",
            padding: "10px 14px",
            borderRadius: 12,
            fontFamily: "var(--font-mono)",
            fontSize: 12,
          }}
          role="status"
        >
          {success}
        </div>
      )}

      <div>
        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {isPending ? "Enregistrement…" : "Enregistrer le planning"}
        </button>
      </div>
    </form>
  );
}

const timeInput: React.CSSProperties = {
  height: 36,
  padding: "0 10px",
  background: "white",
  border: "1px solid var(--ink-300)",
  borderRadius: 8,
  fontFamily: "var(--font-mono)",
  fontSize: 13,
  color: "var(--ink-900)",
  outline: "none",
};
