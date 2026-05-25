import { Text } from "react-email";
import { Layout } from "@/lib/email/components/Layout";
import { Kicker } from "@/lib/email/components/Kicker";
import { EmailHeading } from "@/lib/email/components/EmailHeading";
import { InfoTable, InfoRow } from "@/lib/email/components/InfoTable";
import { NoteBubble } from "@/lib/email/components/NoteBubble";
import { ContactPills } from "@/lib/email/components/ContactPills";
import { PrimaryButton } from "@/lib/email/components/PrimaryButton";
import { colors } from "@/lib/email/theme";

export interface SitterBookingNotificationProps {
  clientFullName: string;
  clientPhone: string | null;
  clientNotes: string | null;
  durationHours: number;
  dateLabel: string;
  meetingLabel: string;
  optionsLabel: string | null;
  payoutLabel: string;
  telHref: string | null;
  whatsappHref: string | null;
  dashboardUrl: string;
}

export function SitterBookingNotification({
  clientFullName,
  clientPhone,
  clientNotes,
  durationHours,
  dateLabel,
  meetingLabel,
  optionsLabel,
  payoutLabel,
  telHref,
  whatsappHref,
  dashboardUrl,
}: SitterBookingNotificationProps) {
  const rows: InfoRow[] = [
    { label: "Quand", value: dateLabel },
    { label: "Lieu", value: meetingLabel },
    ...(optionsLabel ? [{ label: "Options", value: optionsLabel }] : []),
    { label: "Tu reçois", value: payoutLabel, emphasis: true },
  ];

  return (
    <Layout preview={`Nouvelle garde de ${durationHours}h - ${dateLabel}`}>
      <Kicker tone="primary">Nouvelle garde</Kicker>
      <EmailHeading>Nouvelle garde confirmée</EmailHeading>
      <Text style={{ fontSize: 15, lineHeight: 1.6, margin: "0 0 8px" }}>
        <strong>{clientFullName}</strong> a réservé et payé une garde de{" "}
        <strong>{durationHours}h</strong>. Elle est confirmée - tu n’as rien à
        valider.
      </Text>

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
        Client
      </Text>
      <Text style={{ fontSize: 15, margin: "0 0 8px" }}>
        {clientFullName}
        {clientPhone ? ` · ${clientPhone}` : ""}
      </Text>

      <ContactPills telHref={telHref} whatsappHref={whatsappHref} />

      {clientNotes ? <NoteBubble>{clientNotes}</NoteBubble> : null}

      <PrimaryButton href={dashboardUrl}>Voir la garde</PrimaryButton>

      <Text
        style={{
          fontSize: 12,
          color: colors.mutedStrong,
          margin: "20px 0 0",
          lineHeight: 1.5,
        }}
      >
        Empêché ? Tu peux annuler depuis ARKO avant le début de la garde - le
        client est alors remboursé automatiquement.
      </Text>
    </Layout>
  );
}

SitterBookingNotification.PreviewProps = {
  clientFullName: "Camille Dupont",
  clientPhone: "+33 6 12 34 56 78",
  clientNotes:
    "Luna est très joueuse mais a peur des trottinettes - éviter les pistes cyclables si possible.",
  durationHours: 2,
  dateLabel: "samedi 7 juin, 14:00",
  meetingLabel: "Vieux-Port",
  optionsLabel: "urgente (+7€)",
  payoutLabel: "22,75 €",
  telHref: "tel:+33612345678",
  whatsappHref: "https://wa.me/33612345678",
  dashboardUrl: "https://arko.life/sitter",
} satisfies SitterBookingNotificationProps;

export default SitterBookingNotification;
