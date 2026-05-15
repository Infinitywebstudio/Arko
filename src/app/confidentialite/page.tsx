import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de confidentialité · ARKO",
};

export default function ConfidentialitePage() {
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
          Politique de confidentialité
        </h1>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 14,
            color: "var(--ink-600)",
            lineHeight: 1.7,
          }}
        >
          Cette page sera finalisée avec notre DPO avant le lancement. En résumé : tes
          données personnelles (nom, email, téléphone) sont stockées chez Supabase
          (Frankfurt, UE), ne sont jamais revendues, et tu peux les supprimer à tout
          moment depuis ton espace compte.
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
          Pour toute question RGPD, écris-nous à{" "}
          <a
            href="mailto:privacy@arko.app"
            style={{ color: "var(--coral-600)", textDecoration: "underline" }}
          >
            privacy@arko.app
          </a>
          .
        </p>
      </article>
    </main>
  );
}
