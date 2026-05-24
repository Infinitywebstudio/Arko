import Link from "next/link";

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
