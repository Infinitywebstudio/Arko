"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/helpers";
import { createClient } from "@/lib/supabase/server";
import { calculatePrice, type Duration } from "./pricing";
import { createBookingSchema } from "./schemas";
import { getStripe } from "@/lib/stripe/client";
import { zoneLabel } from "@/lib/zones";

export type ActionResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

// Booking window: today through J+30. Anything outside is rejected up front.
const MAX_DAYS_AHEAD = 30;
// "Urgent" surcharge applies when the client books less than 30 minutes before
// start. Same threshold the UI uses to label the booking as urgent.
const URGENT_THRESHOLD_MS = 30 * 60 * 1000;
// "Late" surcharge applies when the garde starts at or after 19:00 local time.
const LATE_HOUR_THRESHOLD = 19;
const PARIS_TZ = "Europe/Paris";

function fieldErrorsFromZod(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/**
 * Compute the UTC instant for "<dateStr> at <hour>:00 in Europe/Paris". DST is
 * handled by probing the timezone's offset for that calendar date.
 */
function parisDateTimeToUtc(dateStr: string, hour: number): Date {
  const naiveUtc = new Date(
    `${dateStr}T${String(hour).padStart(2, "0")}:00:00Z`,
  );
  const offsetMs = parisOffsetMs(naiveUtc);
  return new Date(naiveUtc.getTime() - offsetMs);
}

function parisOffsetMs(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PARIS_TZ,
    timeZoneName: "longOffset",
  }).formatToParts(date);
  const offsetPart = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const m = offsetPart.match(/GMT([+-])(\d{2}):?(\d{2})?/);
  if (!m) return 0;
  const sign = m[1] === "+" ? 1 : -1;
  const hh = Number(m[2]);
  const mm = Number(m[3] ?? "0");
  return sign * (hh * 60 + mm) * 60 * 1000;
}

/** Day-of-week (0 = Sunday … 6 = Saturday) of an instant in Europe/Paris. */
function parisWeekday(date: Date): number {
  const dayName = new Intl.DateTimeFormat("en-US", {
    timeZone: PARIS_TZ,
    weekday: "short",
  }).format(date);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(dayName);
}

/** Parse a "HH:MM" or "HH:MM:SS" time string into total minutes since midnight. */
function timeToMinutes(t: string): number {
  const [h = "0", m = "0"] = t.split(":");
  return Number(h) * 60 + Number(m);
}

/**
 * Create a booking and a Stripe Checkout session for it. On success returns a
 * redirect URL pointing at Stripe's hosted page. The booking row stays at
 * `pending_payment` until the Stripe webhook flips it to `pending_acceptance`.
 */
