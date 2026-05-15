"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { resetPasswordAction } from "@/lib/auth/actions";
import { Icon } from "@/components/mascot";

export default function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const fd = new FormData();
    fd.append("password", password);
    fd.append("confirm_password", confirm);

    startTransition(async () => {
      const result = await resetPasswordAction(fd);
      if (result.ok) {
        router.push(result.redirectTo ?? "/compte");
      } else {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  };

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
          Nouveau{" "}
          <span style={{ color: "var(--coral-500)" }}>mot de passe</span>
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
          Choisis un nouveau mot de passe. Au moins 8 caractères.
        </p>
      </div>

      <div>
        <label
          htmlFor="password"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--ink-700)",
            display: "block",
            marginBottom: 6,
          }}
        >
          Mot de passe
        </label>
        <div style={{ position: "relative" }}>
          <input
            id="password"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            autoFocus
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isPending}
            style={{
              width: "100%",
              height: 48,
              padding: "0 44px 0 16px",
              background: "white",
              border: `1px solid ${fieldErrors.password ? "var(--danger-500)" : "var(--ink-300)"}`,
              borderRadius: 12,
              fontFamily: "var(--font-mono)",
              fontSize: 14,
              color: "var(--ink-900)",
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Masquer" : "Afficher"}
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
            <Icon name={show ? "close" : "check"} size={14} color="var(--ink-500)" />
          </button>
        </div>
        {fieldErrors.password && (
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--danger-700)",
              marginTop: 4,
            }}
          >
            {fieldErrors.password}
          </div>
        )}
      </div>

      <div>
        <label
          htmlFor="confirm_password"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--ink-700)",
            display: "block",
            marginBottom: 6,
          }}
        >
          Confirmer
        </label>
        <input
          id="confirm_password"
          type={show ? "text" : "password"}
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          disabled={isPending}
          style={{
            width: "100%",
            height: 48,
            padding: "0 16px",
            background: "white",
            border: `1px solid ${fieldErrors.confirm_password ? "var(--danger-500)" : "var(--ink-300)"}`,
            borderRadius: 12,
            fontFamily: "var(--font-mono)",
            fontSize: 14,
            color: "var(--ink-900)",
            outline: "none",
          }}
        />
        {fieldErrors.confirm_password && (
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--danger-700)",
              marginTop: 4,
            }}
          >
            {fieldErrors.confirm_password}
          </div>
        )}
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
        {isPending ? "Mise à jour…" : "Mettre à jour"}
      </button>
    </form>
  );
}
