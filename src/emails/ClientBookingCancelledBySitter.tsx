import { Text } from "react-email";
import { Layout } from "@/lib/email/components/Layout";
import { Kicker } from "@/lib/email/components/Kicker";
import { EmailHeading } from "@/lib/email/components/EmailHeading";
import { PrimaryButton } from "@/lib/email/components/PrimaryButton";
import { colors } from "@/lib/email/theme";

export interface ClientBookingCancelledBySitterProps {
  sitterName: string;
  dateLabel: string;
  refundAmountLabel: string;
  sittersUrl: string;
}

export function ClientBookingCancelledBySitter({
  sitterName,
  dateLabel,
  refundAmountLabel,
  sittersUrl,
}: ClientBookingCancelledBySitterProps) {
  return (
    <Layout preview={`${sitterName} a annulé la garde du ${dateLabel} - remboursée`}>
      <Kicker tone="muted">Garde annulée</Kicker>
      <EmailHeading>
        {sitterName} a dû annuler la garde du {dateLabel}.
      </EmailHeading>

      <Text style={{ fontSize: 15, lineHeight: 1.6, margin: "0 0 12px" }}>
        Le paiement de <strong>{refundAmountLabel}</strong> a été automatiquement
        remboursé sur votre carte. Le retour des fonds peut prendre 5 à 10 jours
        selon votre banque.
      </Text>

      <Text style={{ fontSize: 15, lineHeight: 1.6, margin: "0 0 20px" }}>
        Trouvez un autre sitter disponible :
      </Text>

      <PrimaryButton href={sittersUrl}>Voir d’autres sitters</PrimaryButton>

      <Text
        style={{
          fontSize: 12,
          color: colors.mutedStrong,
          margin: "20px 0 0",
          lineHeight: 1.5,
        }}
      >
        À très vite,
        <br />
        L’équipe ARKO
      </Text>
    </Layout>
  );
}

ClientBookingCancelledBySitter.PreviewProps = {
  sitterName: "Hugo Martin",
  dateLabel: "samedi 7 juin, 14:00",
  refundAmountLabel: "35,00 €",
  sittersUrl: "https://arko.life/sitters",
} satisfies ClientBookingCancelledBySitterProps;

export default ClientBookingCancelledBySitter;
