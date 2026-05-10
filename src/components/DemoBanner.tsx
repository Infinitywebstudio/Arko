import { isDemoMode } from "@/lib/demo";

/**
 * A thin coral strip at the top of every page when DEMO_MODE is on. Server-
 * rendered — no client hydration cost — and returns null in real mode so the
 * production bundle has no demo-specific surface.
 */
export default function DemoBanner() {
  if (!isDemoMode()) return null;
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "var(--coral-500)",
        color: "white",
        textAlign: "center",
        padding: "6px 16px",
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      }}
    >
      Démo · paiements simulés · emails non envoyés
    </div>
  );
}
