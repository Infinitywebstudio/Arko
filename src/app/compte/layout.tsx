import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/helpers";
import { DashboardHeader } from "@/components/account/DashboardHeader";

/**
 * Client-area shell — gates the whole /compte/* subtree to authenticated
 * clients and renders the shared chrome (logo, top-nav, user dropdown).
 *
 * Sitters who land here are routed to their own hub. We don't use
 * requireRole("client") because its built-in mismatched-role redirect points
 * back at /compte — which would loop forever for a sitter. Doing the redirect
 * explicitly avoids that footgun.
 */
export default async function CompteLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser("/compte");
  if (session.profile.role === "sitter") redirect("/sitter");

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--peach-50)",
      }}
    >
      <DashboardHeader
        roleLabel="Client"
        homeHref="/compte"
        navLinks={[
          { href: "/compte", label: "Mon compte" },
          { href: "/compte/bookings", label: "Mes réservations" },
          { href: "/compte/parametres", label: "Paramètres" },
        ]}
        settingsHref="/compte/parametres"
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
          padding: "var(--space-10) var(--space-6)",
        }}
      >
        {children}
      </main>
    </div>
  );
}
