"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Elements } from "@stripe/react-stripe-js";
import type { Appearance, StripeElementsOptions } from "@stripe/stripe-js";

import { getStripePromise } from "@/lib/stripe/browser";
import type { Duration } from "@/lib/booking/pricing";
import CheckoutForm from "./CheckoutForm";
import CheckoutRecap from "./CheckoutRecap";

type Booking = {
  id: string;
  start_at: string;
  duration_hours: Duration;
  price_cents: number;
  dangerous_breed: boolean;
  urgent: boolean;
  late: boolean;
  meeting_zone_id: string | null;
  sitter_id: string;
};

type Sitter = {
  id: string;
  full_name: string;
  avatar_url: string | null;
};

/**
 * Stripe Elements appearance theme matching the ARKO design system. The
 * variables map the Stripe tokens onto our --coral-* / --ink-* palette so
 * the embedded form blends with the rest of the page. Rules cover the bits
 * the variables alone can't reach (Tab, Label, Input focus state).
 *
 * Note: the appearance object MUST be stable across renders or Stripe
 * complains about reconfiguration - we wrap construction in useMemo below.
 */
function arkoAppearance(): Appearance {
  return {
    theme: "flat",
    variables: {
      colorPrimary: "#3C582E",
      colorBackground: "#FFFFFF",
      colorText: "#0F1310",
      colorTextSecondary: "#5F6259",
      colorTextPlaceholder: "#B8B5A8",
      colorDanger: "#EF4444",
      colorSuccess: "#10B981",
      colorIcon: "#5F6259",
      colorIconTabSelected: "#3C582E",
      fontFamily:
        '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
      fontSizeBase: "14px",
      fontSizeSm: "12px",
      fontSizeXs: "11px",
      borderRadius: "12px",
      spacingUnit: "4px",
      spacingGridRow: "16px",
      spacingGridColumn: "12px",
    },
    rules: {
      ".Tab": {
        border: "1px solid #D8D5C8",
        backgroundColor: "#FFFFFF",
        padding: "12px 8px",
        minHeight: "72px",
      },
      ".Tab:hover": {
        borderColor: "#8A8B7E",
      },
      ".Tab--selected": {
        border: "1.5px solid #3C582E",
        backgroundColor: "#F1F6EE",
        color: "#223419",
      },
      ".Tab--selected:focus": {
        boxShadow: "0 0 0 3px #F1F6EE",
      },
      ".TabLabel": {
        fontSize: "12px",
        fontWeight: "600",
        letterSpacing: "0.02em",
      },
      ".Label": {
        fontSize: "11px",
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: "#2E322E",
        marginBottom: "6px",
      },
      ".Input": {
        border: "1px solid #B8B5A8",
        padding: "12px 14px",
        fontSize: "14px",
        backgroundColor: "#FFFFFF",
      },
      ".Input:focus": {
        border: "1px solid #3C582E",
        boxShadow: "0 0 0 3px #F1F6EE",
      },
      ".Input--invalid": {
        border: "1px solid #EF4444",
      },
      ".Error": {
        fontSize: "11px",
        color: "#B91C1C",
        marginTop: "4px",
      },
    },
  };
}

/**
 * Top-level client wrapper for the /paiement page. Mounts the Stripe Elements
 * provider once with the booking's client_secret + the ARKO appearance theme,
 * lays out the topbar + 2-column grid (form left, sticky recap right), and
 * dispatches the mobile-only collapsible recap above the form.
 */
export default function CheckoutClient({
  clientSecret,
  booking,
  sitter,
}: {
  clientSecret: string;
  booking: Booking;
  sitter: Sitter;
}) {
  const stripePromise = useMemo(() => getStripePromise(), []);

  const options: StripeElementsOptions = useMemo(
    () => ({
      clientSecret,
      appearance: arkoAppearance(),
      locale: "fr",
    }),
    [clientSecret],
  );

  return (
    <>
      <header className="checkout-topbar">
        <Link
          href={`/sitters/${sitter.id}`}
          className="checkout-back"
          aria-label="Retour au profil du sitter"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </Link>
      </header>

      <main className="checkout-page">
        <h1 className="checkout-title">Validation de la réservation</h1>

        <details className="checkout-recap-mobile">
          <summary>
            <span className="checkout-recap-mobile-left">
              <span className="checkout-recap-mobile-total-label">Récapitulatif</span>
              <strong className="checkout-recap-mobile-total">
                {formatPriceShort(booking.price_cents)}
              </strong>
            </span>
            <span className="checkout-recap-mobile-toggle">
              Détails
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
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </summary>
          <div className="checkout-recap-mobile-body">
            <CheckoutRecap booking={booking} sitter={sitter} />
          </div>
        </details>

        <Elements stripe={stripePromise} options={options}>
          <div className="checkout-grid">
            <section className="checkout-payment-card">
              <CheckoutForm bookingId={booking.id} amount={booking.price_cents} />
            </section>

            <aside className="checkout-recap-desktop">
              <CheckoutRecap booking={booking} sitter={sitter} />
            </aside>
          </div>
        </Elements>
      </main>
    </>
  );
}

function formatPriceShort(cents: number): string {
  const euros = cents / 100;
  return `${euros.toFixed(2).replace(".", ",")} €`;
}
