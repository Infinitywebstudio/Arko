"use client";

import { useState, useTransition } from "react";

import { submitClientCommentAction } from "@/lib/booking/actions";

type Props = {
  bookingId: string;
  /** Existing comment if the client already submitted one. Empty form otherwise. */
  initial: string | null;
};

/**
 * Inline form on a completed-booking card. Lets the client leave (or edit) a
 * free-text comment about the garde. Submitted, the value is shown in
 * "stored" mode with an Edit button; clicking Edit reopens the textarea
 * pre-filled. Mirrors the sitter close-out comment UX with one difference:
 * the client can edit indefinitely (the sitter's comment is one-shot at
 * close, ours has no status-flip side effect).
 *
 * Empty submissions clear the comment (server normalises empty trimmed
 * strings to NULL). We do not block "submit while empty" — clients may want
 * to remove a comment they previously left.
 */
export default function ClientCommentForm({ bookingId, initial }: Props) {
  const [stored, setStored] = useState<string | null>(initial);
  const [editing, setEditing] = useState<boolean>(initial === null);
  const [draft, setDraft] = useState<string>(initial ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      const result = await submitClientCommentAction(bookingId, draft);
      if (result.ok) {
        const normalised = draft.trim() === "" ? null : draft.trim();
        setStored(normalised);
        setDraft(normalised ?? "");
        setEditing(normalised === null);
      } else {
        setError(result.error);
      }
    });
  };

  const handleCancel = () => {
    setDraft(stored ?? "");
    setEditing(stored === null);
    setError(null);
  };

  // Compact stored-state view: shows the existing comment + an Edit button.
  if (!editing && stored !== null) {
    return (
      <div
        style={{
          paddingTop: 10,
          borderTop: "1px dashed var(--ink-200)",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--ink-500)",
          }}
        >
          Ton commentaire
        </div>
        <div
          style={{
            padding: "10px 12px",
            background: "var(--ink-50)",
            borderRadius: 10,
            fontFamily: "var(--font-display)",
            fontSize: 14,
            fontStyle: "italic",
            color: "var(--ink-800)",
            lineHeight: 1.5,
          }}
        >
          &ldquo;{stored}&rdquo;
        </div>
        <div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setEditing(true)}
          >
            Modifier
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        paddingTop: 10,
        borderTop: "1px dashed var(--ink-200)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <label
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--ink-700)",
        }}
      >
        Comment s&apos;est passée la garde ? <span style={{ color: "var(--ink-500)" }}>(facultatif)</span>
      </label>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        maxLength={1000}
        rows={3}
        placeholder="Un retour libre pour le sitter et l'équipe ARKO."
        style={{
          width: "100%",
          padding: 10,
          background: "white",
          border: "1px solid var(--ink-300)",
          borderRadius: 10,
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          color: "var(--ink-900)",
          outline: "none",
          resize: "vertical",
          minHeight: 60,
        }}
        disabled={pending}
      />
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "var(--ink-500)",
          textAlign: "right",
        }}
      >
        {draft.length} / 1000
      </div>
      {error && (
        <div
          style={{
            background: "var(--danger-50)",
            color: "var(--danger-700)",
            border: "1px solid var(--danger-500)",
            padding: "8px 12px",
            borderRadius: 10,
            fontFamily: "var(--font-mono)",
            fontSize: 11,
          }}
          role="alert"
        >
          {error}
        </div>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        {stored !== null && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={handleCancel}
            disabled={pending}
            style={{ flex: 1 }}
          >
            Annuler
          </button>
        )}
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleSubmit}
          disabled={pending || draft === (stored ?? "")}
          style={{ flex: stored !== null ? 2 : 1 }}
        >
          {pending ? "Envoi…" : stored !== null ? "Enregistrer" : "Envoyer mon retour"}
        </button>
      </div>
    </div>
  );
}
