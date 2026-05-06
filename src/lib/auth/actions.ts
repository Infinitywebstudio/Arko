"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import {
  signUpSchema,
  signInSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
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
