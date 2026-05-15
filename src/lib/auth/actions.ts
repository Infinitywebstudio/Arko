"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { requireUser } from "./helpers";
import {
  deleteAccountSchema,
  forgotPasswordSchema,
  identitySchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  updateEmailSchema,
  updatePasswordSchema,
} from "./schemas";

export type ActionResult =
  | { ok: true; redirectTo?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function fieldErrorsFromZod(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/**
 * Translate the most common Supabase Auth error messages to French.
 * Anything we don't recognise falls back to a generic message — never
 * leak raw provider errors to the user.
 */
function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "Email ou mot de passe incorrect.";
  if (m.includes("email not confirmed"))
    return "Email pas encore vérifié. Consulte ta boîte de réception.";
  if (m.includes("user already registered") || m.includes("already been registered"))
    return "Un compte existe déjà avec cet email.";
  if (m.includes("rate limit"))
    return "Trop de tentatives. Réessaye dans quelques minutes.";
  if (m.includes("password should be at least"))
    return "Mot de passe trop court (8 caractères minimum).";
  return "Une erreur est survenue. Réessaye dans un instant.";
}

// =============================================================
// Sign up
// =============================================================
export async function signUpAction(formData: FormData): Promise<ActionResult> {
  const raw = {
    role: formData.get("role"),
    email: formData.get("email"),
    password: formData.get("password"),
    full_name: formData.get("full_name"),
    phone: formData.get("phone") ?? "",
    terms: formData.get("terms") === "on" || formData.get("terms") === "true",
  };

  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Vérifie les informations saisies.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }
  const { email, password, full_name, phone, role } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role, full_name, phone },
      emailRedirectTo: `${getSiteUrl()}/auth/callback?next=/compte`,
    },
  });

  if (error) {
    return { ok: false, error: translateAuthError(error.message) };
  }

  // Supabase sends a verification email. We don't auto-login — the user
  // must click the link first. We redirect to a "check your email" view.
  return { ok: true, redirectTo: "/inscription/verifier-email" };
}

// =============================================================
// Sign in
// =============================================================
export async function signInAction(formData: FormData): Promise<ActionResult> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Email ou mot de passe invalide.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { ok: false, error: translateAuthError(error.message) };
  }

  const redirectTo = (formData.get("redirect") as string) || "/compte";
  // Only allow internal redirects (defence against open-redirect).
  const safeRedirect = redirectTo.startsWith("/") && !redirectTo.startsWith("//")
    ? redirectTo
    : "/compte";

  revalidatePath("/", "layout");
  return { ok: true, redirectTo: safeRedirect };
}

// =============================================================
// Sign out
// =============================================================
export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

