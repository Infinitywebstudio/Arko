import { Text } from "react-email";
import { Layout } from "@/lib/email/components/Layout";
import { Kicker } from "@/lib/email/components/Kicker";
import { EmailHeading } from "@/lib/email/components/EmailHeading";
import { PrimaryButton } from "@/lib/email/components/PrimaryButton";
import { colors } from "@/lib/email/theme";

export interface SitterBookingCancelledByClientProps {
  clientFullName: string;
  dateLabel: string;
  durationHours: number;
  dashboardUrl: string;
}

export function SitterBookingCancelledByClient({
  clientFullName,
  dateLabel,
  durationHours,
  dashboardUrl,
}: SitterBookingCancelledByClientProps) {
  return (
    <Layout
      preview={`${clientFullName} a annulé la garde du ${dateLabel}`}
    >
      <Kicker tone="muted">Garde annulée</Kicker>
      <EmailHeading>
        {clientFullName} a annulé la garde du {dateLabel}.
      </EmailHeading>

      <Text style={{ fontSize: 15, lineHeight: 1.6, margin: "0 0 12px" }}>
        Le créneau de <strong>{durationHours}h</strong> redevient disponible.
        Le paiement a été remboursé au client, vous n&apos;avez pas de paiement à
        recevoir pour cette garde.
      </Text>

      <Text style={{ fontSize: 15, lineHeight: 1.6, margin: "0 0 20px" }}>
        Pensez à mettre à jour vos disponibilités si besoin.
      </Text>

      <PrimaryButton href={dashboardUrl}>Voir mon planning</PrimaryButton>

      <Text
        style={{
          fontSize: 12,
          color: colors.mutedStrong,
          margin: "20px 0 0",
          lineHeight: 1.5,
        }}
      >
        L&apos;équipe ARKO
      </Text>
    </Layout>
  );
}

SitterBookingCancelledByClient.PreviewProps = {
  clientFullName: "Camille Dupont",
  dateLabel: "samedi 7 juin, 14:00",
  durationHours: 2,
  dashboardUrl: "https://arko.life/sitter",
} satisfies SitterBookingCancelledByClientProps;

export default SitterBookingCancelledByClient;
