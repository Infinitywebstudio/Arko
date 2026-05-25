"use client";

import Image from "next/image";

import { calculatePrice, formatEuros, type Duration } from "@/lib/booking/pricing";
import { zoneLabel } from "@/lib/zones";
import { Initials } from "@/components/Initials";

const PARIS_TZ = "Europe/Paris";

type Booking = {
  start_at: string;
  duration_hours: Duration;
  price_cents: number;
  dangerous_breed: boolean;
  urgent: boolean;
  late: boolean;
  meeting_zone_id: string | null;
};

type Sitter = {
  full_name: string;
  avatar_url: string | null;
};

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: PARIS_TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

/**
 * Right-column recap shown alongside the payment form. Shared markup between
 * the sticky desktop sidebar and the mobile <details> collapse - the recap
 * itself is identical, only its container differs.
 */
export default function CheckoutRecap({ booking, sitter }: { booking: Booking; sitter: Sitter }) {
  const breakdown = calculatePrice({
    duration: booking.duration_hours,
    dangerous_breed: booking.dangerous_breed,
    urgent: booking.urgent,
    late: booking.late,
  });

  return (
    <div className="checkout-recap-card">
      <div className="checkout-recap-sitter">
        <div className="checkout-recap-avatar">
          {sitter.avatar_url ? (
            <Image
              src={sitter.avatar_url}
              alt={sitter.full_name}
              width={52}
              height={52}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <Initials name={sitter.full_name} size={52} />
          )}
        </div>
        <div>
          <div className="checkout-recap-sitter-name">{sitter.full_name}</div>
          <div className="checkout-recap-sitter-meta">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6L12 2z" />
            </svg>
            <span>Sitter vérifiée</span>
          </div>
        </div>
      </div>

      <div className="checkout-recap-sep" />

      <div className="checkout-recap-info">
        <div className="checkout-recap-info-line">
          <span className="checkout-recap-info-label">Créneau</span>
          <span className="checkout-recap-info-value">{formatDateTime(booking.start_at)}</span>
        </div>
        <div className="checkout-recap-info-line">
          <span className="checkout-recap-info-label">Durée</span>
          <span className="checkout-recap-info-value">{booking.duration_hours} heures</span>
        </div>
        <div className="checkout-recap-info-line">
          <span className="checkout-recap-info-label">Lieu de rdv</span>
          <span className="checkout-recap-info-value">
            {booking.meeting_zone_id ? zoneLabel(booking.meeting_zone_id) : "À convenir"}
          </span>
        </div>
      </div>

      <div className="checkout-recap-sep" />

      <div className="checkout-recap-price">
        <h3 className="checkout-recap-h">Détail du prix</h3>
        <div className="checkout-recap-price-line">
          <span>Garde {booking.duration_hours}h</span>
          <span>{formatEuros(breakdown.base_cents)}</span>
        </div>
        {booking.dangerous_breed && (
          <div className="checkout-recap-price-line">
            <span>Chien cat. 1/2</span>
            <span>+{formatEuros(500)}</span>
          </div>
        )}
        {booking.urgent && (
          <div className="checkout-recap-price-line">
            <span>Réservation urgente</span>
            <span>+{formatEuros(700)}</span>
          </div>
        )}
        {booking.late && (
          <div className="checkout-recap-price-line">
            <span>Garde tardive</span>
            <span>+{formatEuros(800)}</span>
          </div>
        )}
      </div>

      <div className="checkout-recap-sep" />

      <div className="checkout-recap-total">
        <span>Total</span>
        <strong>{formatEuros(booking.price_cents)}</strong>
      </div>

      <div className="checkout-recap-reassure">
        <div className="checkout-reassure-line">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>
            <strong>Annulation gratuite</strong> jusqu&apos;au début de la garde.
          </span>
        </div>
        <div className="checkout-reassure-line">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>Paiement sécurisé Stripe.</span>
        </div>
      </div>
    </div>
  );
}
