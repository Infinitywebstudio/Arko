import type { Metadata } from "next";
import Link from "next/link";
import { HomeNav, HomeFooter } from "@/components/homepage";
import { Icon, type IconName } from "@/components/mascot";
import { getCurrentUser, navUserFrom } from "@/lib/auth/helpers";

export const metadata: Metadata = {
  title: "Comment ça marche · ARKO",
  description:
    "Faites garder votre chien le temps d'une visite à Arles. Réservation en moins d'une minute, dog-sitters sélectionnés, paiement sécurisé.",
};

type Step = {
  n: string;
  icon: IconName;
  title: string;
  body: string;
  bullets?: string[];
};

const STEPS: Step[] = [
  {
    n: "01",
    icon: "calendar",
    title: "Réservez en moins d'une minute",
    body:
      "Choisissez la durée de garde adaptée à votre besoin (1 h, 2 h ou 3 h), renseignez vos informations et validez votre réservation directement en ligne. Le paiement est sécurisé et rapide.",
  },
  {
    n: "02",
    icon: "user",
    title: "Choisissez le dog-sitter de votre choix",
    body:
      "Sélectionnez un dog-sitter parmi une sélection de profils triés sur le volet, prêts à balader votre toutou avec un itinéraire déjà prévu, adapté spécialement pour les chiens. Le dog-sitter choisi vous contactera par SMS ou WhatsApp pour recueillir certaines informations :",
    bullets: [
      "le lieu de rendez-vous précis,",
      "l'heure précise,",
      "les informations sur votre chien.",
    ],
  },
  {
    n: "03",
    icon: "heart",
    title: "Profitez pleinement de votre visite",
    body:
      "Pendant la durée de la prestation, votre chien est pris en charge en extérieur par un dog-sitter, que vous pouvez contacter à tout moment. Vous êtes alors libre de :",
    bullets: [
      "visiter librement les galeries et expositions,",
      "profiter d'un restaurant,",
      "découvrir la ville sans contrainte.",
    ],
  },
  {
    n: "04",
    icon: "pin",
    title: "Récupérez votre chien facilement",
    body:
      "À la fin du créneau, vous retrouvez votre chien à l'endroit convenu. Simple, rapide, sans complication.",
  },
];

const REASONS = [
  "Réservation ultra rapide",
  "Paiement sécurisé",
  "Dog-sitters sélectionnés",
  "Service pensé pour les touristes",
  "Disponible immédiatement à Arles",
];

const eyebrow = {
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  color: "var(--coral-600)",
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  fontWeight: 600,
};

