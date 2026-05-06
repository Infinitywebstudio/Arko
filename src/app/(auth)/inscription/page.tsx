import type { Metadata } from "next";
import SignUpWizard from "@/components/auth/SignUpWizard";

export const metadata: Metadata = {
  title: "Inscription · ARKO",
  description: "Crée ton compte ARKO en 1 minute.",
};

export default function InscriptionPage() {
  return <SignUpWizard />;
}
