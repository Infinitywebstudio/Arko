import Link from "next/link";

import { Arko } from "@/components/mascot";

export default function SittersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(247, 244, 236, 0.72)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          borderBottom: "1px solid rgba(216, 213, 200, 0.5)",
          boxShadow: "0 8px 24px rgba(15, 19, 16, 0.04)",
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
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                fontFamily: "var(--font-brand), system-ui, sans-serif",
                fontSize: 22,
                letterSpacing: "0.02em",
                color: "var(--coral-600)",
                lineHeight: 1,
              }}
            >
              ARKO
            </span>
          </Link>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Link href="/connexion" className="btn btn-ghost btn-sm">
              Connexion
            </Link>
            <Link href="/inscription" className="btn btn-primary btn-sm btn-pill">
              S&apos;inscrire
            </Link>
          </div>
        </div>
      </header>
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}
