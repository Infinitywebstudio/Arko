import { Button } from "react-email";
import { colors, radii } from "@/lib/email/theme";

interface PrimaryButtonProps {
  href: string;
  children: string;
}

export function PrimaryButton({ href, children }: PrimaryButtonProps) {
  return (
    <Button
      href={href}
      style={{
        display: "inline-block",
        backgroundColor: colors.primary,
        color: "#ffffff",
        padding: "12px 22px",
        borderRadius: radii.pill,
        textDecoration: "none",
        fontWeight: 600,
        fontSize: 14,
      }}
    >
      {children}
    </Button>
  );
}
