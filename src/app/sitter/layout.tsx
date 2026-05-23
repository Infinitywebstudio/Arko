import { requireRole } from "@/lib/auth/helpers";
import { DashboardHeader } from "@/components/account/DashboardHeader";

export default async function SitterLayout({ children }: { children: React.ReactNode }) {
  // Gate the entire route group: sitters only.
  const session = await requireRole("sitter");

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--ink-50)" }}>
      <DashboardHeader
        homeHref="/sitter"
        navLinks={[
          { href: "/sitter", label: "Aujourd'hui" },
          { href: "/sitter/demandes", label: "Demandes" },
          { href: "/sitter/profil", label: "Mon profil" },
          { href: "/sitter/disponibilites", label: "Disponibilités" },
          { href: "/sitter/parametres", label: "Paramètres" },
        ]}
        settingsHref="/sitter/parametres"
        profileHref="/sitter/profil"
        fullName={session.profile.full_name}
        email={session.email}
        avatarUrl={session.profile.avatar_url}
      />
      <main
        style={{
          flex: 1,
          maxWidth: 960,
          width: "100%",
          margin: "0 auto",
          // Top padding clears the floating fixed pill (top:16 + ~56px)
          // and adds breathing room before page content.
          padding: "120px var(--space-6) var(--space-10)",
        }}
      >
        {children}
      </main>
    </div>
  );
}
