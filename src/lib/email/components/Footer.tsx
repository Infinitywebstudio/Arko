import { Hr, Text } from "react-email";
import { colors, fonts } from "@/lib/email/theme";

export function Footer() {
  return (
    <>
      <Hr style={{ borderColor: colors.border, margin: "32px 0 16px" }} />
      <Text
        style={{
          fontFamily: fonts.mono,
          fontSize: 11,
          color: colors.mutedSubtle,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          margin: 0,
        }}
      >
        ARKO - dog-sitting court terme
      </Text>
    </>
  );
}
