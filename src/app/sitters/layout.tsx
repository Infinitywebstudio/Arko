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
          background: "rgba(250, 247, 245, 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--ink-200)",
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
