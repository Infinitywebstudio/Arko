import { getCurrentUser } from "@/lib/auth/helpers";
import BottomNav, { type BottomNavTab } from "./BottomNav";

/**
 * Picks which set of tabs to render based on whether the visitor is logged
 * out, a client, or a sitter. Server-side so we can read the session without
 * any client-side hydration of auth state.
 *
 * Tab counts are kept ≤ 5 — anything more is unreadable on a 360px viewport.
 * Sitter parameters and other rarely-used links don't make the bottom nav;
 * they live in their respective sub-pages.
 */
const ANON_TABS: BottomNavTab[] = [
  { href: "/", icon: "heart", label: "Accueil" },
  { href: "/sitters", icon: "search", label: "Sitters", matchPrefix: true },
  { href: "/connexion", icon: "user", label: "Connexion" },
];

const CLIENT_TABS: BottomNavTab[] = [
  { href: "/", icon: "heart", label: "Accueil" },
  { href: "/sitters", icon: "search", label: "Sitters", matchPrefix: true },
  {
    href: "/compte/bookings",
    icon: "calendar",
    label: "Réservations",
    matchPrefix: true,
  },
  { href: "/compte", icon: "user", label: "Compte" },
];

const SITTER_TABS: BottomNavTab[] = [
  { href: "/sitter", icon: "calendar", label: "Aujourd'hui" },
  { href: "/sitter/demandes", icon: "bell", label: "Demandes", matchPrefix: true },
  { href: "/sitter/profil", icon: "user", label: "Profil", matchPrefix: true },
  {
    href: "/sitter/disponibilites",
    icon: "clock",
    label: "Dispos",
    matchPrefix: true,
  },
];

export default async function BottomNavRoot() {
  const session = await getCurrentUser();
  if (!session) return <BottomNav tabs={ANON_TABS} />;
  if (session.profile.role === "sitter") return <BottomNav tabs={SITTER_TABS} />;
  return <BottomNav tabs={CLIENT_TABS} />;
}
