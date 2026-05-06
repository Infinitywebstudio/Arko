"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import { forgotPasswordAction } from "@/lib/auth/actions";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const fd = new FormData();
    fd.append("email", email.trim());

    startTransition(async () => {
      const result = await forgotPasswordAction(fd);
      if (result.ok) {
        setSuccess(true);
      } else {
        setError(result.error);
      }
    });
  };

  if (success) {
    return (
      <div
        style={{
          background: "white",
          borderRadius: 24,
          padding: "var(--space-10) var(--space-8)",
          boxShadow: "var(--shadow-lg)",
          width: "100%",
          maxWidth: 440,
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: 32,
            letterSpacing: "-0.02em",
            margin: 0,
            marginBottom: 12,
          }}
        >
          Lien <span style={{ fontStyle: "italic", color: "var(--coral-500)" }}>envoyé</span>
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
          Si un compte existe avec cet email, tu vas recevoir un lien de réinitialisation
          dans quelques instants.
        </p>
        <Link href="/connexion" className="btn btn-outline" style={{ display: "inline-flex" }}>
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "white",
        borderRadius: 24,
        padding: "var(--space-10) var(--space-8)",
        boxShadow: "var(--shadow-lg)",
        width: "100%",
        maxWidth: 440,
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-5)",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: 32,
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          Mot de passe{" "}
          <span style={{ fontStyle: "italic", color: "var(--coral-500)" }}>oublié</span> ?
        </h1>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            color: "var(--ink-600)",
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          Entre l&apos;email de ton compte. On t&apos;envoie un lien pour le réinitialiser.
        </p>
      </div>

      <div>
        <label
          htmlFor="email"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--ink-700)",
            marginBottom: 6,
            display: "block",
          }}
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          autoFocus
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="prenom.nom@email.com"
          disabled={isPending}
          style={{
            width: "100%",
            height: 48,
            padding: "0 16px",
            background: "white",
            border: "1px solid var(--ink-300)",
            borderRadius: 12,
            fontFamily: "var(--font-mono)",
            fontSize: 14,
            color: "var(--ink-900)",
            outline: "none",
          }}
        />
      </div>

      {error && (
        <div
          style={{
            background: "var(--danger-50)",
            color: "var(--danger-700)",
            border: "1px solid var(--danger-500)",
            padding: "10px 14px",
            borderRadius: 12,
            fontFamily: "var(--font-mono)",
            fontSize: 12,
          }}
          role="alert"
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        className="btn btn-primary btn-lg"
        disabled={isPending}
        style={{ width: "100%" }}
      >
        {isPending ? "Envoi en cours…" : "Envoyer le lien"}
      </button>

      <Link
        href="/connexion"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: "var(--ink-600)",
          textAlign: "center",
        }}
      >
        ← Retour à la connexion
      </Link>
    </form>
  );
}
