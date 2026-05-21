/**
 * Initials monogram used as the avatar fallback when a user/sitter has no
 * photo. Pure presentational - drop it inside an existing circular/rounded
 * container which supplies the shape and background. Replaced the former
 * Arko mascot illustration (brand direction: no mascot).
 */

export function getInitials(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function Initials({
  name,
  size,
  color = "var(--coral-700)",
}: {
  name: string | null | undefined;
  /** Diameter of the surrounding container; the glyph scales to ~40% of it. */
  size: number;
  color?: string;
}) {
  return (
    <span
      aria-hidden
      style={{
        fontFamily: "var(--font-mono)",
        fontWeight: 700,
        fontSize: Math.round(size * 0.4),
        letterSpacing: "0.02em",
        lineHeight: 1,
        color,
      }}
    >
      {getInitials(name)}
    </span>
  );
}
