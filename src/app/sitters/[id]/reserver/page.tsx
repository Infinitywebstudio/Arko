import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/helpers";
import { createClient } from "@/lib/supabase/server";
import { getSitterAvailability, getSitterPublic } from "@/lib/sitter/helpers";
import ReservationForm from "@/components/booking/ReservationForm";

export const metadata: Metadata = {
  title: "Réserver · ARKO",
};

export default async function ReservationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Auth gate: only clients can reserve. Sitters see a redirect away.
  const session = await requireUser(`/sitters/${id}/reserver`);
  if (session.profile.role === "sitter") {
    redirect(`/sitters/${id}`);
  }

  const sitter = await getSitterPublic(id);
  if (!sitter || !sitter.id) notFound();

  const slots = await getSitterAvailability(sitter.id);

  // The sitter's service_zones is an array of zone IDs (slugs from src/lib/zones.ts).
  // We pass the raw IDs and resolve labels client-side.
  const supabase = await createClient();
  const { data: sitterProfile } = await supabase
    .from("sitter_profiles")
    .select("accepts_dangerous_breeds, service_zones")
    .eq("id", sitter.id)
    .maybeSingle();

  return (
    <article
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "var(--space-12) var(--space-6)",
      }}
    >
      <ReservationForm
        sitter={{
          id: sitter.id,
          full_name: sitter.full_name ?? "Sitter",
          avatar_url: sitter.avatar_url,
          accepts_dangerous_breeds: sitterProfile?.accepts_dangerous_breeds ?? false,
          service_zones: sitterProfile?.service_zones ?? [],
        }}
        slots={slots.map((s) => ({
          weekday: s.weekday,
          start_time: s.start_time,
          end_time: s.end_time,
        }))}
        clientName={session.profile.full_name}
      />
    </article>
  );
}
