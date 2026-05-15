import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Aide · ARKO",
};

export default function AidePage() {
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
          Centre d&apos;aide
        </h1>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 14,
            color: "var(--ink-600)",
            lineHeight: 1.7,
          }}
        >
          Une équipe humaine, joignable en français et en anglais, du lundi au dimanche
          de 8h à 22h.
        </p>
        <div
          style={{
            marginTop: "var(--space-8)",
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "var(--space-4)",
          }}
        >
          <a
            href="mailto:hello@arko.app"
            style={{
              display: "block",
              padding: "var(--space-5)",
              background: "var(--peach-100)",
              borderRadius: 14,
              textDecoration: "none",
              color: "var(--ink-900)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--coral-700)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Email
            </div>
            <div style={{ fontWeight: 600, fontSize: 16, marginTop: 4 }}>
              hello@arko.app
            </div>
          </a>
          <a
            href="https://wa.me/33000000000"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              padding: "var(--space-5)",
              background: "var(--peach-100)",
              borderRadius: 14,
              textDecoration: "none",
              color: "var(--ink-900)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--coral-700)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              WhatsApp
            </div>
            <div style={{ fontWeight: 600, fontSize: 16, marginTop: 4 }}>
              Cliquer pour ouvrir la conversation
            </div>
          </a>
        </div>
      </article>
    </main>
  );
}
