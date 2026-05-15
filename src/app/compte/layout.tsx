import Link from "next/link";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/helpers";
import { signOutAction } from "@/lib/auth/actions";
import { Arko, Icon } from "@/components/mascot";

/**
 * Client-area shell — gates the whole /compte/* subtree to authenticated
 * clients, renders the shared chrome (logo, top-nav, sign-out), and pushes
 * children into a centered main column.
 *
 * Sitters who land here are routed to their own hub. We don't use
 * requireRole("client") because its built-in mismatched-role redirect points
 * back at /compte — which would loop forever for a sitter. Doing the redirect
 * explicitly avoids that footgun.
 */
const navStyle: React.CSSProperties = {
  display: "flex",
  gap: 24,
  fontFamily: "var(--font-mono)",
  fontSize: 13,
  color: "var(--ink-700)",
  fontWeight: 500,
};

const navLinkStyle: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 999,
  transition: "background 0.15s",
};

export default async function CompteLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser("/compte");
  if (session.profile.role === "sitter") redirect("/sitter");

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--peach-50)",
      }}
    >
      <header style={{ borderBottom: "1px solid var(--ink-200)", background: "var(--ink-50)" }}>
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
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
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--coral-700)",
                background: "var(--coral-50)",
                padding: "3px 8px",
                borderRadius: 999,
                marginLeft: 4,
              }}
            >
              Client
            </span>
          </Link>
          <nav style={navStyle} aria-label="Navigation du compte">
            <Link href="/compte" style={navLinkStyle}>
              Mon compte
            </Link>
            <Link href="/compte/bookings" style={navLinkStyle}>
              Mes réservations
            </Link>
            <Link href="/compte/parametres" style={navLinkStyle}>
              Paramètres
            </Link>
          </nav>
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
          maxWidth: 960,
          width: "100%",
          margin: "0 auto",
          padding: "var(--space-10) var(--space-6)",
        }}
      >
        {children}
      </main>
    </div>
  );
}
