import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation · ARKO",
};

export default function CGUPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--peach-50)",
        padding: "var(--space-16) var(--space-6)",
      }}
    >
      <article
        style={{
          maxWidth: 760,
          margin: "0 auto",
          background: "white",
          padding: "var(--space-12)",
          borderRadius: 24,
          border: "1px solid var(--ink-200)",
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: "var(--coral-600)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontWeight: 600,
          }}
        >
          ← Retour
        </Link>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px, 3.5vw, 44px)",
            margin: "var(--space-4) 0 var(--space-6)",
            color: "var(--ink-900)",
            fontWeight: 400,
          }}
        >
          Conditions générales d&apos;utilisation
        </h1>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 14,
            color: "var(--ink-600)",
            lineHeight: 1.7,
          }}
        >
          Les conditions générales définitives de la plateforme ARKO sont en cours de
          rédaction avec notre conseil juridique. Cette page sera mise à jour avant le
          lancement officiel.
        </p>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 14,
            color: "var(--ink-600)",
            lineHeight: 1.7,
            marginTop: "var(--space-4)",
          }}
        >
          En attendant, pour toute question contractuelle, écris-nous à{" "}
          <a
            href="mailto:hello@arko.app"
            style={{ color: "var(--coral-600)", textDecoration: "underline" }}
          >
            hello@arko.app
          </a>
          .
        </p>
      </article>
    </main>
  );
}
