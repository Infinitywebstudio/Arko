import { z } from "zod";

import { isValidZoneId } from "@/lib/zones";

/**
 * Input schema for the booking creation form. Inputs are stripped to the
 * minimum the client controls: sitter, when, how long, options, where, notes.
 *
 * Pricing, urgent/late flags, and client identity are derived server-side and
 * are NOT accepted from the form — keeping pricing-relevant inputs out of user
 * control is non-negotiable for trust. The Postgres trigger then double-checks
 * the price split as a final safety net.
 */
export const createBookingSchema = z.object({
  sitter_id: z.string().uuid({ message: "Sitter invalide" }),
  // YYYY-MM-DD — server combines with start_hour and Europe/Paris to build a
  // full instant.
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Date invalide" }),
  // 0–23 inclusive (hour-pile granularity per MVP scope).
  start_hour: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .pipe(
      z
        .number()
        .int({ message: "Heure invalide" })
        .min(0, { message: "Heure invalide" })
        .max(23, { message: "Heure invalide" }),
    ),
  duration_hours: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .pipe(
      z
        .number()
        .int()
        .refine((v): v is 1 | 2 | 3 => v === 1 || v === 2 || v === 3, {
          message: "Durée invalide",
        }),
    ),
  dangerous_breed: z.boolean().default(false),
  meeting_zone_id: z
    .union([z.string(), z.null()])
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || isValidZoneId(v), { message: "Zone invalide" }),
  client_notes: z
    .string()
    .trim()
    .max(500, { message: "Maximum 500 caractères" })
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
