import type { Metadata } from "next";
import Link from "next/link";

import { Initials } from "@/components/Initials";
import { listAllSitters } from "@/lib/sitter/helpers";
import { calculatePrice, formatEuros } from "@/lib/booking/pricing";
import { HomeNav } from "@/components/homepage";
import { getCurrentUser, navUserFrom } from "@/lib/auth/helpers";

export const metadata: Metadata = {
  title: "Tous les dog-sitters · ARKO",
  description: "Parcourez tous les dog-sitters ARKO disponibles dans Arles.",
};

// Tints used for the gradient placeholder behind a sitter card when no photo.
const FALLBACK_COLLARS = ["#3C582E", "#1B2A49", "#2E7D5B", "#F4A261"];
const ENTRY_PRICE = formatEuros(calculatePrice({ duration: 1 }).price_cents);

function displayName(full: string | null): string {
  if (!full) return "Sitter";
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]!;
  return `${parts[0]} ${parts[parts.length - 1]![0]!}.`;
}

export default async function SittersListPage() {
  const sitters = await listAllSitters();
  const navUser = navUserFrom(await getCurrentUser());

  return (
    <>
      <HomeNav user={navUser} />
      <article style={{ maxWidth: 1280, margin: "0 auto", padding: "120px var(--space-6) var(--space-12)" }}>
      <header style={{ marginBottom: "var(--space-10)" }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: "clamp(32px, 4vw, 52px)",
            letterSpacing: "-0.02em",
            lineHeight: 1.02,
            margin: 0,
            marginBottom: "var(--space-4)",
          }}
        >
          Trouvez votre{" "}
          <span style={{ color: "var(--coral-500)" }}>sitter</span>
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
    </>
  );
}

type SitterCardProps = {
  sitter: Awaited<ReturnType<typeof listAllSitters>>[number];
  index: number;
};

function SitterCard({ sitter, index }: SitterCardProps) {
  const collar = FALLBACK_COLLARS[index % FALLBACK_COLLARS.length]!;
  const id = sitter.id ?? "";

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
        {!sitter.avatar_url && <Initials name={sitter.full_name} size={140} />}
      </div>
      <div style={{ padding: "var(--space-5)", display: "flex", flexDirection: "column", flex: 1, gap: 8 }}>
        <div style={{ fontWeight: 600, fontSize: 16 }}>{displayName(sitter.full_name)}</div>
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
      Pas encore de sitter inscrit. Revenez dans quelques jours, ou{" "}
      <Link
        href="/inscription"
        style={{ color: "var(--coral-600)", fontWeight: 600, textDecoration: "underline" }}
      >
        devenez dog-sitter →
      </Link>
    </div>
  );
}
