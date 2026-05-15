import type { Metadata } from "next";
import Link from "next/link";

import { requireRole } from "@/lib/auth/helpers";
import { getTodayAvailability } from "@/lib/sitter/helpers";
import { createClient } from "@/lib/supabase/server";
import { Icon, type IconName } from "@/components/mascot";

export const metadata: Metadata = {
  title: "Aujourd'hui · ARKO Sitter",
};

const DATE_FMT = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

function trimSeconds(t: string): string {
  return /^\d{2}:\d{2}/.test(t) ? t.slice(0, 5) : t;
}

const tileLink: React.CSSProperties = {
  background: "white",
  border: "1px solid var(--ink-200)",
  borderRadius: 16,
  padding: "var(--space-5)",
  display: "flex",
  flexDirection: "column",
  gap: 8,
  textDecoration: "none",
  color: "inherit",
  transition: "border-color 0.15s, transform 0.15s",
};

export default async function SitterHomePage() {
  const session = await requireRole("sitter");
  const todaySlots = await getTodayAvailability(session.userId);

  // Pending demand count — drives a coral badge on the "Demandes" tile to
  // signal that something needs the sitter's attention.
  const supabase = await createClient();
  const { count: pendingCount } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("sitter_id", session.userId)
    .eq("status", "pending_acceptance");
  const pendingNum = pendingCount ?? 0;

  const firstName = session.profile.full_name.split(" ")[0] ?? session.profile.full_name;
  const todayLabel = DATE_FMT.format(new Date());
  const hasSlots = todaySlots.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
      {/* Greeting */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--ink-500)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            Bonjour {firstName}
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              fontSize: "clamp(28px, 3.5vw, 44px)",
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
              margin: 0,
            }}
          >
            Aujourd&apos;
            <span style={{ color: "var(--coral-500)" }}>hui</span>
          </h1>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              color: "var(--ink-600)",
              marginTop: 6,
              textTransform: "capitalize",
            }}
          >
            {todayLabel}
          </div>
        </div>
      </header>

      {/* Status card */}
      <section
        style={{
          background: "var(--ink-900)",
          color: "white",
          borderRadius: 20,
          padding: "var(--space-5) var(--space-6)",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: 999,
            background: hasSlots ? "var(--success-500)" : "var(--ink-500)",
            boxShadow: hasSlots ? "0 0 0 5px rgba(16, 185, 129, 0.25)" : "none",
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 1.1 }}>
            {hasSlots ? "Disponible aujourd'hui" : "Pas de créneau aujourd'hui"}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, opacity: 0.7, marginTop: 4 }}>
            {hasSlots
              ? `${todaySlots.length} créneau${todaySlots.length > 1 ? "x" : ""} configuré${todaySlots.length > 1 ? "s" : ""}`
              : "Configure tes créneaux pour apparaître dans les recherches"}
          </div>
        </div>
      </section>

      {/* Today's slots */}
      <section>
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
          Planning du jour
        </h2>
        {hasSlots ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {todaySlots.map((slot) => (
              <div
                key={`${slot.start_time}-${slot.end_time}`}
                style={{
                  padding: "var(--space-4) var(--space-5)",
                  background: "white",
                  border: "1px solid var(--ink-200)",
                  borderRadius: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 36,
                    borderRadius: 3,
                    background: "var(--success-500)",
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700 }}>
                    {trimSeconds(slot.start_time)} – {trimSeconds(slot.end_time)}
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--success-700)" }}>
                    Disponible
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: "var(--space-6)",
              background: "white",
              border: "1px dashed var(--ink-300)",
              borderRadius: 14,
              textAlign: "center",
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              color: "var(--ink-600)",
            }}
          >
            Aucun créneau pour aujourd&apos;hui.{" "}
            <Link
              href="/sitter/disponibilites"
              style={{ color: "var(--coral-600)", fontWeight: 600, textDecoration: "underline" }}
            >
              Configure ta semaine →
            </Link>
          </div>
        )}
      </section>

      {/* Shortcuts */}
      <section>
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
          Mon compte
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
          }}
        >
          <Tile
            href="/sitter/demandes"
            icon="bell"
            label="Demandes"
            hint={pendingNum > 0 ? `${pendingNum} en attente` : "Mes gardes"}
            badge={pendingNum > 0 ? pendingNum : undefined}
          />
          <Tile href="/sitter/profil" icon="user" label="Mon profil" hint="Bio, photo, expérience" />
          <Tile href="/sitter/disponibilites" icon="calendar" label="Disponibilités" hint="Mes créneaux hebdo" />
          <Tile href={`/sitters/${session.userId}`} icon="search" label="Profil public" hint="Voir ce que voient les clients" />
          <Tile href="/sitter/parametres" icon="lock" label="Paramètres" hint="Email, mot de passe, compte" />
        </div>
      </section>
    </div>
  );
}

function Tile({
  href,
  icon,
  label,
  hint,
  badge,
}: {
  href: string;
  icon: IconName;
  label: string;
  hint: string;
  badge?: number;
}) {
  return (
    <Link href={href} style={tileLink}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            background: "var(--coral-50)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <Icon name={icon} size={18} color="var(--coral-600)" />
          {badge !== undefined && (
            <span
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                minWidth: 18,
                height: 18,
                padding: "0 5px",
                borderRadius: 9,
                background: "var(--coral-500)",
                color: "white",
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid white",
              }}
            >
              {badge}
            </span>
          )}
        </div>
        <Icon name="arrow" size={14} color="var(--ink-400)" />
      </div>
      <div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--ink-500)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-900)", marginTop: 4 }}>
          {hint}
        </div>
      </div>
    </Link>
  );
}