export async function createBookingAction(
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireUser();
  if (session.profile.role !== "client") {
    return { ok: false, error: "Seuls les comptes client peuvent réserver." };
  }

  const raw = {
    sitter_id: formData.get("sitter_id"),
    start_date: formData.get("start_date"),
    start_hour: formData.get("start_hour"),
    duration_hours: formData.get("duration_hours"),
    dangerous_breed:
      formData.get("dangerous_breed") === "on" ||
      formData.get("dangerous_breed") === "true",
    meeting_zone_id: formData.get("meeting_zone_id") ?? null,
    client_notes: formData.get("client_notes") ?? null,
  };
  const parsed = createBookingSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Vérifie les informations saisies.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }
  const input = parsed.data;

  // ---------- Time gates ----------------------------------
  const startAt = parisDateTimeToUtc(input.start_date, input.start_hour);
  const now = new Date();

  if (startAt.getTime() <= now.getTime()) {
    return {
      ok: false,
      error: "Le créneau choisi est déjà passé.",
      fieldErrors: { start_date: "Choisis une date/heure dans le futur" },
    };
  }
  const maxAhead = new Date(now.getTime() + MAX_DAYS_AHEAD * 24 * 60 * 60 * 1000);
  if (startAt.getTime() > maxAhead.getTime()) {
    return {
      ok: false,
      error: `Réservations ouvertes jusqu'à ${MAX_DAYS_AHEAD} jours à l'avance.`,
      fieldErrors: { start_date: `Maximum ${MAX_DAYS_AHEAD} jours à l'avance` },
    };
  }

  // ---------- Slot must fit sitter's weekly availability --
  const supabase = await createClient();
  const weekday = parisWeekday(startAt);
  const { data: slots, error: slotsErr } = await supabase
    .from("sitter_availability")
    .select("start_time, end_time")
    .eq("sitter_id", input.sitter_id)
    .eq("weekday", weekday);
  if (slotsErr) {
    return { ok: false, error: "Impossible de vérifier les disponibilités." };
  }
  const startMin = input.start_hour * 60;
  const endMin = startMin + input.duration_hours * 60;
  const fits =
    slots?.some(
      (s) => timeToMinutes(s.start_time) <= startMin && timeToMinutes(s.end_time) >= endMin,
    ) ?? false;
  if (!fits) {
    return {
      ok: false,
      error: "Le sitter n'est pas disponible sur ce créneau.",
      fieldErrors: { start_hour: "Hors créneaux du sitter" },
    };
  }

  // ---------- Sitter must accept dangerous-breed bookings --
  if (input.dangerous_breed) {
    const { data: sitterProfile } = await supabase
      .from("sitter_profiles")
      .select("accepts_dangerous_breeds")
      .eq("id", input.sitter_id)
      .maybeSingle();
    if (!sitterProfile?.accepts_dangerous_breeds) {
      return {
        ok: false,
        error: "Ce sitter n'accepte pas les chiens de catégorie 1 ou 2.",
        fieldErrors: { dangerous_breed: "Sitter non compatible" },
      };
    }
  }

  // ---------- Server-side derivation ----------------------
  const urgent = startAt.getTime() - now.getTime() < URGENT_THRESHOLD_MS;
  const late = input.start_hour >= LATE_HOUR_THRESHOLD;

  const breakdown = calculatePrice({
    duration: input.duration_hours as Duration,
    dangerous_breed: input.dangerous_breed,
    urgent,
    late,
  });

  // ---------- Insert booking ------------------------------
  const { data: booking, error: insertErr } = await supabase
    .from("bookings")
    .insert({
      client_id: session.userId,
      sitter_id: input.sitter_id,
      status: "pending_payment",
      start_at: startAt.toISOString(),
      duration_hours: input.duration_hours,
      price_cents: breakdown.price_cents,
      sitter_payout_cents: breakdown.sitter_payout_cents,
      platform_fee_cents: breakdown.platform_fee_cents,
      dangerous_breed: input.dangerous_breed,
      urgent,
      late,
      client_full_name: session.profile.full_name,
      client_phone: session.profile.phone,
      meeting_zone_id: input.meeting_zone_id,
      client_notes: input.client_notes ?? null,
    })
    .select("id, price_cents")
    .single();
  if (insertErr || !booking) {
    return { ok: false, error: "Impossible de créer la réservation." };
  }

  // ---------- Stripe Checkout session ---------------------
  const stripe = getStripe();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const dateLabel = new Intl.DateTimeFormat("fr-FR", {
    timeZone: PARIS_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  }).format(startAt);

  const productName = `Garde ${input.duration_hours}h · ${dateLabel}`;
  const meetingLabel = input.meeting_zone_id ? zoneLabel(input.meeting_zone_id) : null;
  const productDescription = [
    meetingLabel ? `Lieu : ${meetingLabel}` : null,
    input.dangerous_breed ? "Chien cat. 1/2 (+5€)" : null,
    urgent ? "Réservation urgente (+7€)" : null,
    late ? "Garde tardive (+7€)" : null,
  ]
    .filter(Boolean)
    .join(" · ") || "ARKO — garde de chien";

  let checkoutUrl: string | null;
  try {
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: booking.price_cents,
            product_data: {
              name: productName,
              description: productDescription,
            },
          },
        },
      ],
      customer_email: session.email,
      metadata: { booking_id: booking.id },
      payment_intent_data: { metadata: { booking_id: booking.id } },
      success_url: `${siteUrl}/reservations/${booking.id}/merci`,
      cancel_url: `${siteUrl}/sitters/${input.sitter_id}`,
      // Auto-expire after 30 min of inactivity — caps the time a slot stays held
      // in pending_payment without payment.
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });
    checkoutUrl = checkout.url;
  } catch (e) {
    // Roll back the booking so the user can retry. Deletion is allowed because
    // the row is still pending_payment and owned by this user (RLS).
    await supabase.from("bookings").delete().eq("id", booking.id);
    const message = e instanceof Error ? e.message : "Erreur Stripe inconnue.";
    return { ok: false, error: `Paiement non initialisé : ${message}` };
  }
  if (!checkoutUrl) {
    await supabase.from("bookings").delete().eq("id", booking.id);
    return { ok: false, error: "Paiement non initialisé." };
  }

  return { ok: true, redirectTo: checkoutUrl };
}

