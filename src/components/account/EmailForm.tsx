"use client";

import { useState, useTransition } from "react";

import { updateEmailAction } from "@/lib/auth/actions";

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

type Props = {
  currentEmail: string;
};

export default function EmailForm({ currentEmail }: Props) {
  const [email, setEmail] = useState("");
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
    fd.append("email", email);

    startTransition(async () => {
      const result = await updateEmailAction(fd);
      if (result.ok) {
        setSuccess(
          `Mail de confirmation envoyé à ${email}. Le changement prend effet après le clic sur le lien.`,
        );
        setEmail("");
      } else {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <label style={labelStyle}>Email actuel</label>
        <div
          style={{
            ...inputStyle(false),
            display: "flex",
            alignItems: "center",
            background: "var(--ink-50)",
            color: "var(--ink-700)",
          }}
        >
          {currentEmail}
        </div>
      </div>

      <div>
        <label htmlFor="new_email" style={labelStyle}>
          Nouvel email
        </label>
        <input
          id="new_email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
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
        <button type="submit" className="btn btn-primary" disabled={isPending || !email}>
          {isPending ? "Envoi…" : "Envoyer le mail de confirmation"}
        </button>
      </div>
    </form>
  );
}
