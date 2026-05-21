import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type UserRole = Database["public"]["Enums"]["user_role"];

export type AuthSession = {
  userId: string;
  email: string;
  profile: Profile;
};

/** Everything the public nav / dashboard header need to render the logged-in
 *  account control (UserMenu), derived from the session's role. */
export type NavUser = {
  /** Landing page for the user's space (mobile icon + "Mon espace" links). */
  spaceHref: string;
  settingsHref: string;
  /** Sitters have a dedicated profile page; clients manage it in settings. */
  profileHref?: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
};

/** Maps a session to the nav-facing user shape, or null when logged out. */
export function navUserFrom(session: AuthSession | null): NavUser | null {
  if (!session) return null;
  const isSitter = session.profile.role === "sitter";
  return {
    spaceHref: isSitter ? "/sitter" : "/compte",
    settingsHref: isSitter ? "/sitter/parametres" : "/compte/parametres",
    profileHref: isSitter ? "/sitter/profil" : undefined,
    fullName: session.profile.full_name,
    email: session.email,
    avatarUrl: session.profile.avatar_url,
  };
}

/**
 * Returns the currently authenticated user with their profile, or null.
 * Calls supabase.auth.getUser() (verified, not just decoded) - never trust
 * supabase.auth.getSession() server-side because it does not revalidate
 * the JWT against the auth server.
 *
 * Wrapped in React.cache so concurrent callers during a single render pass
 * (layout + page + child components) share one auth-server roundtrip and one
 * profiles read. Per the Next.js DAL guidance.
 */
export const getCurrentUser = cache(async (): Promise<AuthSession | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) return null;

  return {
    userId: user.id,
    email: user.email ?? "",
    profile,
  };
});

/**
 * Resolves to the current user, or redirects to /connexion otherwise.
 * Use at the top of every Server Action / Server Component that requires auth.
 */
export async function requireUser(redirectPath?: string): Promise<AuthSession> {
  const session = await getCurrentUser();
  if (!session) {
    const dest = redirectPath
      ? `/connexion?redirect=${encodeURIComponent(redirectPath)}`
      : "/connexion";
    redirect(dest);
  }
  return session;
}

/**
 * Resolves to the current user if their role matches; otherwise redirects.
 * Authenticated users with the wrong role are sent to /compte.
 */
export async function requireRole(
  role: UserRole,
  redirectPath?: string,
): Promise<AuthSession> {
  const session = await requireUser(redirectPath);
  if (session.profile.role !== role) {
    redirect("/compte");
  }
  return session;
}
