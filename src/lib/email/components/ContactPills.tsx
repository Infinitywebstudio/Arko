import { Section } from "react-email";
import { colors, radii } from "@/lib/email/theme";

interface ContactPillsProps {
  telHref: string | null;
  telLabel?: string;
  whatsappHref: string | null;
}

/**
 * Pair of pill links (Appeler + WhatsApp). Each one renders only if its href
 * is non-null, so the same component works whether or not we have a phone
 * number. Buttons sit inline-block so they wrap naturally on narrow inboxes.
 */
export function ContactPills({
  telHref,
  telLabel = "Appeler",
  whatsappHref,
}: ContactPillsProps) {
  if (!telHref && !whatsappHref) return null;
  return (
    <Section style={{ margin: "12px 0 20px" }}>
      {telHref ? (
        <a
          href={telHref}
          style={{
            display: "inline-block",
            padding: "10px 16px",
            border: `1px solid ${colors.border}`,
            borderRadius: radii.pill,
            textDecoration: "none",
            color: colors.text,
            fontSize: 13,
            fontWeight: 600,
            marginRight: 8,
          }}
        >
          {telLabel}
        </a>
      ) : null}
      {whatsappHref ? (
        <a
          href={whatsappHref}
          style={{
            display: "inline-block",
            padding: "10px 16px",
            backgroundColor: colors.whatsapp,
            color: "#ffffff",
            borderRadius: radii.pill,
            textDecoration: "none",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          WhatsApp
        </a>
      ) : null}
    </Section>
  );
}
