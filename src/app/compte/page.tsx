import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth/helpers";
import { Icon, type IconName } from "@/components/mascot";

export const metadata: Metadata = {
  title: "Mon compte · ARKO",
};

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

export default async function ComptePage() {
  // The /compte layout already gates auth + sitter-redirect — this fetch is
  // for the in-page profile data, not a re-gate. Both reads come from the
  // same RSC request so there's no extra round-trip.
  const session = await requireUser();
  const { profile, email } = session;
  const firstName = profile.full_name.split(" ")[0] ?? profile.full_name;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
      <header>
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
          Mon{" "}
          <span style={{ color: "var(--coral-500)" }}>compte</span>
        </h1>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            color: "var(--ink-600)",
            lineHeight: 1.6,
            margin: 0,
            marginTop: "var(--space-3)",
          }}
        >
          Trouve un sitter, suis tes réservations et gère ton compte.
        </p>
      </header>

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
          Raccourcis
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
          }}
        >
          <Tile href="/sitters" icon="search" label="Trouver un sitter" hint="Parcourir les profils" />
          <Tile
            href="/compte/bookings"
            icon="calendar"
            label="Mes réservations"
            hint="À venir & historique"
          />
          <Tile
            href="/compte/parametres"
            icon="lock"
            label="Paramètres"
            hint="Infos, email, mot de passe"
          />
        </div>
      </section>

      <section
        style={{
          background: "white",
          borderRadius: 20,
          padding: "var(--space-7) var(--space-7)",
          border: "1px solid var(--ink-200)",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--ink-500)",
            margin: 0,
            marginBottom: "var(--space-5)",
          }}
        >
          Mes infos
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto minmax(0, 1fr)",
            gap: "12px 24px",
            fontFamily: "var(--font-mono)",
            fontSize: 13,
          }}
        >
          <div style={{ color: "var(--ink-500)" }}>Nom</div>
          <div style={{ fontWeight: 600, minWidth: 0, overflowWrap: "anywhere" }}>
            {profile.full_name}
          </div>
          <div style={{ color: "var(--ink-500)" }}>Email</div>
          <div style={{ fontWeight: 600, minWidth: 0, overflowWrap: "anywhere" }}>{email}</div>
          <div style={{ color: "var(--ink-500)" }}>Téléphone</div>
          <div style={{ fontWeight: 600, minWidth: 0, overflowWrap: "anywhere" }}>
            {profile.phone ?? (
              <Link href="/compte/parametres" style={{ color: "var(--coral-600)" }}>
                À renseigner →
              </Link>
            )}
          </div>
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
}: {
  href: string;
  icon: IconName;
  label: string;
  hint: string;
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
          }}
        >
          <Icon name={icon} size={18} color="var(--coral-600)" />
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
