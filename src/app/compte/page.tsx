import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth/helpers";
import { signOutAction } from "@/lib/auth/actions";
import { Arko, Icon } from "@/components/mascot";

export const metadata: Metadata = {
  title: "Mon compte · ARKO",
};

export default async function ComptePage() {
  const session = await requireUser("/compte");
  const { profile, email } = session;
  const isSitter = profile.role === "sitter";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--peach-50)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header
        style={{
          borderBottom: "1px solid var(--ink-200)",
          background: "var(--ink-50)",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Arko size={32} mood="alert" collar="#FF5A5F" />
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 26,
                fontStyle: "italic",
                color: "var(--coral-500)",
                lineHeight: 1,
              }}
            >
              arko
            </span>
          </Link>
          <form action={signOutAction}>
            <button type="submit" className="btn btn-ghost btn-sm">
              <Icon name="arrow" size={14} /> Déconnexion
            </button>
          </form>
        </div>
      </header>

      <main
        style={{
          flex: 1,
          maxWidth: 800,
          width: "100%",
          margin: "0 auto",
          padding: "var(--space-12) var(--space-6)",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: 24,
            padding: "var(--space-10) var(--space-8)",
            boxShadow: "var(--shadow-md)",
            border: "1px solid var(--ink-200)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 12px",
              borderRadius: 999,
              background: "var(--coral-50)",
              color: "var(--coral-700)",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: "var(--space-5)",
            }}
          >
            {isSitter ? "Compte dog-sitter" : "Compte client"}
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              fontSize: "clamp(36px, 5vw, 56px)",
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
              margin: 0,
              marginBottom: "var(--space-3)",
            }}
          >
            Bonjour,{" "}
            <span style={{ fontStyle: "italic", color: "var(--coral-500)" }}>
              {profile.full_name.split(" ")[0]}
            </span>
            {" "}👋
          </h1>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 14,
              color: "var(--ink-600)",
              lineHeight: 1.6,
              margin: 0,
              marginBottom: "var(--space-6)",
            }}
          >
            Ton compte ARKO est actif. Les fonctionnalités complètes arrivent dans les
            prochains jours.
          </p>

          {isSitter && (
            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: "var(--space-8)",
              }}
            >
              <Link href="/sitter/profil" className="btn btn-primary btn-sm">
                Compléter mon profil sitter
              </Link>
              <Link href="/sitter/disponibilites" className="btn btn-outline btn-sm">
                Mes disponibilités
              </Link>
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: "12px 24px",
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              padding: "var(--space-5)",
              borderRadius: 16,
              background: "var(--ink-50)",
              border: "1px solid var(--ink-200)",
            }}
          >
            <div style={{ color: "var(--ink-500)" }}>Nom</div>
            <div style={{ fontWeight: 600 }}>{profile.full_name}</div>
            <div style={{ color: "var(--ink-500)" }}>Email</div>
            <div style={{ fontWeight: 600 }}>{email}</div>
            {profile.phone && (
              <>
                <div style={{ color: "var(--ink-500)" }}>Téléphone</div>
                <div style={{ fontWeight: 600 }}>{profile.phone}</div>
              </>
            )}
            <div style={{ color: "var(--ink-500)" }}>Rôle</div>
            <div style={{ fontWeight: 600 }}>{isSitter ? "Dog-sitter" : "Client"}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
