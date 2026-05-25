import { Text } from "react-email";
import { Layout } from "@/lib/email/components/Layout";
import { Kicker } from "@/lib/email/components/Kicker";
import { EmailHeading } from "@/lib/email/components/EmailHeading";
import { PrimaryButton } from "@/lib/email/components/PrimaryButton";
import { colors } from "@/lib/email/theme";

export interface ClientBookingCancellationConfirmedProps {
  sitterName: string;
  dateLabel: string;
  refundAmountLabel: string;
  sittersUrl: string;
}

export function ClientBookingCancellationConfirmed({
  sitterName,
  dateLabel,
  refundAmountLabel,
  sittersUrl,
}: ClientBookingCancellationConfirmedProps) {
  return (
    <Layout
      preview={`Annulation confirmée - garde du ${dateLabel} remboursée`}
    >
      <Kicker tone="muted">Annulation confirmée</Kicker>
      <EmailHeading>Ton annulation est prise en compte.</EmailHeading>

      <Text style={{ fontSize: 15, lineHeight: 1.6, margin: "0 0 12px" }}>
        Ta garde avec <strong>{sitterName}</strong> prévue le {dateLabel} a
        bien été annulée.
      </Text>

      <Text style={{ fontSize: 15, lineHeight: 1.6, margin: "0 0 12px" }}>
        Le paiement de <strong>{refundAmountLabel}</strong> a été
        automatiquement remboursé sur ta carte. Le retour des fonds peut
        prendre 5 à 10 jours selon ta banque.
      </Text>

      <Text style={{ fontSize: 15, lineHeight: 1.6, margin: "0 0 20px" }}>
        Besoin d&apos;un autre créneau ? Découvre les sitters disponibles :
      </Text>

      <PrimaryButton href={sittersUrl}>Voir d&apos;autres sitters</PrimaryButton>

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
        L&apos;équipe ARKO
      </Text>
    </Layout>
  );
}

ClientBookingCancellationConfirmed.PreviewProps = {
  sitterName: "Hugo Martin",
  dateLabel: "samedi 7 juin, 14:00",
  refundAmountLabel: "35,00 €",
  sittersUrl: "https://arko.life/sitters",
} satisfies ClientBookingCancellationConfirmedProps;

export default ClientBookingCancellationConfirmed;
