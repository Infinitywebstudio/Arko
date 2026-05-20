import type { NextRequest } from "next/server";
import type Stripe from "stripe";

import { createAdminClient } from "@/lib/supabase/server";
import {
  sendSitterBookingNotification,
  sendClientBookingConfirmedNotification,
} from "@/lib/email/booking";
import { getStripe } from "@/lib/stripe/client";

/**
 * Stripe webhook endpoint. Receives signed events about bookings paying through
 * Stripe Checkout. Two transitions matter for MVP:
 *
 *   checkout.session.completed → booking moves from pending_payment to
 *     confirmed (no sitter-acceptance step). The sitter is notified of the new
 *     garde and the client gets a confirmation email.
 *   checkout.session.expired   → if the booking is still pending_payment after
 *     the 30-minute Stripe-imposed expiry, drop the row. The slot was held but
 *     never paid for.
 *
 * Handler discipline:
 *   - Verify the signature before doing anything else. An unsigned (or wrongly
 *     signed) request is rejected with 400 - we never trust the body.
 *   - Use the service-role admin client. RLS would otherwise block these
 *     writes since there's no user session here.
 *   - Return 200 even on internal failures (logged) to stop Stripe from
 *     retrying. The exception is signature failure, which is genuinely a 4xx.
 *   - Idempotency: Stripe can deliver the same event multiple times. The
 *     state-machine update is idempotent (only flips pending_payment →
 *     confirmed once); the emails are best-effort and a duplicate is
 *     unlikely-to-be-disastrous.
 */

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature", { status: 400 });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe webhook] STRIPE_WEBHOOK_SECRET is not set");
    return new Response("Webhook not configured", { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = await getStripe().webhooks.constructEventAsync(rawBody, signature, secret);
  } catch (err) {
    console.error(
      "[stripe webhook] signature verification failed:",
      err instanceof Error ? err.message : err,
    );
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;
      case "checkout.session.expired":
        await handleCheckoutExpired(event.data.object);
        break;
      default:
        // Acknowledge unknown events so Stripe stops retrying them.
        break;
    }
  } catch (err) {
    console.error("[stripe webhook] handler threw on", event.type, err);
    // Still 200 - we don't want Stripe to retry on a programming error here.
    // Errors are tracked in the logs and surfaced via observability.
  }

  return Response.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const bookingId = session.metadata?.booking_id;
  if (!bookingId) {
    console.error("[stripe webhook] checkout.completed missing booking_id metadata", session.id);
    return;
  }
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);

  const admin = createAdminClient();

  // Only flip the row if it's still pending_payment - guard against duplicate
  // delivery and races with a manual cancel.
  const { data: updated, error } = await admin
    .from("bookings")
    .update({
      status: "confirmed",
      stripe_payment_intent_id: paymentIntentId,
    })
    .eq("id", bookingId)
    .eq("status", "pending_payment")
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[stripe webhook] booking update failed", bookingId, error);
    return;
  }
  if (!updated) {
    // Either the booking is already confirmed (duplicate event) or it was
    // cancelled in the meantime. Nothing to do.
    return;
  }

  // Notify both parties: the sitter has a new garde to honour, the client gets
  // their confirmation. Both are best-effort (logged, never thrown).
  await sendSitterBookingNotification(bookingId);
  await sendClientBookingConfirmedNotification(bookingId);
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session): Promise<void> {
  const bookingId = session.metadata?.booking_id;
  if (!bookingId) return;

  const admin = createAdminClient();
  // Only delete if still pending_payment - if the row already advanced (paid
  // through some other path) we leave it alone.
  const { error } = await admin
    .from("bookings")
    .delete()
    .eq("id", bookingId)
    .eq("status", "pending_payment");
  if (error) {
    console.error("[stripe webhook] expired cleanup failed", bookingId, error);
  }
}