export default async function CommentCaMarchePage() {
  const navUser = navUserFrom(await getCurrentUser());
  return (
    <>
      <HomeNav user={navUser} />

      {/* Hero - colored background so the transparent fixed nav stays legible */}
      <section
        style={{
          position: "relative",
          background:
            "linear-gradient(135deg, var(--ink-900) 0%, var(--coral-700) 120%)",
          color: "white",
          padding:
            "calc(var(--space-20) + 56px) var(--space-8) var(--space-20)",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "relative", maxWidth: 760, margin: "0 auto" }}>
          <div style={{ ...eyebrow, color: "var(--peach-100)" }}>
            Comment ça marche
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(34px, 5vw, 64px)",
              letterSpacing: "-0.02em",
              lineHeight: 1,
              margin: "var(--space-4) 0 var(--space-6)",
              fontWeight: 400,
            }}
          >
            Profitez d&apos;Arles
            <br />
            sans contrainte.
          </h1>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "clamp(14px, 1.4vw, 17px)",
              color: "rgba(255,255,255,0.85)",
              lineHeight: 1.7,
              maxWidth: 600,
              margin: 0,
            }}
          >
            Vous êtes en visite à Arles et souhaitez accéder à un musée, un restaurant
            ou une exposition où les chiens ne sont pas autorisés ? ARKO vous permet de
            faire garder votre chien simplement, rapidement et en toute tranquillité.
          </p>
          <div
            style={{
              marginTop: "var(--space-8)",
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/sitters"
              className="btn btn-lg"
              style={{
                background: "white",
                color: "var(--coral-600)",
                boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
              }}
            >
              Trouver un sitter <Icon name="arrow" size={16} color="var(--coral-600)" />
            </Link>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section
        style={{
          padding: "var(--space-20) var(--space-8)",
          maxWidth: 880,
          margin: "0 auto",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "var(--space-12)" }}>
          <div style={eyebrow}>Comment ça fonctionne ?</div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 3.5vw, 48px)",
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
              margin: "var(--space-4) 0 0",
              fontWeight: 400,
              color: "var(--ink-900)",
            }}
          >
            Quatre étapes,
            <br />
            <span style={{ color: "var(--coral-500)" }}>zéro stress.</span>
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          {STEPS.map((s) => (
            <article
              key={s.n}
              style={{
                background: "white",
                border: "1px solid var(--ink-200)",
                borderRadius: 24,
                padding: "var(--space-8)",
                display: "flex",
                gap: "var(--space-6)",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: "var(--coral-50)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon name={s.icon} size={26} color="var(--coral-600)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "var(--coral-600)",
                    letterSpacing: "0.1em",
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  {s.n}
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(22px, 2.4vw, 30px)",
                    letterSpacing: "-0.01em",
                    lineHeight: 1.1,
                    margin: "0 0 var(--space-3)",
                    fontWeight: 400,
                    color: "var(--ink-900)",
                  }}
                >
                  {s.title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 14,
                    color: "var(--ink-600)",
                    lineHeight: 1.7,
                    margin: 0,
                  }}
                >
                  {s.body}
                </p>
                {s.bullets && (
                  <ul
                    style={{
                      listStyle: "none",
                      padding: 0,
                      margin: "var(--space-4) 0 0",
                      display: "flex",
                      flexDirection: "column",
                      gap: "var(--space-2)",
                    }}
                  >
                    {s.bullets.map((b) => (
                      <li
                        key={b}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 10,
                          fontFamily: "var(--font-mono)",
                          fontSize: 14,
                          color: "var(--ink-700)",
                          lineHeight: 1.6,
                        }}
                      >
                        <span style={{ marginTop: 3, flexShrink: 0 }}>
                          <Icon name="check" size={15} color="var(--coral-500)" />
                        </span>
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          ))}
        </div>

        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 14,
            color: "var(--ink-600)",
            textAlign: "center",
            lineHeight: 1.7,
            marginTop: "var(--space-10)",
          }}
        >
          Plus besoin de renoncer à une activité à cause de votre chien.
        </p>
      </section>

      {/* Why ARKO */}
      <section style={{ padding: "var(--space-20) var(--space-8)", background: "var(--peach-100)" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", textAlign: "center" }}>
          <div style={eyebrow}>Pourquoi choisir ARKO ?</div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 3.5vw, 44px)",
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
              margin: "var(--space-4) 0 var(--space-10)",
              fontWeight: 400,
              color: "var(--ink-900)",
            }}
          >
            Un service simple,
            <br />
            <span style={{ color: "var(--coral-500)" }}>direct et fluide.</span>
          </h2>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--space-4)",
              justifyContent: "center",
            }}
          >
            {REASONS.map((r) => (
              <div
                key={r}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "white",
                  borderRadius: 999,
                  padding: "12px 20px",
                  boxShadow: "var(--shadow-sm)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--ink-800)",
                }}
              >
                <Icon name="check" size={16} color="var(--coral-500)" />
                {r}
              </div>
            ))}
          </div>

          <div style={{ marginTop: "var(--space-12)" }}>
            <Link href="/sitters" className="btn btn-primary btn-lg">
              Réserver maintenant <Icon name="arrow" size={16} />
            </Link>
          </div>
        </div>
      </section>

      <HomeFooter />
    </>
  );
}
