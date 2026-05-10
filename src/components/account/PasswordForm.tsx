"use client";

import { useState, useTransition } from "react";

import { updatePasswordAction } from "@/lib/auth/actions";

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--ink-700)",
  display: "block",
  marginBottom: 6,
};

const inputStyle = (hasError: boolean): React.CSSProperties => ({
  width: "100%",
  height: 44,
  padding: "0 14px",
  background: "white",
  border: `1px solid ${hasError ? "var(--danger-500)" : "var(--ink-300)"}`,
  borderRadius: 12,
  fontFamily: "var(--font-mono)",
  fontSize: 14,
  color: "var(--ink-900)",
  outline: "none",
});

export default function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setFieldErrors({});

    const fd = new FormData();
    fd.append("current_password", current);
    fd.append("password", next);
    fd.append("confirm_password", confirm);

    startTransition(async () => {
      const result = await updatePasswordAction(fd);
      if (result.ok) {
        setSuccess("Mot de passe mis à jour.");
        setCurrent("");
        setNext("");
        setConfirm("");
      } else {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <label htmlFor="current_password" style={labelStyle}>
          Mot de passe actuel
        </label>
        <input
          id="current_password"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
          style={inputStyle(!!fieldErrors.current_password)}
          disabled={isPending}
        />
        {fieldErrors.current_password && (
          <FieldError>{fieldErrors.current_password}</FieldError>
        )}
      </div>

      <div>
        <label htmlFor="password" style={labelStyle}>
          Nouveau mot de passe
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          required
          minLength={8}
          style={inputStyle(!!fieldErrors.password)}
          disabled={isPending}
        />
        {fieldErrors.password && <FieldError>{fieldErrors.password}</FieldError>}
      </div>

      <div>
        <label htmlFor="confirm_password" style={labelStyle}>
          Confirmer
        </label>
        <input
          id="confirm_password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          style={inputStyle(!!fieldErrors.confirm_password)}
          disabled={isPending}
        />
        {fieldErrors.confirm_password && <FieldError>{fieldErrors.confirm_password}</FieldError>}
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

      {success && (
        <div
          style={{
            background: "var(--success-50)",
            color: "var(--success-700)",
            border: "1px solid var(--success-500)",
            padding: "10px 14px",
            borderRadius: 12,
            fontFamily: "var(--font-mono)",
            fontSize: 12,
          }}
          role="status"
        >
          {success}
        </div>
      )}

      <div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isPending || !current || !next || !confirm}
        >
          {isPending ? "Mise à jour…" : "Mettre à jour"}
        </button>
      </div>
    </form>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        color: "var(--danger-700)",
        marginTop: 4,
      }}
    >
      {children}
    </div>
  );
}
