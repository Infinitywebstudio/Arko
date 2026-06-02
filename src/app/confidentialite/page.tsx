import type { Metadata } from "next";
import Link from "next/link";
import CookieSettingsLink from "@/components/CookieSettingsLink";

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
          Cette page sera finalisée avec notre DPO avant le lancement. En résumé : vos
          données personnelles (nom, email, téléphone) sont stockées chez Supabase
          (Frankfurt, UE), ne sont jamais revendues, et vous pouvez les supprimer à tout
          moment depuis votre espace compte.
        </p>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(20px, 2vw, 26px)",
            margin: "var(--space-8) 0 var(--space-4)",
            color: "var(--ink-900)",
            fontWeight: 400,
          }}
        >
          Cookies
        </h2>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 14,
            color: "var(--ink-600)",
            lineHeight: 1.7,
          }}
        >
          ARKO utilise deux types de cookies :
        </p>
        <ul
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 14,
            color: "var(--ink-600)",
            lineHeight: 1.7,
            paddingLeft: "var(--space-6)",
            margin: "var(--space-3) 0",
          }}
        >
          <li>
            <strong>Strictement nécessaires</strong> (toujours actifs) : cookies de
            session Supabase pour vous connecter, et redirection Stripe Checkout pour
            payer une garde. Sans eux, le site ne peut pas fonctionner — exemptés de
            consentement par la CNIL.
          </li>
          <li style={{ marginTop: "var(--space-2)" }}>
            <strong>Mesure d'audience</strong> (optionnel, désactivé par défaut) :
            aucun outil de mesure n'est déployé pour le moment. Si nous en ajoutons
            un, il ne se chargera qu'avec votre accord explicite.
          </li>
        </ul>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 14,
            color: "var(--ink-600)",
            lineHeight: 1.7,
            marginTop: "var(--space-4)",
          }}
        >
          Vous pouvez revenir sur vos préférences à tout moment :{" "}
          <CookieSettingsLink
            style={{
              color: "var(--coral-600)",
              textDecoration: "underline",
              fontFamily: "var(--font-mono)",
              fontSize: 14,
            }}
          />
          .
        </p>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 14,
            color: "var(--ink-600)",
            lineHeight: 1.7,
            marginTop: "var(--space-6)",
          }}
        >
          Pour toute question RGPD, écrivez-nous à{" "}
          <a
            href="mailto:privacy@arko.life"
            style={{ color: "var(--coral-600)", textDecoration: "underline" }}
          >
            privacy@arko.life
          </a>
          .
        </p>
      </article>
    </main>
  );
}
