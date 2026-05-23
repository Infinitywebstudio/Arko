import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/mascot";

export const metadata: Metadata = {
  title: "Vérifie ton email · ARKO",
};

export default function VerifyEmailPage() {
  return (
    <div
      style={{
        background: "white",
        borderRadius: 24,
        padding: "var(--space-12) var(--space-8)",
        width: "100%",
        maxWidth: 480,
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          margin: "0 auto 16px",
          borderRadius: 36,
          background: "var(--coral-50)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name="message" size={32} color="var(--coral-600)" />
      </div>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 400,
          fontSize: 36,
          letterSpacing: "-0.02em",
          lineHeight: 1.05,
          margin: 0,
          marginBottom: 12,
        }}
      >
        Vérifie ton{" "}
        <span style={{ color: "var(--coral-500)" }}>email</span>
      </h1>
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          color: "var(--ink-600)",
          lineHeight: 1.6,
          margin: 0,
          marginBottom: 24,
        }}
      >
        On vient de t&apos;envoyer un lien de vérification. Clique dessus depuis ta boîte
        mail pour activer ton compte. Pense à vérifier les spams.
      </p>
      <Link href="/connexion" className="btn btn-outline" style={{ display: "inline-flex" }}>
        Aller à la connexion
      </Link>
    </div>
  );
}
