import type { Metadata } from "next";
import Link from "next/link";

import { requireRole } from "@/lib/auth/helpers";
import { getSitterProfile } from "@/lib/sitter/helpers";
import AvatarUploader from "@/components/sitter/AvatarUploader";
import SitterProfileForm from "@/components/sitter/SitterProfileForm";

export const metadata: Metadata = {
  title: "Mon profil sitter · ARKO",
};

export default async function SitterProfilePage() {
  const session = await requireRole("sitter");
  const sitterProfile = await getSitterProfile(session.userId);

  if (!sitterProfile) {
    return (
      <div
        style={{
          background: "white",
          padding: "var(--space-8)",
          borderRadius: 16,
          border: "1px solid var(--ink-200)",
        }}
      >
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--ink-700)" }}>
          Ton profil sitter n&apos;est pas encore initialisé. Reconnecte-toi ou contacte le support.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
      <div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: "clamp(24px, 3vw, 36px)",
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
            margin: 0,
            marginBottom: 8,
          }}
        >
          Mon <span style={{ color: "var(--coral-500)" }}>profil</span>
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
          Ces informations sont visibles par les clients qui cherchent un sitter.{" "}
          <Link
            href={`/sitters/${session.userId}`}
            style={{ color: "var(--coral-600)", fontWeight: 600, textDecoration: "underline" }}
            target="_blank"
          >
            Voir ton profil public →
          </Link>
        </p>
      </div>

      <section
        style={{
          background: "white",
          padding: "var(--space-8)",
          borderRadius: 24,
          border: "1px solid var(--ink-200)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-6)",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--ink-500)",
            margin: 0,
          }}
        >
          Photo
        </h2>
        <AvatarUploader
          currentUrl={session.profile.avatar_url}
          fallbackName={session.profile.full_name}
        />
      </section>

      <section
        style={{
          background: "white",
          padding: "var(--space-8)",
          borderRadius: 24,
          border: "1px solid var(--ink-200)",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--ink-500)",
            margin: 0,
            marginBottom: "var(--space-5)",
          }}
        >
          Informations
        </h2>
        <SitterProfileForm
          initial={sitterProfile}
          identity={{
            full_name: session.profile.full_name,
            phone: session.profile.phone,
          }}
        />
      </section>
    </div>
  );
}
