import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  getSitterAvailability,
  getSitterBadges,
  getSitterPublic,
} from "@/lib/sitter/helpers";
import { Arko, Icon } from "@/components/mascot";
import { zoneLabel } from "@/lib/zones";
import type { Database } from "@/lib/supabase/database.types";

type BadgeKind = Database["public"]["Enums"]["sitter_badge_kind"];

const BADGE_LABEL: Record<BadgeKind, string> = {
  id_check: "Identité vérifiée",
  background_check: "Casier vérifié",
  first_aid: "Premiers secours",
};

const DAYS_LABEL = ["Dim.", "Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam."];

function trimSeconds(t: string): string {
  return /^\d{2}:\d{2}/.test(t) ? t.slice(0, 5) : t;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const sitter = await getSitterPublic(id);
  if (!sitter) return { title: "Sitter introuvable · ARKO" };
  return {
    title: `${sitter.full_name} · Dog-sitter ARKO`,
    description: sitter.bio
      ? sitter.bio.slice(0, 160)
      : `Profil dog-sitter de ${sitter.full_name} sur ARKO.`,
  };
}

export default async function SitterProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sitter = await getSitterPublic(id);
  if (!sitter || !sitter.id) notFound();

  // Public reads: badges + availability are RLS-readable by anon/authenticated.
  const [badges, availability] = await Promise.all([
    getSitterBadges(sitter.id),
    getSitterAvailability(sitter.id),
  ]);
  const verifiedBadges = badges.filter((b) => b.verified_at !== null);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === sitter.id;

  return (
    <article
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "var(--space-12) var(--space-6)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-10)",
      }}
    >
      {/* Hero */}
      <header
        style={{
          display: "flex",
          gap: "var(--space-6)",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: 70,
            overflow: "hidden",
            background: "var(--peach-100)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "var(--shadow-md)",
          }}
        >
          {sitter.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- remote Supabase URL
            <img
              src={sitter.avatar_url}
              alt={sitter.full_name ?? "Sitter"}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <Arko size={110} mood="happy" />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--coral-600)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 4,
              fontWeight: 600,
            }}
          >
            Dog-sitter
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              fontSize: "clamp(28px, 3.5vw, 44px)",
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
              margin: 0,
              marginBottom: 12,
            }}
          >
            {sitter.full_name}
          </h1>
          {verifiedBadges.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {verifiedBadges.map((b) => (
                <span
                  key={b.id}
                  className="badge badge-success"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <Icon name="check" size={12} color="var(--success-700)" />
                  {BADGE_LABEL[b.kind]}
                </span>
              ))}
            </div>
          )}
          {isOwner && (
            <div style={{ marginTop: 16 }}>
              <Link href="/sitter/profil" className="btn btn-outline btn-sm">
                Modifier mon profil
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Bio */}
      {sitter.bio && (
        <section>
          <SectionHeading>À propos</SectionHeading>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 14,
              lineHeight: 1.7,
              color: "var(--ink-700)",
              whiteSpace: "pre-wrap",
              margin: 0,
            }}
          >
            {sitter.bio}
          </p>
        </section>
      )}

      {/* Experience + dangerous breeds */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <InfoCard label="Expérience">
          {sitter.experience_years === null
            ? "Non renseignée"
            : sitter.experience_years === 0
              ? "Débutant"
              : `${sitter.experience_years} an${sitter.experience_years > 1 ? "s" : ""}`}
        </InfoCard>
        <InfoCard label="Chiens cat. 1 et 2">
          {sitter.accepts_dangerous_breeds ? "Accepté" : "Non accepté"}
        </InfoCard>
      </section>

      {/* Service zones */}
      {sitter.service_zones && sitter.service_zones.length > 0 && (
        <section>
          <SectionHeading>Zones d&apos;intervention</SectionHeading>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {sitter.service_zones.map((zone) => (
              <span key={zone} className="badge badge-ink-soft" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Icon name="pin" size={12} color="var(--ink-700)" />
                {zoneLabel(zone)}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Availability */}
      <section>
        <SectionHeading>Disponibilités</SectionHeading>
        {availability.length === 0 ? (
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              color: "var(--ink-500)",
              margin: 0,
            }}
          >
            Pas encore renseigné.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[1, 2, 3, 4, 5, 6, 0].map((day) => {
              const slots = availability.filter((s) => s.weekday === day);
              return (
                <div
                  key={day}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "80px 1fr",
                    gap: 12,
                    alignItems: "baseline",
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    padding: "8px 0",
                    borderBottom: "1px solid var(--ink-200)",
                  }}
                >
                  <div style={{ fontWeight: 600, color: "var(--ink-900)" }}>{DAYS_LABEL[day]}</div>
                  <div style={{ color: slots.length === 0 ? "var(--ink-400)" : "var(--ink-700)" }}>
                    {slots.length === 0
                      ? "Indisponible"
                      : slots
                          .map((s) => `${trimSeconds(s.start_time)} – ${trimSeconds(s.end_time)}`)
                          .join(" · ")}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* CTA — disabled for the sitter on their own profile (no booking yourself).
          Hidden entirely if the sitter has no availability slots, since the
          reservation page would be a dead end. */}
      <section>
        {isOwner ? (
          <button
            type="button"
            disabled
            className="btn btn-outline btn-lg"
            style={{ opacity: 0.6, cursor: "not-allowed" }}
          >
            C&apos;est ton profil
          </button>
        ) : availability.length === 0 ? (
          <button
            type="button"
            disabled
            className="btn btn-primary btn-lg"
            style={{ opacity: 0.6, cursor: "not-allowed" }}
          >
            Pas encore de créneau
          </button>
        ) : (
          <Link href={`/sitters/${sitter.id}/reserver`} className="btn btn-primary btn-lg">
            Réserver une garde
          </Link>
        )}
      </section>
    </article>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--ink-500)",
        margin: 0,
        marginBottom: 12,
      }}
    >
      {children}
    </h2>
  );
}

function InfoCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid var(--ink-200)",
        borderRadius: 16,
        padding: "var(--space-5)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--ink-500)",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 600, color: "var(--ink-900)" }}>
        {children}
      </div>
    </div>
  );
}