// =============================================================
// Forgot password — sends reset email
// =============================================================
export async function forgotPasswordAction(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Email invalide.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${getSiteUrl()}/reinitialiser-mot-de-passe`,
  });

  if (error) {
    return { ok: false, error: translateAuthError(error.message) };
  }

  // Always succeed publicly to avoid email-enumeration. Supabase already
  // does this server-side but we mirror the contract here.
  return { ok: true };
}

// =============================================================
// Reset password — sets a new password (user already authenticated via reset link)
// =============================================================
export async function resetPasswordAction(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirm_password: formData.get("confirm_password"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Vérifie les informations saisies.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { ok: false, error: translateAuthError(error.message) };
  }

  revalidatePath("/", "layout");
  return { ok: true, redirectTo: "/compte" };
}

// =============================================================
// Update identity — full_name + phone on public.profiles
// =============================================================
//
// Role-agnostic: both clients and sitters use this. The DB-level trigger
// (`prevent_user_role_change`) and RLS (`auth.uid() = id`) make it impossible
// for a user to escalate to a different role or overwrite someone else's
// profile here — even though we don't pass `role` we still re-assert the
// UPDATE is scoped to the current user's id.
//
// We revalidate every surface where the identity is rendered so the new
// values show up without a hard refresh:
//   * /compte                  — landing card displays name/phone
//   * /compte/parametres       — form's `initial` props come from the session
//   * /sitter/profil           — same form re-uses identity
//   * /sitters/[id]            — public sitter page shows the name
//
// Note on snapshots: bookings already created keep their `client_full_name`
// and `client_phone` snapshots. That's intentional — the sitter has the
// number the client used at booking time, not whatever it becomes later.
export async function updateIdentityAction(
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireUser();

  const parsed = identitySchema.safeParse({
    full_name: formData.get("full_name"),
    phone: formData.get("phone") ?? "",
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Vérifie les informations saisies.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone ?? null,
    })
    .eq("id", session.userId);

  if (error) {
    return { ok: false, error: "Impossible d'enregistrer tes informations." };
  }

  revalidatePath("/compte");
  revalidatePath("/compte/parametres");
  if (session.profile.role === "sitter") {
    revalidatePath("/sitter/profil");
    revalidatePath(`/sitters/${session.userId}`);
  }
  return { ok: true };
}

// =============================================================
// Update email — sends a confirmation email to the new address
// =============================================================
//
// Supabase's `auth.updateUser({ email })` behaviour: depending on project
// settings (Secure email change), it sends a confirmation link to the new
// address (and optionally to the old one). The email is not actually
// changed until the user clicks through. We surface a generic success
// message either way.
export async function updateEmailAction(formData: FormData): Promise<ActionResult> {
  await requireUser();

  const parsed = updateEmailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Email invalide.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser(
    { email: parsed.data.email },
    { emailRedirectTo: `${getSiteUrl()}/auth/callback?next=/compte` },
  );

  if (error) {
    return { ok: false, error: translateAuthError(error.message) };
  }

  return { ok: true };
}

// =============================================================
// Update password — requires the current password (re-auth)
// =============================================================
//
// Defence in depth: even though the user is authenticated, we re-verify
// the current password before changing it. Stops a hijacked session from
// silently rotating credentials.
export async function updatePasswordAction(formData: FormData): Promise<ActionResult> {
  const session = await requireUser();

  const parsed = updatePasswordSchema.safeParse({
    current_password: formData.get("current_password"),
    password: formData.get("password"),
    confirm_password: formData.get("confirm_password"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Vérifie les informations saisies.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const supabase = await createClient();

  // Re-authenticate. signInWithPassword refreshes the session cookies for the
  // same user — safe to call here.
  const reauth = await supabase.auth.signInWithPassword({
    email: session.email,
    password: parsed.data.current_password,
  });
  if (reauth.error) {
    return {
      ok: false,
      error: "Mot de passe actuel incorrect.",
      fieldErrors: { current_password: "Mot de passe actuel incorrect" },
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { ok: false, error: translateAuthError(error.message) };
  }

  return { ok: true };
}

// =============================================================
// Delete account — re-auth + irreversible
// =============================================================
//
// Cascade order:
//   1. Verify the password (defence in depth).
//   2. Best-effort cleanup of user-owned storage (avatars). Orphans are not
//      catastrophic — RLS on the bucket already prevents access — but we
//      try anyway to honour data-deletion expectations.
//   3. admin.deleteUser via service_role. ON DELETE CASCADE on
//      profiles.id → auth.users.id removes the profile (and sitter_profiles,
//      sitter_availability, sitter_badges by their own cascades).
//   4. Sign out the local session (clears cookies).
//
// Storage cleanup is intentionally non-blocking: a leftover image is far less
// bad than a half-deleted account.
export async function deleteAccountAction(formData: FormData): Promise<ActionResult> {
  const session = await requireUser();

  const parsed = deleteAccountSchema.safeParse({
    current_password: formData.get("current_password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Vérifie les informations saisies.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const supabase = await createClient();

  const reauth = await supabase.auth.signInWithPassword({
    email: session.email,
    password: parsed.data.current_password,
  });
  if (reauth.error) {
    return {
      ok: false,
      error: "Mot de passe incorrect.",
      fieldErrors: { current_password: "Mot de passe incorrect" },
    };
  }

  // Block deletion if the user has active bookings on either side. The
  // bookings table cascades on profile deletion, which would silently wipe
  // a confirmed garde from the counterparty's history without triggering
  // a refund. Forcing the user to cancel first keeps the financial flow
  // intact (cancel/refuse actions handle the Stripe refund + email).
  const nowIso = new Date().toISOString();
  const userField = session.profile.role === "sitter" ? "sitter_id" : "client_id";
  const { count: activeCount, error: countErr } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq(userField, session.userId)
    .in("status", ["pending_acceptance", "confirmed"])
    .gt("start_at", nowIso);

  if (countErr) {
    return { ok: false, error: "Vérification des réservations impossible. Réessaye." };
  }
  if ((activeCount ?? 0) > 0) {
    const plural = (activeCount ?? 0) > 1;
    return {
      ok: false,
      error: plural
        ? `Tu as ${activeCount} réservations à venir. Annule-les avant de supprimer ton compte.`
        : "Tu as une réservation à venir. Annule-la avant de supprimer ton compte.",
    };
  }

  // Best-effort storage cleanup (avatars + sitter-documents).
  for (const bucket of ["avatars", "sitter-documents"]) {
    try {
      const { data: files } = await supabase.storage
        .from(bucket)
        .list(session.userId, { limit: 100 });
      if (files && files.length > 0) {
        await supabase.storage
          .from(bucket)
          .remove(files.map((f) => `${session.userId}/${f.name}`));
      }
    } catch {
      // Swallow — storage failure must not block account deletion.
    }
  }

  // Hard-delete the auth user. Cascades remove all linked rows.
  const admin = createAdminClient();
  const { error: delErr } = await admin.auth.admin.deleteUser(session.userId);
  if (delErr) {
    return { ok: false, error: "Suppression impossible. Contacte le support." };
  }

  // Clear local session cookies. scope=local skips the /auth/logout round-trip,
  // which would 401 anyway since auth.users is gone.
  await supabase.auth.signOut({ scope: "local" });

  revalidatePath("/", "layout");
  return { ok: true, redirectTo: "/" };
}
