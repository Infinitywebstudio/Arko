import { Text } from "react-email";
import { colors, fonts } from "@/lib/email/theme";

interface KickerProps {
  children: string;
  tone?: "primary" | "muted";
}

/**
 * The small mono uppercase tag that sits above the main heading
 * ("Réservation confirmée", "Garde annulée", etc.). Tone switches between
 * green (positive) and grey (neutral / negative).
 */
export function Kicker({ children, tone = "primary" }: KickerProps) {
  return (
    <Text
      style={{
        fontFamily: fonts.mono,
        fontSize: 11,
        color: tone === "primary" ? colors.primaryAccent : colors.mutedStrong,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        fontWeight: 600,
        margin: "0 0 8px",
      }}
    >
      {children}
    </Text>
  );
}
