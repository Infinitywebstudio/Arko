import type { Metadata } from "next";
import Link from "next/link";

import { Arko, Icon, type ArkoMood } from "@/components/mascot";
import { listAllSitters } from "@/lib/sitter/helpers";
import { calculatePrice, formatEuros } from "@/lib/booking/pricing";
import { zoneLabel } from "@/lib/zones";

export const metadata: Metadata = {
  title: "Tous les dog-sitters · ARKO",
  description: "Parcours tous les dog-sitters ARKO disponibles dans Arles.",
};

const FALLBACK_COLLARS = ["#FF5A5F", "#1B2A49", "#2E7D5B", "#F4A261"];
const FALLBACK_MOODS: ArkoMood[] = ["happy", "waggy", "alert", "sleepy"];
const ENTRY_PRICE = formatEuros(calculatePrice({ duration: 1 }).price_cents);

function displayName(full: string | null): string {
  if (!full) return "Sitter";
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]!;
  return `${parts[0]} ${parts[parts.length - 1]![0]!}.`;
}

export default async function SittersListPage() {
  const sitters = await listAllSitters();

  return (
    <article style={{ maxWidth: 1280, margin: "0 auto", padding: "var(--space-12) var(--space-6)" }}>
      <header style={{ marginBottom: "var(--space-10)" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--coral-600)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: "var(--space-4)",
            fontWeight: 600,
          }}
        >
          Dog-sitters · Arles
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: "clamp(48px, 6vw, 80px)",
            letterSpacing: "-0.02em",
            lineHeight: 1.02,
            margin: 0,
            marginBottom: "var(--space-4)",
          }}
        >
          Trouve ton{" "}
          <span style={{ fontStyle: "italic", color: "var(--coral-500)" }}>sitter</span>
        </h1>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 14,
            color: "var(--ink-600)",
            lineHeight: 1.6,
            maxWidth: 640,
            margin: 0,
          }}
        >
          {sitters.length === 0
            ? "Aucun sitter inscrit pour le moment."
            : `${sitters.length} dog-sitter${sitters.length > 1 ? "s" : ""} disponible${sitters.length > 1 ? "s" : ""}. À partir de ${ENTRY_PRICE} pour 1 heure.`}
        </p>
      </header>

      {sitters.length === 0 ? (
        <EmptyState />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "var(--space-5)",
          }}
        >
          {sitters.map((s, i) => (
            <SitterCard key={s.id ?? i} sitter={s} index={i} />
          ))}
        </div>
      )}
    </article>
  );
}

type SitterCardProps = {
  sitter: Awaited<ReturnType<typeof listAllSitters>>[number];
  index: number;
};

function SitterCard({ sitter, index }: SitterCardProps) {
  const collar = FALLBACK_COLLARS[index % FALLBACK_COLLARS.length]!;
  const mood = FALLBACK_MOODS[index % FALLBACK_MOODS.length]!;
  const id = sitter.id ?? "";
  const firstZoneLabel =
    sitter.service_zones && sitter.service_zones[0] ? zoneLabel(sitter.service_zones[0]) : null;
  const totalZones = sitter.service_zones?.length ?? 0;

  return (
    <Link
      href={id ? `/sitters/${id}` : "#"}
      className="card card-hover"
      style={{ display: "flex", flexDirection: "column", textDecoration: "none", color: "inherit" }}
    >
      <div
        style={{
          height: 200,
          background: sitter.avatar_url
            ? `url(${sitter.avatar_url}) center / cover no-repeat`
            : `linear-gradient(135deg, ${collar}22 0%, ${collar}55 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {!sitter.avatar_url && <Arko size={140} mood={mood} collar={collar} />}
      </div>
      <div style={{ padding: "var(--space-5)", display: "flex", flexDirection: "column", flex: 1, gap: 8 }}>
        <div style={{ fontWeight: 600, fontSize: 16 }}>{displayName(sitter.full_name)}</div>
        {firstZoneLabel && (
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--ink-500)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icon name="pin" size={12} />
            <span>
              {firstZoneLabel}
              {totalZones > 1 && ` +${totalZones - 1}`}
            </span>
          </div>
        )}
        {sitter.experience_years !== null && sitter.experience_years !== undefined && (
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--ink-500)",
            }}
          >
            {sitter.experience_years === 0
              ? "Débutant"
              : `${sitter.experience_years} an${sitter.experience_years > 1 ? "s" : ""} d'expérience`}
          </div>
        )}
        <div
          style={{
            marginTop: "auto",
            paddingTop: "var(--space-4)",
            borderTop: "1px solid var(--ink-200)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9,
                color: "var(--ink-500)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              à partir de
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 24,
                letterSpacing: "-0.02em",
                lineHeight: 1,
                marginTop: 2,
              }}
            >
              {ENTRY_PRICE}
            </div>
          </div>
          <span className="btn btn-primary btn-sm">Voir</span>
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        background: "white",
        border: "1px dashed var(--ink-300)",
        borderRadius: 24,
        padding: "var(--space-12)",
        textAlign: "center",
        fontFamily: "var(--font-mono)",
        fontSize: 14,
        color: "var(--ink-600)",
        lineHeight: 1.6,
      }}
    >
      Pas encore de sitter inscrit. Reviens dans quelques jours, ou{" "}
      <Link
        href="/inscription"
        style={{ color: "var(--coral-600)", fontWeight: 600, textDecoration: "underline" }}
      >
        deviens dog-sitter →
      </Link>
    </div>
  );
}
