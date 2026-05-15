import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import BottomNavRoot from "@/components/BottomNavRoot";

// Archivo Black (the brand wordmark) is loaded via @import in globals.css.
// next/font helpers emit a broken `unicode-range: U+??` for the basic-Latin
// subset on this font (Next 16 + Turbopack issue), which makes the browser
// fall through to the local Arial fallback. The direct @import bypasses the
// subsetting step and the font renders correctly. --font-display is aliased
// to --font-brand in globals.css so all H1/H2 inherit the wordmark face.

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ARKO — Faites garder votre chien le temps d'une visite",
  description:
    "1, 2 ou 3 heures de garde, par des dog-sitters vérifiés près de chez vous. Réservation en moins d'une minute, paiement sécurisé.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      className={`${jetBrainsMono.variable}`}
    >
      <body>
        {children}
        <BottomNavRoot />
      </body>
    </html>
  );
}
