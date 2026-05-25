import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/helpers";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/client";
import { getSitterPublic } from "@/lib/sitter/helpers";
import CheckoutClient from "@/components/checkout/CheckoutClient";

export const metadata: Metadata = {
  title: "Validation de la réservation · ARKO",
};

/**
 * Embedded checkout. Owns the payment step of the booking flow:
 *   - Requires the booking's client to be signed in (RLS already enforces this
 *     on the data; we add an explicit auth gate so unauth users see /connexion
 *     instead of a notFound).
 *   - Routes elsewhere if the booking is in a state that can't be paid for any
 *     more (already confirmed -> merci, cancelled/missing PI -> sitter profile).
 *   - Retrieves the PaymentIntent from Stripe to pass a fresh client_secret to
 *     the Elements provider. We never store client_secret in the DB; the PI id
 *     is the canonical pointer.
 */
export default async function PaiementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireUser(`/reservations/${id}/paiement`);

  const supabase = await createClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "id, status, start_at, duration_hours, price_cents, dangerous_breed, urgent, late, meeting_zone_id, stripe_payment_intent_id, sitter_id",
    )
    .eq("id", id)
    .eq("client_id", session.userId)
    .maybeSingle();

  if (!booking) notFound();

  // Already paid or in flight - the merci page handles webhook-lag gracefully.
  if (booking.status !== "pending_payment") {
    redirect(`/reservations/${id}/merci`);
  }

  // No PaymentIntent attached means the action didn't finish (or demo mode is
  // on - which short-circuits to merci anyway). Either way, this page can't
  // do its job; send the user back to the sitter to restart.
  if (!booking.stripe_payment_intent_id) {
    redirect(`/sitters/${booking.sitter_id}`);
  }

  const stripe = getStripe();
  const intent = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id);

  // If the intent has already succeeded (webhook lag, or user came back via
  // browser history), bounce to merci - the form would just fail to confirm
  // an already-succeeded intent.
  if (intent.status === "succeeded") {
    redirect(`/reservations/${id}/merci`);
  }
  if (intent.status === "canceled") {
    redirect(`/sitters/${booking.sitter_id}`);
  }
  if (!intent.client_secret) {
    // Shouldn't happen for a freshly-created PI but guard anyway.
    redirect(`/sitters/${booking.sitter_id}`);
  }

  const sitter = await getSitterPublic(booking.sitter_id);
  if (!sitter) notFound();

  return (
    <CheckoutClient
      clientSecret={intent.client_secret}
      booking={{
        id: booking.id,
        start_at: booking.start_at,
        duration_hours: booking.duration_hours as 1 | 2 | 3,
        price_cents: booking.price_cents,
        dangerous_breed: booking.dangerous_breed,
        urgent: booking.urgent,
        late: booking.late,
        meeting_zone_id: booking.meeting_zone_id,
        sitter_id: booking.sitter_id,
      }}
      sitter={{
        id: sitter.id ?? booking.sitter_id,
        full_name: sitter.full_name ?? "Sitter",
        avatar_url: sitter.avatar_url,
      }}
    />
  );
}
