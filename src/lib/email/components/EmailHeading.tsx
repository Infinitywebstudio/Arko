import { Heading } from "react-email";
import { ReactNode } from "react";
import { colors } from "@/lib/email/theme";

interface EmailHeadingProps {
  children: ReactNode;
}

export function EmailHeading({ children }: EmailHeadingProps) {
  return (
    <Heading
      as="h1"
      style={{
        fontSize: 22,
        lineHeight: 1.3,
        fontWeight: 700,
        color: colors.text,
        margin: "0 0 12px",
      }}
    >
      {children}
    </Heading>
  );
}
