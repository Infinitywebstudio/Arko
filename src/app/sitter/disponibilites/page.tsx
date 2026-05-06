import type { Metadata } from "next";

import { requireRole } from "@/lib/auth/helpers";
import { getSitterAvailability } from "@/lib/sitter/helpers";
import AvailabilityEditor from "@/components/sitter/AvailabilityEditor";

export const metadata: Metadata = {
  title: "Mes disponibilités · ARKO",
};

export default async function SitterAvailabilityPage() {
  const session = await requireRole("sitter");
  const slots = await getSitterAvailability(session.userId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
      <div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: "clamp(36px, 4vw, 48px)",
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
            margin: 0,
            marginBottom: 8,
          }}
        >
          Mes <span style={{ fontStyle: "italic", color: "var(--coral-500)" }}>disponibilités</span>
        </h1>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 14,
            color: "var(--ink-600)",
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          Indique tes créneaux pour chaque jour de la semaine. Tu peux mettre plusieurs créneaux par jour
          (matin / après-midi) jusqu&apos;à 4 par jour.
        </p>
      </div>

      <AvailabilityEditor
        initial={slots.map((s) => ({
          weekday: s.weekday,
          start_time: s.start_time,
          end_time: s.end_time,
        }))}
      />
    </div>
  );
}
