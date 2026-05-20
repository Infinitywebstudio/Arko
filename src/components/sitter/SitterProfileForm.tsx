"use client";

import { useState, useTransition } from "react";

import { updateSitterProfileAction } from "@/lib/sitter/actions";
import PhoneInput from "@/components/ui/PhoneInput";
import type { Database } from "@/lib/supabase/database.types";

type SitterProfile = Database["public"]["Tables"]["sitter_profiles"]["Row"];

type Props = {
  initial: SitterProfile;
  identity: {
    full_name: string;
    phone: string | null;
  };
};

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

const textareaStyle = (hasError: boolean): React.CSSProperties => ({
  ...inputStyle(hasError),
  height: "auto",
  minHeight: 120,
  padding: 14,
  resize: "vertical",
  fontFamily: "var(--font-mono)",
  lineHeight: 1.6,
});

export default function SitterProfileForm({ initial, identity }: Props) {
  const [fullName, setFullName] = useState(identity.full_name);
  const [phone, setPhone] = useState(identity.phone ?? "");
  const [bio, setBio] = useState(initial.bio ?? "");
  const [years, setYears] = useState<string>(
    initial.experience_years === null ? "" : String(initial.experience_years),
  );
  const [acceptsDangerous, setAcceptsDangerous] = useState(initial.accepts_dangerous_breeds);

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
    fd.append("full_name", fullName);
    fd.append("phone", phone);
    fd.append("bio", bio);
    fd.append("experience_years", years);
    fd.append("accepts_dangerous_breeds", acceptsDangerous ? "true" : "false");

    startTransition(async () => {
      const result = await updateSitterProfileAction(fd);
      if (result.ok) {
        setSuccess("Profil enregistré.");
      } else {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      {/* auto-fit minmax: the row stays 2-up when there's room (~440px+ inner
          width) and collapses to 1 column on narrow mobiles so PhoneInput
          (~200px min) and "Nom complet" don't overflow / get clipped. */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <label htmlFor="full_name" style={labelStyle}>
            Nom complet
          </label>
          <input
            id="full_name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            maxLength={100}
            style={inputStyle(!!fieldErrors.full_name)}
            disabled={isPending}
          />
          {fieldErrors.full_name && <FieldError>{fieldErrors.full_name}</FieldError>}
        </div>
        <div style={{ minWidth: 0 }}>
          <label htmlFor="phone" style={labelStyle}>
            Téléphone
          </label>
          <PhoneInput
            id="phone"
            value={phone}
            onChange={setPhone}
            hasError={!!fieldErrors.phone}
            disabled={isPending}
          />
          {fieldErrors.phone && <FieldError>{fieldErrors.phone}</FieldError>}
        </div>
      </div>

      <div>
        <label htmlFor="bio" style={labelStyle}>
          Bio
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={2000}
          rows={5}
          placeholder="Quelques mots sur toi : expérience avec les chiens, ce qui te motive, ton approche…"
          style={textareaStyle(!!fieldErrors.bio)}
          disabled={isPending}
        />
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--ink-500)",
            marginTop: 4,
            textAlign: "right",
          }}
        >
          {bio.length} / 2000
        </div>
        {fieldErrors.bio && <FieldError>{fieldErrors.bio}</FieldError>}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <label htmlFor="experience_years" style={labelStyle}>
            Années d&apos;expérience
          </label>
          <input
            id="experience_years"
            type="number"
            min={0}
            max={80}
            value={years}
            onChange={(e) => setYears(e.target.value)}
            style={inputStyle(!!fieldErrors.experience_years)}
            disabled={isPending}
          />
          {fieldErrors.experience_years && <FieldError>{fieldErrors.experience_years}</FieldError>}
        </div>

        <div style={{ minWidth: 0 }}>
          <label style={labelStyle}>Chiens dits dangereux (cat. 1 et 2)</label>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 14px",
              border: "1px solid var(--ink-300)",
              borderRadius: 12,
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              color: "var(--ink-700)",
              cursor: "pointer",
              background: "white",
            }}
          >
            <input
              type="checkbox"
              checked={acceptsDangerous}
              onChange={(e) => setAcceptsDangerous(e.target.checked)}
              disabled={isPending}
              style={{ width: 16, height: 16, accentColor: "var(--coral-500)" }}
            />
            J&apos;accepte de garder ce type de chien
          </label>
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
        <button type="submit" className="btn btn-primary" disabled={isPending}>
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
