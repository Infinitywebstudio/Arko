"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { signInAction } from "@/lib/auth/actions";
import { Icon } from "@/components/mascot";

const cardStyle: React.CSSProperties = {
  background: "white",
  borderRadius: 24,
  padding: "var(--space-10) var(--space-8)",
  boxShadow: "var(--shadow-lg)",
  width: "100%",
  maxWidth: 440,
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-5)",
};

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--ink-700)",
  marginBottom: 6,
};

const inputStyle = (hasError: boolean): React.CSSProperties => ({
  width: "100%",
  height: 48,
  padding: "0 16px",
  background: "white",
  border: `1px solid ${hasError ? "var(--danger-500)" : "var(--ink-300)"}`,
  borderRadius: 12,
  fontFamily: "var(--font-mono)",
  fontSize: 14,
  color: "var(--ink-900)",
  outline: "none",
});

export default function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect");
  const callbackError = params.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(
    callbackError === "callback_failed"
      ? "Lien expiré ou invalide. Réessaie de te connecter."
      : null,
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const fd = new FormData();
    fd.append("email", email.trim());
    fd.append("password", password);
    if (redirect) fd.append("redirect", redirect);

    startTransition(async () => {
      const result = await signInAction(fd);
      if (result.ok) {
        router.push(result.redirectTo ?? "/compte");
      } else {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} style={cardStyle}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: 36,
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
            margin: 0,
          }}
        >
          Bon{" "}
          <span style={{ color: "var(--coral-500)" }}>retour</span>
        </h1>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            color: "var(--ink-600)",
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          Connecte-toi à ton compte ARKO.
        </p>
      </div>

      <div>
        <label htmlFor="email" style={labelStyle}>
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
          style={inputStyle(!!fieldErrors.email)}
          disabled={isPending}
        />
        {fieldErrors.email && (
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--danger-700)",
              marginTop: 4,
            }}
          >
            {fieldErrors.email}
          </div>
        )}
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <label htmlFor="password" style={labelStyle}>
            Mot de passe
          </label>
          <Link
            href="/mot-de-passe-oublie"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--coral-600)",
              fontWeight: 600,
            }}
          >
            Oublié ?
          </Link>
        </div>
        <div style={{ position: "relative" }}>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ ...inputStyle(!!fieldErrors.password), paddingRight: 44 }}
            disabled={isPending}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            style={{
              position: "absolute",
              right: 8,
              top: 8,
              width: 32,
              height: 32,
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            <Icon name={showPassword ? "close" : "check"} size={14} color="var(--ink-500)" />
          </button>
        </div>
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
        {isPending ? "Connexion…" : "Se connecter"}
      </button>

      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: "var(--ink-600)",
          textAlign: "center",
          margin: 0,
        }}
      >
        Pas encore de compte ?{" "}
        <Link
          href={redirect ? `/inscription?redirect=${encodeURIComponent(redirect)}` : "/inscription"}
          style={{ color: "var(--coral-600)", fontWeight: 600 }}
        >
          Inscris-toi
        </Link>
      </p>
    </form>
  );
}
