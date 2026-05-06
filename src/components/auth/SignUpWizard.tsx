"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { signUpAction } from "@/lib/auth/actions";
import { Icon } from "@/components/mascot";

type Role = "client" | "sitter";
type Step = 1 | 2 | 3 | 4;
const TOTAL_STEPS: Step = 4;

type FormState = {
  role: Role | null;
  email: string;
  password: string;
  confirm_password: string;
  full_name: string;
  phone: string;
  terms: boolean;
};

const initialState: FormState = {
  role: null,
  email: "",
  password: "",
  confirm_password: "",
  full_name: "",
  phone: "",
  terms: false,
};

function passwordStrength(pwd: string): { level: 0 | 1 | 2 | 3; label: string } {
  if (!pwd) return { level: 0, label: "" };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { level: 1, label: "Faible" };
  if (score <= 3) return { level: 2, label: "Moyen" };
  return { level: 3, label: "Fort" };
}

const STRENGTH_COLOR: Record<0 | 1 | 2 | 3, string> = {
  0: "var(--ink-200)",
  1: "var(--danger-500)",
  2: "var(--warning-500)",
  3: "var(--success-500)",
};

const cardStyle: React.CSSProperties = {
  background: "white",
  borderRadius: 24,
  padding: "var(--space-10) var(--space-8)",
  boxShadow: "var(--shadow-lg)",
  width: "100%",
  maxWidth: 480,
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
  transition: "border 0.15s, box-shadow 0.15s",
});

const titleStyle: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontWeight: 400,
  fontSize: 36,
  letterSpacing: "-0.02em",
  lineHeight: 1.05,
  margin: 0,
  color: "var(--ink-900)",
};

const subtitleStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 13,
  color: "var(--ink-600)",
  lineHeight: 1.6,
  margin: 0,
};

