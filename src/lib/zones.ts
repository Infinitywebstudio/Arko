/**
 * Static list of service zones a sitter can declare. The client (Louis) curates
 * this list — it does not live in the DB to keep it type-safe and free of admin
 * tooling for the MVP. Adding/removing a zone is a code deploy.
 *
 * `id` is the persisted value (stored in sitter_profiles.service_zones text[]).
 * `label` is what we display. Treat `id` as immutable once a zone is in
 * production — renaming would orphan existing rows.
 *
 * MVP scope: Arles (city of the launch market).
 */
export type Zone = {
  id: string;
  label: string;
};

export const ZONES: readonly Zone[] = [
  { id: "place-republique", label: "Place de la République" },
  { id: "place-forum", label: "Place du Forum" },
  { id: "place-voltaire", label: "Place Voltaire" },
  { id: "place-roquette", label: "Place de la Roquette" },
  { id: "office-tourisme", label: "Office de Tourisme" },
  { id: "arenes-arles", label: "Arènes d'Arles" },
  { id: "theatre-antique", label: "Théâtre Antique" },
  { id: "musee-reattu", label: "Musée Réattu" },
  { id: "fondation-van-gogh", label: "Fondation Vincent Van Gogh" },
  { id: "museon-arlaten", label: "Museon Arlaten" },
  { id: "musee-arles-antique", label: "Musée départemental Arles Antique" },
  { id: "tour-luma", label: "Tour Luma" },
  { id: "alyscamps", label: "Les Alyscamps" },
] as const;

export const ZONE_IDS = ZONES.map((z) => z.id);

const ZONE_LABEL_BY_ID = new Map(ZONES.map((z) => [z.id, z.label]));

export function zoneLabel(id: string): string {
  return ZONE_LABEL_BY_ID.get(id) ?? id;
}

export function isValidZoneId(id: string): boolean {
  return ZONE_LABEL_BY_ID.has(id);
}
