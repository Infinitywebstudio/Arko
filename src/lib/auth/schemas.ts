import { z } from "zod";

const emailSchema = z
  .string({ message: "Email requis" })
  .trim()
  .toLowerCase()
  .email({ message: "Email invalide" });

// Min 8 chars matches Supabase Auth's default minimum_password_length.
// The signup wizard surfaces a strength meter on top of this, but server-side
// we only enforce the floor — UX guidance is not a security control.
const passwordSchema = z
  .string({ message: "Mot de passe requis" })
  .min(8, { message: "Minimum 8 caractères" })
  .max(128, { message: "Maximum 128 caractères" });

// E.164 international phone shape: leading +, then 7–17 digits.
// The UI's PhoneInput always emits the + prefix; this rule enforces it on
// the server too. Spaces, dots, dashes are stripped before validation so
// human-typed numbers still pass when they reach the server through a
// non-UI path (CLI scripts, raw API calls).
const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s.\-()]/g, ""))
  .refine((v) => v === "" || /^\+[1-9]\d{6,16}$/.test(v), {
    message: "Numéro de téléphone invalide",
  })
  .transform((v) => (v === "" ? null : v));

const fullNameSchema = z
  .string({ message: "Nom requis" })
  .trim()
  .min(2, { message: "Minimum 2 caractères" })
  .max(100, { message: "Maximum 100 caractères" });

export const roleSchema = z.enum(["client", "sitter"], {
  message: "Rôle invalide",
});

export const signUpSchema = z.object({
  role: roleSchema,
  email: emailSchema,
  password: passwordSchema,
  full_name: fullNameSchema,
  phone: phoneSchema.optional().nullable(),
  terms: z.literal(true, { message: "Vous devez accepter les conditions" }),
});
export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string({ message: "Mot de passe requis" }).min(1, { message: "Mot de passe requis" }),
});
export type SignInInput = z.infer<typeof signInSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirm_password"],
  });

// Editable identity fields shared by client and sitter accounts.
// Note: phoneSchema yields `string | null`; full_name is required (NOT NULL in DB).
export const identitySchema = z.object({
  full_name: fullNameSchema,
  phone: phoneSchema.optional().nullable(),
});
export type IdentityInput = z.infer<typeof identitySchema>;

// New email — re-used by the email-change flow (Supabase sends a confirmation).
export const updateEmailSchema = z.object({
  email: emailSchema,
});

// Password change requires the current password (re-auth on the server before
// calling auth.updateUser). We deliberately do NOT trust the session alone for
// destructive identity actions.
export const updatePasswordSchema = z
  .object({
    current_password: z.string({ message: "Mot de passe actuel requis" }).min(1, { message: "Mot de passe actuel requis" }),
    password: passwordSchema,
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirm_password"],
  });

// Account deletion: re-auth via current password + an explicit "SUPPRIMER" word
// to defeat accidental clicks. The string is locale-bound to French on purpose;
// this is a UX guard, not a security boundary.
export const deleteAccountSchema = z.object({
  current_password: z.string({ message: "Mot de passe requis" }).min(1, { message: "Mot de passe requis" }),
  confirm: z.literal("SUPPRIMER", { message: "Tape SUPPRIMER pour confirmer" }),
});
