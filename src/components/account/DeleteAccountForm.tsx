"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { deleteAccountAction } from "@/lib/auth/actions";

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

export default function DeleteAccountForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const fd = new FormData();
    fd.append("current_password", password);
    fd.append("confirm", confirm);

    startTransition(async () => {
      const result = await deleteAccountAction(fd);
      if (result.ok) {
        router.replace(result.redirectTo ?? "/");
        router.refresh();
      } else {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  };

  if (!open) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            color: "var(--ink-700)",
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          La suppression est définitive : profil, disponibilités, photos et compte d&apos;accès
          seront effacés.
        </p>
        <div>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setOpen(true)}
            style={{
              color: "var(--danger-700)",
              borderColor: "var(--danger-500)",
            }}
          >
            Supprimer mon compte
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          color: "var(--ink-700)",
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        Tape <strong>SUPPRIMER</strong> et confirme avec ton mot de passe.
      </p>

      <div>
        <label htmlFor="delete_confirm" style={labelStyle}>
          Confirmation
        </label>
        <input
          id="delete_confirm"
          type="text"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="SUPPRIMER"
          autoComplete="off"
          required
          style={inputStyle(!!fieldErrors.confirm)}
          disabled={isPending}
        />
        {fieldErrors.confirm && (
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--danger-700)",
              marginTop: 4,
            }}
          >
            {fieldErrors.confirm}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="delete_password" style={labelStyle}>
          Mot de passe
        </label>
        <input
          id="delete_password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={inputStyle(!!fieldErrors.current_password)}
          disabled={isPending}
        />
        {fieldErrors.current_password && (
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--danger-700)",
              marginTop: 4,
            }}
          >
            {fieldErrors.current_password}
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

      <div style={{ display: "flex", gap: 12 }}>
        <button
          type="submit"
          className="btn"
          disabled={isPending || confirm !== "SUPPRIMER" || !password}
          style={{
            background: "var(--danger-500)",
            color: "white",
            borderColor: "var(--danger-500)",
          }}
        >
          {isPending ? "Suppression…" : "Supprimer définitivement"}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            setOpen(false);
            setPassword("");
            setConfirm("");
            setError(null);
            setFieldErrors({});
          }}
          disabled={isPending}
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