export default function SignUpWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<FormState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setData((d) => ({ ...d, [k]: v }));
    if (error) setError(null);
    if (fieldErrors[k as string]) {
      setFieldErrors(({ [k as string]: _, ...rest }) => rest);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(((step as number) - 1) as Step);
      setError(null);
      setFieldErrors({});
    }
  };

  const goNext = () => {
    setError(null);
    setFieldErrors({});

    if (step === 1) {
      if (!data.role) {
        setError("Choisis ton type de compte pour continuer.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const email = data.email.trim();
      if (!email) {
        setFieldErrors({ email: "Email requis" });
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setFieldErrors({ email: "Email invalide" });
        return;
      }
      setStep(3);
    } else if (step === 3) {
      const errs: Record<string, string> = {};
      if (!data.password) errs.password = "Mot de passe requis";
      else if (data.password.length < 8) errs.password = "Minimum 8 caractères";
      if (!data.confirm_password) errs.confirm_password = "Confirmation requise";
      else if (data.password !== data.confirm_password)
        errs.confirm_password = "Les mots de passe ne correspondent pas";
      if (Object.keys(errs).length) {
        setFieldErrors(errs);
        return;
      }
      setStep(4);
    }
  };

  const handleSubmit = () => {
    setError(null);
    setFieldErrors({});

    const errs: Record<string, string> = {};
    if (!data.full_name.trim() || data.full_name.trim().length < 2)
      errs.full_name = "Minimum 2 caractères";
    if (!data.terms) errs.terms = "Acceptation requise";
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      if (errs.terms) setError("Tu dois accepter les CGU pour continuer.");
      return;
    }

    if (!data.role) {
      setStep(1);
      setError("Type de compte manquant.");
      return;
    }

    const fd = new FormData();
    fd.append("role", data.role);
    fd.append("email", data.email.trim());
    fd.append("password", data.password);
    fd.append("full_name", data.full_name.trim());
    fd.append("phone", data.phone.trim());
    fd.append("terms", data.terms ? "true" : "false");

    startTransition(async () => {
      const result = await signUpAction(fd);
      if (result.ok) {
        router.push(result.redirectTo ?? "/compte");
      } else {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  };

  const strength = passwordStrength(data.password);
  const isLast = step === TOTAL_STEPS;

  return (
    <div style={cardStyle}>
      {/* Step indicator + back button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {step > 1 ? (
          <button
            type="button"
            onClick={handleBack}
            disabled={isPending}
            aria-label="Étape précédente"
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              border: "1px solid var(--ink-200)",
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: isPending ? "not-allowed" : "pointer",
              opacity: isPending ? 0.5 : 1,
            }}
          >
            <Icon name="arrowLeft" size={16} color="var(--ink-700)" />
          </button>
        ) : (
          <span style={{ width: 36 }} />
        )}
        <div
          style={{
            display: "flex",
            gap: 6,
            alignItems: "center",
          }}
          aria-label={`Étape ${step} sur ${TOTAL_STEPS}`}
        >
          {[1, 2, 3, 4].map((n) => (
            <span
              key={n}
              style={{
                width: 24,
                height: 4,
                borderRadius: 2,
                background:
                  n <= step ? "var(--coral-500)" : "var(--ink-200)",
                transition: "background 0.2s",
              }}
            />
          ))}
        </div>
        <span style={{ width: 36 }} />
      </div>

      {/* Step 1 — Role */}
      {step === 1 && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h1 style={titleStyle}>
              Bienvenue sur{" "}
              <span style={{ fontStyle: "italic", color: "var(--coral-500)" }}>arko</span>
            </h1>
            <p style={subtitleStyle}>Comment veux-tu utiliser la plateforme ?</p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 12,
            }}
          >
            <RoleCard
              selected={data.role === "client"}
              onClick={() => set("role", "client")}
              icon="search"
              title="Faire garder mon chien"
              description="Je suis touriste ou local, j'ai besoin d'un sitter quelques heures."
            />
            <RoleCard
              selected={data.role === "sitter"}
              onClick={() => set("role", "sitter")}
              icon="heart"
              title="Devenir dog-sitter"
              description="Je veux garder des chiens et gagner un complément de revenu."
            />
          </div>
        </>
      )}

      {/* Step 2 — Email */}
      {step === 2 && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h1 style={titleStyle}>Quel est ton email ?</h1>
            <p style={subtitleStyle}>
              On t'enverra un lien de vérification — pense à confirmer ton inscription.
            </p>
          </div>
          <div>
            <label htmlFor="email" style={labelStyle}>
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              value={data.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="prenom.nom@email.com"
              style={inputStyle(!!fieldErrors.email)}
              disabled={isPending}
            />
            {fieldErrors.email && <FieldError>{fieldErrors.email}</FieldError>}
          </div>
        </>
      )}

      {/* Step 3 — Password */}
      {step === 3 && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h1 style={titleStyle}>Crée un mot de passe</h1>
            <p style={subtitleStyle}>
              Au moins 8 caractères. Mélange majuscules, chiffres et symboles pour plus de
              sécurité.
            </p>
          </div>
          <div>
            <label htmlFor="password" style={labelStyle}>
              Mot de passe
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                autoFocus
                value={data.password}
                onChange={(e) => set("password", e.target.value)}
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
            {fieldErrors.password && <FieldError>{fieldErrors.password}</FieldError>}
            {data.password && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 8,
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--ink-600)",
                }}
              >
                <div style={{ display: "flex", gap: 3, flex: 1 }}>
                  {[1, 2, 3].map((i) => (
                    <span
                      key={i}
                      style={{
                        flex: 1,
                        height: 4,
                        borderRadius: 2,
                        background:
                          i <= strength.level
                            ? STRENGTH_COLOR[strength.level]
                            : "var(--ink-200)",
                      }}
                    />
                  ))}
                </div>
                <span style={{ minWidth: 50, textAlign: "right" }}>{strength.label}</span>
              </div>
            )}
          </div>
          <div>
            <label htmlFor="confirm_password" style={labelStyle}>
              Confirmer le mot de passe
            </label>
            <input
              id="confirm_password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={data.confirm_password}
              onChange={(e) => set("confirm_password", e.target.value)}
              style={inputStyle(!!fieldErrors.confirm_password)}
              disabled={isPending}
            />
            {fieldErrors.confirm_password && (
              <FieldError>{fieldErrors.confirm_password}</FieldError>
            )}
          </div>
        </>
      )}

      {/* Step 4 — Personal info */}
      {step === 4 && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h1 style={titleStyle}>Quelques infos sur toi</h1>
            <p style={subtitleStyle}>
              On a besoin de ton nom et ton numéro pour te mettre en contact avec
              {data.role === "sitter" ? " les clients" : " les sitters"}.
            </p>
          </div>
          <div>
            <label htmlFor="full_name" style={labelStyle}>
              Nom complet
            </label>
            <input
              id="full_name"
              type="text"
              autoComplete="name"
              autoFocus
              value={data.full_name}
              onChange={(e) => set("full_name", e.target.value)}
              placeholder="Camille Lambert"
              style={inputStyle(!!fieldErrors.full_name)}
              disabled={isPending}
            />
            {fieldErrors.full_name && <FieldError>{fieldErrors.full_name}</FieldError>}
          </div>
          <div>
            <label htmlFor="phone" style={labelStyle}>
              Téléphone <span style={{ color: "var(--ink-500)" }}>(optionnel)</span>
            </label>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              value={data.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+33 6 12 34 56 78"
              style={inputStyle(!!fieldErrors.phone)}
              disabled={isPending}
            />
            {fieldErrors.phone && <FieldError>{fieldErrors.phone}</FieldError>}
          </div>
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--ink-700)",
              lineHeight: 1.5,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={data.terms}
              onChange={(e) => set("terms", e.target.checked)}
              style={{ marginTop: 2, width: 16, height: 16, accentColor: "var(--coral-500)" }}
              disabled={isPending}
            />
            <span>
              J&apos;accepte les{" "}
              <Link
                href="/cgu"
                target="_blank"
                style={{ color: "var(--coral-600)", textDecoration: "underline" }}
              >
                conditions générales
              </Link>{" "}
              et la{" "}
              <Link
                href="/confidentialite"
                target="_blank"
                style={{ color: "var(--coral-600)", textDecoration: "underline" }}
              >
                politique de confidentialité
              </Link>
              .
            </span>
          </label>
        </>
      )}

      {/* Form-level error */}
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
            lineHeight: 1.5,
          }}
          role="alert"
        >
          {error}
        </div>
      )}

      {/* CTA */}
      <button
        type="button"
        className="btn btn-primary btn-lg"
        onClick={isLast ? handleSubmit : goNext}
        disabled={isPending}
        style={{ width: "100%" }}
      >
        {isPending
          ? "Création du compte…"
          : isLast
            ? "Créer mon compte"
            : step === 1
              ? data.role === "sitter"
                ? "Devenir dog-sitter"
                : "Continuer"
              : "Continuer"}
      </button>

      {step === 2 && (
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: "var(--ink-600)",
            textAlign: "center",
            margin: 0,
          }}
        >
          Tu as déjà un compte ?{" "}
          <Link href="/connexion" style={{ color: "var(--coral-600)", fontWeight: 600 }}>
            Connecte-toi
          </Link>
        </p>
      )}
    </div>
  );
}

function RoleCard({
  selected,
  onClick,
  icon,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  icon: "search" | "heart";
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: "left",
        padding: "16px 18px",
        borderRadius: 16,
        border: `2px solid ${selected ? "var(--coral-500)" : "var(--ink-200)"}`,
        background: selected ? "var(--coral-50)" : "white",
        display: "flex",
        gap: 14,
        alignItems: "center",
        cursor: "pointer",
        transition: "border 0.15s, background 0.15s",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          background: selected ? "var(--coral-500)" : "var(--peach-100)",
          color: selected ? "white" : "var(--coral-600)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon name={icon} size={20} color={selected ? "white" : "var(--coral-600)"} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 15, color: "var(--ink-900)" }}>{title}</div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: "var(--ink-600)",
            marginTop: 2,
            lineHeight: 1.5,
          }}
        >
          {description}
        </div>
      </div>
    </button>
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
