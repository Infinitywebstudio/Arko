import { Section, Text } from "react-email";
import { colors, radii } from "@/lib/email/theme";

interface NoteBubbleProps {
  children: string;
}

/**
 * Warm cream rounded box used to highlight a free-text note from the client
 * (e.g. dog quirks, drop-off details). Styled as a quote so it visually
 * stands apart from the structured booking summary.
 */
export function NoteBubble({ children }: NoteBubbleProps) {
  return (
    <Section
      style={{
        backgroundColor: colors.noteBg,
        borderRadius: radii.box,
        padding: "14px 16px",
        margin: "12px 0 20px",
      }}
    >
      <Text
        style={{
          margin: 0,
          fontStyle: "italic",
          fontSize: 14,
          lineHeight: 1.5,
          color: colors.text,
        }}
      >
        “{children}”
      </Text>
    </Section>
  );
}
