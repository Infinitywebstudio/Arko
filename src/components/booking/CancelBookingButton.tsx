"use client";

import { useState, useTransition } from "react";

import { cancelBookingAction } from "@/lib/booking/actions";

type Props = {
  bookingId: string;
};

export default function CancelBookingButton({ bookingId }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCancel = () => {
    setError(null);
    startTransition(async () => {
      const result = await cancelBookingAction(bookingId);
      if (!result.ok) {
        setError(result.error);
      }
      // On success the page revalidates server-side and the row updates with
      // the cancelled state — no client-side state to clear.
    });
  };

  if (!confirmOpen) {
    return (
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="btn btn-ghost btn-sm"
        style={{ color: "var(--ink-600)" }}
      >
        Annuler
      </button>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "var(--ink-700)",
        }}
      >
        Sûr ? Refund 100%.
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button
          type="button"
          onClick={() => {
            setConfirmOpen(false);
            setError(null);
          }}
          disabled={isPending}
          className="btn btn-ghost btn-sm"
        >
          Garder
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isPending}
          className="btn btn-sm"
          style={{
            background: "var(--danger-500)",
            color: "white",
            borderColor: "var(--danger-500)",
          }}
        >
          {isPending ? "Annulation…" : "Confirmer"}
        </button>
      </div>
      {error && (
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--danger-700)",
            maxWidth: 200,
            textAlign: "right",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
