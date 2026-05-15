import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/helpers";
import DeleteAccountForm from "@/components/account/DeleteAccountForm";
import EmailForm from "@/components/account/EmailForm";
import IdentityForm from "@/components/account/IdentityForm";
import PasswordForm from "@/components/account/PasswordForm";

export const metadata: Metadata = {
  title: "Paramètres du compte · ARKO",
};

const sectionStyle: React.CSSProperties = {
  background: "white",
  padding: "var(--space-8)",
  borderRadius: 24,
  border: "1px solid var(--ink-200)",
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-5)",
};

const sectionLabelStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--ink-500)",
  margin: 0,
};

const sectionHelpStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 13,
  color: "var(--ink-600)",
  lineHeight: 1.6,
  margin: 0,
};

export default async function ClientAccountSettingsPage() {
  // The /compte layout has already gated the route to authenticated clients,
  // so requireUser here is purely to surface the session — no extra redirect.
  const session = await requireUser();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
      <div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: "clamp(36px, 4vw, 48px)",
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
            margin: 0,
            marginBottom: 8,
          }}
        >
          <span style={{ fontStyle: "italic", color: "var(--coral-500)" }}>Paramètres</span> du compte
        </h1>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 14,
            color: "var(--ink-600)",
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          Tes informations, email, mot de passe et suppression du compte.
        </p>
      </div>

      <section style={sectionStyle}>
        <div>
          <h2 style={sectionLabelStyle}>Mes informations</h2>
          <p style={{ ...sectionHelpStyle, marginTop: 6 }}>
            Nom et téléphone — affichés à ton sitter une fois la garde acceptée.
          </p>
        </div>
        <IdentityForm
          initial={{
            full_name: session.profile.full_name,
            phone: session.profile.phone,
          }}
        />
      </section>

      <section style={sectionStyle}>
        <div>
          <h2 style={sectionLabelStyle}>Email</h2>
          <p style={{ ...sectionHelpStyle, marginTop: 6 }}>
            Le changement prend effet uniquement après confirmation par le lien envoyé à la nouvelle adresse.
          </p>
        </div>
        <EmailForm currentEmail={session.email} />
      </section>

      <section style={sectionStyle}>
        <div>
          <h2 style={sectionLabelStyle}>Mot de passe</h2>
          <p style={{ ...sectionHelpStyle, marginTop: 6 }}>
            Au moins 8 caractères. Ton mot de passe actuel est requis.
          </p>
        </div>
        <PasswordForm />
      </section>

      <section
        style={{
          ...sectionStyle,
          border: "1px solid var(--danger-500)",
          background: "var(--danger-50)",
        }}
      >
        <div>
          <h2 style={{ ...sectionLabelStyle, color: "var(--danger-700)" }}>
            Zone de danger
          </h2>
          <p style={{ ...sectionHelpStyle, marginTop: 6, color: "var(--danger-700)" }}>
            La suppression du compte est immédiate et irréversible.
          </p>
        </div>
        <DeleteAccountForm role="client" />
      </section>
    </div>
  );
}
