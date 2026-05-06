"use client";

import { useRef, useState, useTransition } from "react";

import { uploadAvatarAction, deleteAvatarAction } from "@/lib/sitter/actions";
import { Arko, Icon } from "@/components/mascot";

type Props = {
  currentUrl: string | null;
  fallbackName: string;
};

export default function AvatarUploader({ currentUrl, fallbackName }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handlePick = () => inputRef.current?.click();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setSuccess(null);

    const fd = new FormData();
    fd.append("file", file);

    startTransition(async () => {
      const result = await uploadAvatarAction(fd);
      if (result.ok) {
        setSuccess("Photo mise à jour.");
      } else {
        setError(result.error);
      }
      if (inputRef.current) inputRef.current.value = "";
    });
  };

  const handleDelete = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await deleteAvatarAction();
      if (!result.ok) setError(result.error);
      else setSuccess("Photo supprimée.");
    });
  };

  return (
    <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: 48,
          overflow: "hidden",
          background: "var(--peach-100)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid var(--ink-200)",
          flexShrink: 0,
        }}
      >
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatar is a remote Supabase URL; not optimised for now
          <img src={currentUrl} alt={fallbackName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <Arko size={72} mood="happy" />
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFile}
          disabled={isPending}
          style={{ display: "none" }}
        />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handlePick}
            disabled={isPending}
            className="btn btn-outline btn-sm"
          >
            <Icon name="plus" size={14} /> {currentUrl ? "Changer la photo" : "Ajouter une photo"}
          </button>
          {currentUrl && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="btn btn-ghost btn-sm"
              style={{ color: "var(--danger-700)" }}
            >
              Supprimer
            </button>
          )}
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: error ? "var(--danger-700)" : success ? "var(--success-700)" : "var(--ink-500)",
            minHeight: 16,
          }}
        >
          {error ?? success ?? "JPEG, PNG ou WebP — 5 Mo max"}
        </div>
      </div>
    </div>
  );
}