/**
 * Cancel a booking the client owns. Only `pending_acceptance` and `confirmed`
 * are user-cancellable: `pending_payment` is hidden from the user-facing list
 * and expires on its own via Stripe's session timeout, which avoids a race
 * where a user clicks "cancel" while a payment lands.
 *
 * Per MVP scope: cancellation is free up to `start_at`. We refund 100% via the
 * stored payment intent and stamp `refunded_at` for traceability. RLS already
 * scopes the row to the client; we re-read after the auth check to confirm
 * timing and current status before any side effect.
 */
export async function cancelBookingAction(
  bookingId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requireUser();

  const supabase = await createClient();
  const { data: booking, error: readErr } = await supabase
    .from("bookings")
    .select("id, status, start_at, stripe_payment_intent_id, refunded_at")
    .eq("id", bookingId)
    .eq("client_id", session.userId)
    .maybeSingle();
  if (readErr || !booking) {
    return { ok: false, error: "Réservation introuvable." };
  }

  const startMs = new Date(booking.start_at).getTime();
  if (startMs <= Date.now()) {
    return { ok: false, error: "La garde a déjà commencé." };
  }

  const cancellable: typeof booking.status[] = ["pending_acceptance", "confirmed"];
  if (!cancellable.includes(booking.status)) {
    return { ok: false, error: "Cette réservation ne peut plus être annulée." };
  }

  // Refund through Stripe. We DON'T flip the booking status until the refund
  // call returns: if Stripe rejects we want the user to retry, not be stuck
  // with a cancelled-but-unrefunded row.
  if (booking.stripe_payment_intent_id && !booking.refunded_at) {
    try {
      await getStripe().refunds.create({
        payment_intent: booking.stripe_payment_intent_id,
        // Stripe rejects duplicate refunds with a clear error; default behaviour
        // is fine.
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erreur Stripe inconnue.";
      return { ok: false, error: `Remboursement impossible : ${message}` };
    }
  }

  const { error: updErr } = await supabase
    .from("bookings")
    .update({
      status: "cancelled_by_client",
      refunded_at: new Date().toISOString(),
    })
    .eq("id", bookingId);
  if (updErr) {
    return { ok: false, error: "Mise à jour impossible. Contacte le support." };
  }

  revalidatePath("/compte/bookings");
  return { ok: true };
}

// =============================================================
// Sitter-side actions: accept / refuse / close
// =============================================================
// All three are gated by requireRole("sitter") + RLS "sitter updates own
// booking" — only the booking's sitter can flip its state. The action layer
// then enforces which transitions are legal (a sitter can't, for instance,
// refuse a confirmed booking; the cancellation path is the client's).

/**
 * Sitter accepts a pending_acceptance booking. Flips it to `confirmed` and
 * fires the client notification email with the sitter's contact info.
 */
export async function acceptBookingAction(
  bookingId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requireUser();
  if (session.profile.role !== "sitter") {
    return { ok: false, error: "Action réservée aux sitters." };
  }

  const supabase = await createClient();
  // Atomic transition: only succeeds if the row is still pending_acceptance.
  // Guards against duplicate-click and concurrent accept/refuse.
  const { data: updated, error } = await supabase
    .from("bookings")
    .update({ status: "confirmed" })
    .eq("id", bookingId)
    .eq("sitter_id", session.userId)
    .eq("status", "pending_acceptance")
    .select("id")
    .maybeSingle();
  if (error) {
    return { ok: false, error: "Impossible d'accepter la garde." };
  }
  if (!updated) {
    return { ok: false, error: "Cette demande n'est plus en attente." };
  }

  // Best-effort client notification. Email failure must not flip the booking
  // back — that would create an inconsistent state. We log and move on; the
  // sitter still sees the row as confirmed and can phone the client directly.
  const { sendClientBookingAcceptedNotification } = await import("@/lib/email/booking");
  void sendClientBookingAcceptedNotification(bookingId);

  revalidatePath("/sitter/demandes");
  revalidatePath("/sitter");
  return { ok: true };
}

/**
 * Sitter refuses a pending_acceptance booking. Refunds Stripe automatically
 * then flips the row to refused_by_sitter and notifies the client.
 */
export async function refuseBookingAction(
  bookingId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requireUser();
  if (session.profile.role !== "sitter") {
    return { ok: false, error: "Action réservée aux sitters." };
  }

  const supabase = await createClient();
  const { data: booking, error: readErr } = await supabase
    .from("bookings")
    .select("id, status, stripe_payment_intent_id, refunded_at")
    .eq("id", bookingId)
    .eq("sitter_id", session.userId)
    .maybeSingle();
  if (readErr || !booking) {
    return { ok: false, error: "Demande introuvable." };
  }
  if (booking.status !== "pending_acceptance") {
    return { ok: false, error: "Cette demande n'est plus en attente." };
  }

  // Refund FIRST. If Stripe fails the booking stays pending_acceptance and
  // the sitter can retry — better than a refused-but-not-refunded ghost.
  if (booking.stripe_payment_intent_id && !booking.refunded_at) {
    try {
      await getStripe().refunds.create({
        payment_intent: booking.stripe_payment_intent_id,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erreur Stripe inconnue.";
      return { ok: false, error: `Remboursement impossible : ${message}` };
    }
  }

  const { error: updErr } = await supabase
    .from("bookings")
    .update({
      status: "refused_by_sitter",
      refunded_at: new Date().toISOString(),
    })
    .eq("id", bookingId)
    .eq("status", "pending_acceptance");
  if (updErr) {
    return { ok: false, error: "Mise à jour impossible. Contacte le support." };
  }

  const { sendClientBookingRefusedNotification } = await import("@/lib/email/booking");
  void sendClientBookingRefusedNotification(bookingId);

  revalidatePath("/sitter/demandes");
  revalidatePath("/sitter");
  return { ok: true };
}

/**
 * Sitter closes a confirmed booking after the garde period has ended. Records
 * an optional free-text comment (no rating, per MVP scope). Closure is
 * allowed any time after start_at — we don't gate on end_at because the
 * sitter is the ground-truth source on whether the garde actually wrapped up.
 */
export async function closeBookingAction(
  bookingId: string,
  comment: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requireUser();
  if (session.profile.role !== "sitter") {
    return { ok: false, error: "Action réservée aux sitters." };
  }

  const trimmedComment = (comment ?? "").trim();
  if (trimmedComment.length > 1000) {
    return { ok: false, error: "Commentaire trop long (1000 caractères max)." };
  }

  const supabase = await createClient();
  const { data: booking, error: readErr } = await supabase
    .from("bookings")
    .select("id, status, start_at")
    .eq("id", bookingId)
    .eq("sitter_id", session.userId)
    .maybeSingle();
  if (readErr || !booking) {
    return { ok: false, error: "Garde introuvable." };
  }
  if (booking.status !== "confirmed") {
    return { ok: false, error: "Cette garde ne peut plus être clôturée." };
  }
  if (new Date(booking.start_at).getTime() > Date.now()) {
    return { ok: false, error: "La garde n'a pas encore commencé." };
  }

  const { error } = await supabase
    .from("bookings")
    .update({
      status: "completed",
      sitter_closed_at: new Date().toISOString(),
      sitter_comment: trimmedComment === "" ? null : trimmedComment,
    })
    .eq("id", bookingId)
    .eq("status", "confirmed");
  if (error) {
    return { ok: false, error: "Mise à jour impossible." };
  }

  revalidatePath("/sitter/demandes");
  revalidatePath("/sitter");
  return { ok: true };
}
