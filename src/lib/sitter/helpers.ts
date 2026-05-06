import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type SitterProfileRow = Database["public"]["Tables"]["sitter_profiles"]["Row"];
type AvailabilityRow = Database["public"]["Tables"]["sitter_availability"]["Row"];
type BadgeRow = Database["public"]["Tables"]["sitter_badges"]["Row"];
type SitterPublicRow = Database["public"]["Views"]["sitters_public"]["Row"];

/**
 * Fetch the sitter_profiles row for a given user. Returns null if missing
 * (which can happen briefly between profile creation and the trigger backfill,
 * or for non-sitter accounts).
 */
export async function getSitterProfile(userId: string): Promise<SitterProfileRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sitter_profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function getSitterAvailability(userId: string): Promise<AvailabilityRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sitter_availability")
    .select("*")
    .eq("sitter_id", userId)
    .order("weekday", { ascending: true })
    .order("start_time", { ascending: true });
  if (error || !data) return [];
  return data;
}

export async function getSitterBadges(userId: string): Promise<BadgeRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sitter_badges")
    .select("*")
    .eq("sitter_id", userId);
  if (error || !data) return [];
  return data;
}

/**
 * Fetch a sitter's public-facing profile (homepage card / public profile page).
 * Goes through the sitters_public view — never exposes phone/email.
 */
export async function getSitterPublic(id: string): Promise<SitterPublicRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sitters_public")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) return null;
  return data;
}

/**
 * List the most recent sitters for the homepage. Limit kept low for the MVP
 * front page; pagination on the dedicated /sitters listing comes later.
 */
export async function listSittersForHome(limit = 8): Promise<SitterPublicRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sitters_public")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data;
}
