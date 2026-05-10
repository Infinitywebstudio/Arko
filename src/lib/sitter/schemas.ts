import { z } from "zod";

import { isValidZoneId } from "@/lib/zones";

// ---------- Profile fields -----------------------------------

const bioSchema = z
  .string()
  .trim()
  .max(2000, { message: "Maximum 2000 caractères" })
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional();

const experienceYearsSchema = z
  .union([z.number(), z.string()])
  .transform((v) => (v === "" || v === null || v === undefined ? null : Number(v)))
  .pipe(
    z
      .number()
      .int({ message: "Nombre d'années entier" })
      .min(0, { message: "Minimum 0" })
      .max(80, { message: "Maximum 80" })
      .nullable(),
  )
  .nullable()
  .optional();

// Zone IDs come from a curated TS constant (src/lib/zones.ts). We reject any value
// not in that list — keeps DB rows aligned with the dropdown and prevents stale
// or typo'd zones leaking in via crafted requests.
const serviceZoneItemSchema = z
  .string()
  .trim()
  .refine(isValidZoneId, { message: "Zone invalide" });

const serviceZonesSchema = z
  .array(serviceZoneItemSchema)
  .max(30, { message: "Maximum 30 zones" })
  .transform((arr) => Array.from(new Set(arr))) // de-duplicate
  .default([]);

// HH:MM matcher (24h, optional seconds ignored). Used by availability slots only.
const timeStringSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { message: "Format attendu HH:MM" });

export const sitterProfileSchema = z.object({
  bio: bioSchema,
  experience_years: experienceYearsSchema,
  accepts_dangerous_breeds: z.boolean().default(false),
  service_zones: serviceZonesSchema,
});

export type SitterProfileInput = z.infer<typeof sitterProfileSchema>;

// ---------- Availability slots -------------------------------

export const availabilitySlotSchema = z
  .object({
    weekday: z
      .union([z.number(), z.string()])
      .transform((v) => Number(v))
      .pipe(z.number().int().min(0).max(6)),
    start_time: timeStringSchema,
    end_time: timeStringSchema,
  })
  .refine((s) => s.end_time > s.start_time, {
    message: "L'heure de fin doit être après l'heure de début",
    path: ["end_time"],
  });

export const availabilityListSchema = z
  .array(availabilitySlotSchema)
  .max(7 * 4, { message: "Trop de créneaux (maximum 4 par jour)" });

// ---------- Avatar upload ------------------------------------

const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

export const avatarFileSchema = z
  .instanceof(File, { message: "Fichier requis" })
  .refine((f) => f.size > 0, { message: "Fichier vide" })
  .refine((f) => f.size <= AVATAR_MAX_BYTES, { message: "Fichier trop lourd (maximum 5 Mo)" })
  .refine((f) => (ALLOWED_AVATAR_TYPES as readonly string[]).includes(f.type), {
    message: "Format non supporté (JPEG, PNG ou WebP)",
  });
