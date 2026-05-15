"use client";

import { useState, useTransition } from "react";

import { updateIdentityAction } from "@/lib/auth/actions";
import PhoneInput from "@/components/ui/PhoneInput";

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
  initial: {
    full_name: string;
    phone: string | null;
  };
};

export default function IdentityForm({ initial }: Props) {
  const [fullName, setFullName] = useState(initial.full_name);
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  // Only enable the submit button when there's an actual change to persist —
  // avoids accidental no-op submissions and gives the user a hint that the
  // form is in sync.
  const dirty = fullName.trim() !== initial.full_name || phone.trim() !== (initial.phone ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setFieldErrors({});

    const fd = new FormData();
    fd.append("full_name", fullName);
    fd.append("phone", phone);

    startTransition(async () => {
      const result = await updateIdentityAction(fd);
      if (result.ok) {
        setSuccess("Informations mises à jour.");
      } else {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <label htmlFor="identity_full_name" style={labelStyle}>
          Nom complet
        </label>
        <input
          id="identity_full_name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
          maxLength={100}
          required
          style={inputStyle(!!fieldErrors.full_name)}
          disabled={isPending}
        />
        {fieldErrors.full_name && <FieldError>{fieldErrors.full_name}</FieldError>}
      </div>

      <div>
        <label htmlFor="identity_phone" style={labelStyle}>
          Téléphone
        </label>
        <PhoneInput
          id="identity_phone"
          value={phone}
          onChange={setPhone}
          disabled={isPending}
          hasError={!!fieldErrors.phone}
        />
        {fieldErrors.phone && <FieldError>{fieldErrors.phone}</FieldError>}
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--ink-500)",
            marginTop: 4,
            lineHeight: 1.5,
          }}
        >
          Utilisé pour la coordination avec le sitter une fois la garde acceptée. Les
          réservations déjà créées conservent le numéro fourni au moment de la réservation.
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
        <button type="submit" className="btn btn-primary" disabled={isPending || !dirty}>
          {isPending ? "Enregistrement…" : "Enregistrer"}
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
