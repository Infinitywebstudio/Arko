import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
} from "react-email";
import { ReactNode } from "react";
import { colors, fonts, spacing } from "@/lib/email/theme";
import { Footer } from "./Footer";

interface LayoutProps {
  preview: string;
  children: ReactNode;
}

/**
 * The shell every ARKO email lives inside. Sets the inbox preview text, the
 * outer body background, and the centered card. Footer is always appended.
 */
export function Layout({ preview, children }: LayoutProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: colors.pageBg,
          fontFamily: fonts.body,
          color: colors.text,
          margin: 0,
          padding: "32px 16px",
        }}
      >
        <Container
          style={{
            maxWidth: spacing.containerMaxWidth,
            margin: "0 auto",
            backgroundColor: colors.bodyBg,
            borderRadius: 16,
            padding: "32px 28px",
          }}
        >
          <Section>{children}</Section>
          <Footer />
        </Container>
      </Body>
    </Html>
  );
}
