"use client";

import { useState } from "react";
import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

import { formatEuros } from "@/lib/booking/pricing";

/**
 * Inner Stripe form. Lives inside <Elements> so it can use the Stripe hooks.
 * Owns the submit state, the confirmation call, and the surfacing of card-
 * decline messages. On success Stripe redirects the browser to `return_url`
 * (set to /reservations/[id]/merci) - the webhook will have already (or will
 * shortly) flip the booking to `confirmed`.
 *
 * UX choices:
 *   - PaymentElement is rendered in `tabs` layout: Stripe automatically shows
 *     a tab strip with all methods enabled on the account (Card, Apple Pay,
 *     Google Pay, Link...). The ARKO appearance theme on the parent <Elements>
 *     restyles those tabs to look like our 3-tile picker from the mockup.
 *   - The submit CTA is disabled while Stripe.js loads (`!stripe`) and while
 *     we await `confirmPayment` (`pending`). The label flips to "Validation…"
 *     so the user gets explicit feedback during the (often-multi-second) 3DS
 *     handshake before Stripe takes over the redirect.
 *   - Errors that Stripe returns synchronously (card declined, expired, etc.)
 *     are shown inline. Errors during 3DS handling are surfaced by the
 *     `return_url` query string - merci page already renders a soft state
 *     when the webhook hasn't fired yet.
 */
export default function CheckoutForm({
  bookingId,
  amount,
}: {
  bookingId: string;
  amount: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setPending(true);
    setError(null);

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/reservations/${bookingId}/merci`,
      },
    });

    // We only reach this code path if confirmation failed BEFORE the redirect
    // (e.g. card declined, validation failed). Successful confirmations leave
    // the page via `return_url`, so there's no "success" branch here.
    if (stripeError) {
      setError(
        stripeError.message ??
          "Le paiement n'a pas pu aboutir. Vérifiez vos informations ou essayez une autre carte.",
      );
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="checkout-form">
      <div className="checkout-card-head">
        <h2 className="checkout-card-title">Mode de paiement</h2>
        <div className="checkout-secure-pill">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>Paiement sécurisé</span>
        </div>
      </div>

      <PaymentElement options={{ layout: "tabs" }} />

      {error && (
        <div className="checkout-error" role="alert">
          {error}
        </div>
      )}

      <button
        type="submit"
        className="checkout-cta"
        disabled={!stripe || !elements || pending}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span>{pending ? "Validation…" : `Payer ${formatEuros(amount)}`}</span>
      </button>

      <div className="checkout-trust">
        <div className="checkout-trust-row">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>
            Paiement chiffré · traitement par <strong>Stripe</strong>
          </span>
        </div>
        <div className="checkout-trust-row">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Annulation gratuite jusqu&apos;au début de la garde</span>
        </div>
      </div>
    </form>
  );
}
