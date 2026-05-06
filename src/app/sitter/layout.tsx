import Link from "next/link";

import { requireRole } from "@/lib/auth/helpers";
import { signOutAction } from "@/lib/auth/actions";
import { Arko, Icon } from "@/components/mascot";

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

export default async function SitterLayout({ children }: { children: React.ReactNode }) {
  // Gate the entire route group: sitters only.
  await requireRole("sitter");

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--ink-50)" }}>
      <header style={{ borderBottom: "1px solid var(--ink-200)", background: "white" }}>
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
              Sitter
            </span>
          </Link>
          <nav style={navStyle}>
            <Link href="/sitter/profil" style={navLinkStyle}>
              Mon profil
            </Link>
            <Link href="/sitter/disponibilites" style={navLinkStyle}>
              Disponibilités
            </Link>
          </nav>
          <form action={signOutAction}>
            <button type="submit" className="btn btn-ghost btn-sm">
              <Icon name="arrow" size={14} /> Déconnexion
            </button>
          </form>
        </div>
      </header>
      <main style={{ flex: 1, maxWidth: 960, width: "100%", margin: "0 auto", padding: "var(--space-10) var(--space-6)" }}>
        {children}
      </main>
    </div>
  );
}
