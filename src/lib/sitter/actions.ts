"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole } from "@/lib/auth/helpers";
import { createClient } from "@/lib/supabase/server";
import {
  AVATAR_MAX_BYTES,
  availabilityListSchema,
  avatarFileSchema,
  sitterProfileSchema,
} from "./schemas";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function fieldErrorsFromZod(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

const AVATARS_BUCKET = "avatars";

// =============================================================
// Update sitter profile
// =============================================================
export async function updateSitterProfileAction(
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireRole("sitter");

  // Service zones can be sent as repeated fields or a comma-separated string.
  const rawZones = formData.getAll("service_zones");
  let zones: string[] = [];
  if (rawZones.length > 1) {
    zones = rawZones.map(String).map((z) => z.trim()).filter(Boolean);
  } else if (rawZones.length === 1) {
    const single = String(rawZones[0]);
    zones = single
      .split(",")
      .map((z) => z.trim())
      .filter(Boolean);
  }

  const raw = {
    bio: formData.get("bio"),
    experience_years: formData.get("experience_years"),
    accepts_dangerous_breeds:
      formData.get("accepts_dangerous_breeds") === "on" ||
      formData.get("accepts_dangerous_breeds") === "true",
    service_zones: zones,
    available_from: formData.get("available_from"),
    available_until: formData.get("available_until"),
  };

  const parsed = sitterProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Vérifie les informations saisies.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("sitter_profiles")
    .update({
      bio: parsed.data.bio ?? null,
      experience_years: parsed.data.experience_years ?? null,
      accepts_dangerous_breeds: parsed.data.accepts_dangerous_breeds,
      service_zones: parsed.data.service_zones,
      available_from: parsed.data.available_from ?? null,
      available_until: parsed.data.available_until ?? null,
    })
    .eq("id", session.userId);

  if (error) {
    return { ok: false, error: "Impossible d'enregistrer ton profil." };
  }

  revalidatePath("/sitter/profil");
  revalidatePath(`/sitters/${session.userId}`);
  return { ok: true };
}

// =============================================================
// Replace availability (delete-all + insert-all)
// =============================================================
//
// We replace rather than diff because the form is small (≤ 28 slots) and
// "replace" keeps the UX trivial — sitter sees the current week, edits,
// submits the whole picture. The cost (one DELETE + one INSERT) is dwarfed
// by network latency; the simpler code is the right trade.
export async function replaceAvailabilityAction(
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireRole("sitter");

  const slotsJson = formData.get("slots");
  let parsedSlots: unknown;
  try {
    parsedSlots = typeof slotsJson === "string" ? JSON.parse(slotsJson) : [];
  } catch {
    return { ok: false, error: "Format des créneaux invalide." };
  }

  const parsed = availabilityListSchema.safeParse(parsedSlots);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Vérifie tes créneaux.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const supabase = await createClient();

  // DELETE then INSERT. Both rely on RLS scoping the target rows to this user.
  const del = await supabase
    .from("sitter_availability")
    .delete()
    .eq("sitter_id", session.userId);
  if (del.error) {
    return { ok: false, error: "Impossible de mettre à jour le planning." };
  }

  if (parsed.data.length > 0) {
    const rows = parsed.data.map((slot) => ({
      sitter_id: session.userId,
      weekday: slot.weekday,
      start_time: slot.start_time,
      end_time: slot.end_time,
    }));
    const ins = await supabase.from("sitter_availability").insert(rows);
    if (ins.error) {
      return { ok: false, error: "Créneaux invalides ou en conflit." };
    }
  }

  revalidatePath("/sitter/disponibilites");
  revalidatePath(`/sitters/${session.userId}`);
  return { ok: true };
}

// =============================================================
// Upload avatar
// =============================================================
function extensionFromMime(mime: string): string {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/jpeg":
    default:
      return "jpg";
  }
}

function storagePathFromPublicUrl(url: string, bucket: string): string | null {
  // Supabase public URLs look like:
  //   https://<ref>.supabase.co/storage/v1/object/public/<bucket>/<path>
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const tail = url.slice(idx + marker.length);
  // Strip query string (e.g. cache-busting ?v=...)
  return tail.split("?")[0] ?? null;
}

export async function uploadAvatarAction(formData: FormData): Promise<ActionResult> {
  const session = await requireRole("sitter");

  const fileRaw = formData.get("file");
  const parsed = avatarFileSchema.safeParse(fileRaw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Image invalide.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }
  const file = parsed.data;

  // Belt and braces — Zod already enforces this, but never trust the client.
  if (file.size > AVATAR_MAX_BYTES) {
    return { ok: false, error: "Fichier trop lourd." };
  }

  const supabase = await createClient();
  const ext = extensionFromMime(file.type);
  const newPath = `${session.userId}/avatar-${Date.now()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(newPath, file, {
      contentType: file.type,
      upsert: false,
    });
  if (upErr) {
    return { ok: false, error: "Échec de l'upload." };
  }

  const { data: pub } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(newPath);
  const publicUrl = pub.publicUrl;

  const { error: updErr } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", session.userId);

  if (updErr) {
    // Best-effort cleanup of the just-uploaded file so we don't leave orphans.
    await supabase.storage.from(AVATARS_BUCKET).remove([newPath]);
    return { ok: false, error: "Impossible d'enregistrer l'avatar." };
  }

  // Best-effort cleanup of the previous avatar (don't block on errors).
  const previous = session.profile.avatar_url;
  if (previous) {
    const oldPath = storagePathFromPublicUrl(previous, AVATARS_BUCKET);
    if (oldPath && oldPath !== newPath) {
      await supabase.storage.from(AVATARS_BUCKET).remove([oldPath]);
    }
  }

  revalidatePath("/sitter/profil");
  revalidatePath("/compte");
  revalidatePath(`/sitters/${session.userId}`);
  return { ok: true };
}

// =============================================================
// Delete avatar
// =============================================================
export async function deleteAvatarAction(): Promise<ActionResult> {
  const session = await requireRole("sitter");
  const previous = session.profile.avatar_url;

  const supabase = await createClient();

  const { error: updErr } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", session.userId);
  if (updErr) {
    return { ok: false, error: "Impossible de supprimer l'avatar." };
  }

  if (previous) {
    const oldPath = storagePathFromPublicUrl(previous, AVATARS_BUCKET);
    if (oldPath) {
      await supabase.storage.from(AVATARS_BUCKET).remove([oldPath]);
    }
  }

  revalidatePath("/sitter/profil");
  revalidatePath("/compte");
  revalidatePath(`/sitters/${session.userId}`);
  return { ok: true };
}
