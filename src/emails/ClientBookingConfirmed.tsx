import { Text } from "react-email";
import { Layout } from "@/lib/email/components/Layout";
import { Kicker } from "@/lib/email/components/Kicker";
import { EmailHeading } from "@/lib/email/components/EmailHeading";
import { InfoTable, InfoRow } from "@/lib/email/components/InfoTable";
import { ContactPills } from "@/lib/email/components/ContactPills";
import { colors } from "@/lib/email/theme";

export interface ClientBookingConfirmedProps {
  sitterName: string;
  sitterPhone: string | null;
  dateLabel: string;
  durationHours: number;
  meetingLabel: string;
  telHref: string | null;
  whatsappHref: string | null;
}

export function ClientBookingConfirmed({
  sitterName,
  sitterPhone,
  dateLabel,
  durationHours,
  meetingLabel,
  telHref,
  whatsappHref,
}: ClientBookingConfirmedProps) {
  const sitterFirstName = sitterName.split(" ")[0];
  const rows: InfoRow[] = [
    { label: "Quand", value: dateLabel },
    { label: "Durée", value: `${durationHours}h` },
    { label: "Lieu", value: meetingLabel },
  ];

  return (
    <Layout preview={`Votre garde du ${dateLabel} avec ${sitterName} est confirmée`}>
      <Kicker tone="primary">Réservation confirmée</Kicker>
      <EmailHeading>
        Votre garde avec <strong>{sitterName}</strong> est confirmée
      </EmailHeading>

      <InfoTable rows={rows} />

      <Text
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: colors.muted,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          margin: "24px 0 4px",
        }}
      >
        Contacter {sitterFirstName}
      </Text>
      {sitterPhone ? (
        <Text style={{ fontSize: 15, margin: "0 0 8px" }}>{sitterPhone}</Text>
      ) : (
        <Text
          style={{ fontSize: 14, margin: "0 0 8px", color: colors.mutedStrong }}
        >
          Numéro non disponible - contactez le support.
        </Text>
      )}

      <ContactPills
        telHref={telHref}
        telLabel={`Appeler ${sitterFirstName}`}
        whatsappHref={whatsappHref}
      />
    </Layout>
  );
}

ClientBookingConfirmed.PreviewProps = {
  sitterName: "Hugo Martin",
  sitterPhone: "+33 6 98 76 54 32",
  dateLabel: "samedi 7 juin, 14:00",
  durationHours: 2,
  meetingLabel: "Vieux-Port",
  telHref: "tel:+33698765432",
  whatsappHref: "https://wa.me/33698765432",
} satisfies ClientBookingConfirmedProps;

export default ClientBookingConfirmed;
