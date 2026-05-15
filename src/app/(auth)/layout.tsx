import Link from "next/link";
import { Arko } from "@/components/mascot";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--peach-50)",
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
          <Link
            href="/"
            style={{ display: "flex", alignItems: "center", gap: 10 }}
            aria-label="Retour à l'accueil ARKO"
          >
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
        </div>
      </header>

      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "var(--space-10) var(--space-4)",
        }}
      >
        {children}
      </main>

      <footer
        style={{
          padding: "var(--space-6) var(--space-4)",
          borderTop: "1px solid var(--ink-200)",
          background: "var(--ink-50)",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--space-5)",
            justifyContent: "center",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: "var(--ink-500)",
          }}
        >
          <span>© 2026 ARKO</span>
          <Link href="/cgu">CGU</Link>
          <Link href="/confidentialite">Confidentialité</Link>
          <Link href="/aide">Aide</Link>
        </div>
      </footer>
    </div>
  );
}
