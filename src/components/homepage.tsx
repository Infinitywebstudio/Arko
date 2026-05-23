import Link from "next/link";
import { Icon } from "./mascot";
import CookieSettingsLink from "./CookieSettingsLink";
import type { Database } from "@/lib/supabase/database.types";

type SitterPublic = Database["public"]["Views"]["sitters_public"]["Row"];

// HomeNav is a client component (scroll-driven transparency) - re-exported
// from a sibling file. The page imports it from "@/components/homepage" so
// this barrel keeps the public API stable.
export { HomeNav } from "./HomeNav";

// Hero photo. Swap this URL or drop a file at /public/hero-dog.jpg and
// point HERO_PHOTO_SRC to "/hero-dog.jpg" to use a local asset.
const HERO_PHOTO_SRC =
  "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=2400&q=80";

export function HomeHero() {
  return (
    <section
      style={{
        position: "relative",
        width: "100%",
        minHeight: "min(92vh, 900px)",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        color: "white",
      }}
    >
      {/* Background photo - absolute behind everything */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={HERO_PHOTO_SRC}
        alt=""
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center 40%",
        }}
      />
      {/* Dark gradient overlay - left side darker for text legibility, right
          side softer to keep the photo visible. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(95deg, rgba(15,19,16,0.88) 0%, rgba(31,61,44,0.72) 40%, rgba(31,61,44,0.25) 100%)",
        }}
      />

      {/* Foreground content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1280,
          width: "100%",
          margin: "0 auto",
          padding:
            "var(--space-20) var(--space-8) var(--space-16) var(--space-8)",
        }}
      >
        <div style={{ maxWidth: 680 }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(40px, 6vw, 88px)",
              lineHeight: 0.95,
              letterSpacing: "-0.02em",
              margin: 0,
              color: "white",
              textTransform: "uppercase",
              fontWeight: 400,
            }}
          >
            <span style={{ color: "var(--peach-100)" }}>Arko</span> garde
            <br />
            votre chien.
          </h1>

          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "clamp(14px, 1.4vw, 17px)",
              color: "rgba(255,255,255,0.85)",
              marginTop: "var(--space-6)",
              maxWidth: 540,
              lineHeight: 1.6,
            }}
          >
            1, 2 ou 3 heures de garde, par des dog-sitters vérifiés près de chez vous.
            Réservation en moins d&apos;une minute, paiement sécurisé.
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
              className="btn btn-primary btn-lg"
              style={{
                background: "white",
                color: "var(--coral-600)",
              }}
            >
              Trouver un sitter <Icon name="arrow" size={16} color="var(--coral-600)" />
            </Link>
            <Link
              href="/comment-ca-marche"
              className="btn btn-lg"
              style={{
                background: "transparent",
                color: "white",
                border: "1.5px solid rgba(255,255,255,0.4)",
              }}
            >
              Comment ça marche
            </Link>
          </div>

          <div
            style={{
              marginTop: "var(--space-8)",
              display: "flex",
              gap: "var(--space-6)",
              flexWrap: "wrap",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "rgba(255,255,255,0.7)",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="check" size={14} color="rgba(255,255,255,0.7)" /> Sitters vérifiés
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="lock" size={14} color="rgba(255,255,255,0.7)" /> Paiement Stripe
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomeStats() {
  const stats = [
    { n: "2 400+", l: "Dog-sitters vérifiés" },
    { n: "4.9 ★", l: "Note moyenne" },
    { n: "< 5 min", l: "Pour réserver" },
    { n: "100%", l: "Assurés" },
  ];
  return (
    <section style={{ background: "var(--ink-900)", padding: "var(--space-16) var(--space-8)", color: "white" }}>
      <div
        className="home-stats-grid"
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "var(--space-8)",
        }}
      >
        {stats.map((s) => (
          <div key={s.l}>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 60,
                color: "var(--coral-300)",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                whiteSpace: "nowrap",
              }}
            >
              {s.n}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "rgba(255,255,255,0.6)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginTop: "var(--space-4)",
                fontWeight: 500,
              }}
            >
              {s.l}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function HomeHowItWorks() {
  const steps: { n: string; t: string; d: string }[] = [
    {
      n: "01",
      t: "Choisissez un lieu",
      d: "Précisez où vous serez : musée, restaurant, balade. On trouve un sitter à 5 min à pied.",
    },
    {
      n: "02",
      t: "Réservez en 1 min",
      d: "Sélectionnez la durée et les options. Le paiement est sécurisé par Stripe, débité après la garde.",
    },
    {
      n: "03",
      t: "Profitez tranquille",
      d: "Photos en temps réel, géolocalisation du sitter, support 24/7. Votre chien est entre de bonnes pattes.",
    },
  ];
  return (
    <section style={{ padding: "var(--space-20) var(--space-8)", maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "var(--space-16)" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--coral-600)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: "var(--space-4)",
            fontWeight: 600,
          }}
        >
          Comment ça marche
        </div>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px, 3.5vw, 48px)",
            letterSpacing: "-0.02em",
            lineHeight: 1,
            margin: 0,
            fontWeight: 400,
          }}
        >
          Trois étapes,
          <br />
          <span style={{ color: "var(--coral-500)" }}>zéro stress.</span>
        </h2>
      </div>

      <div
        className="home-steps-grid"
        style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--space-6)" }}
      >
        {steps.map((s) => (
          <div
            key={s.n}
            style={{
              background: "white",
              border: "1px solid var(--ink-200)",
              borderRadius: 24,
              padding: "var(--space-8)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-4)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "relative" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "var(--space-4)",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "var(--coral-600)",
                    letterSpacing: "0.1em",
                    fontWeight: 700,
                  }}
                >
                  {s.n}
                </div>
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 32,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.05,
                  margin: 0,
                  marginBottom: "var(--space-3)",
                  fontWeight: 400,
                }}
              >
                {s.t}
              </h3>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 13,
                  color: "var(--ink-600)",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {s.d}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// Pricing for the homepage card preview. Real billing happens server-side
// from the same source of truth (booking flow line item).
const HOME_CARD_DURATION_HOURS = 2;
const HOME_CARD_PRICE_EUR = 35;

// Tints for the gradient placeholder behind a sitter card when it has no photo.
const FALLBACK_COLLARS = ["#3C582E", "#1B2A49", "#2E7D5B", "#F4A261"];

function displayName(full: string | null): string {
  if (!full) return "Sitter";
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]!;
  return `${parts[0]} ${parts[parts.length - 1]![0]!}.`;
}

export function HomeSitters({ sitters }: { sitters: SitterPublic[] }) {
  if (!sitters || sitters.length === 0) {
    // No sitters in DB yet - hide the whole section so the page stays clean.
    return null;
  }
  return (
    <section style={{ padding: "var(--space-20) var(--space-8)", maxWidth: 1280, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: "var(--space-10)",
          flexWrap: "wrap",
          gap: "var(--space-6)",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--coral-600)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: "var(--space-4)",
              fontWeight: 600,
            }}
          >
            Près de vous
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 3.5vw, 44px)",
              letterSpacing: "-0.02em",
              lineHeight: 1,
              margin: 0,
              fontWeight: 400,
            }}
          >
            Des dog-sitters
            <br />
            <span style={{ color: "var(--coral-500)" }}>de confiance.</span>
          </h2>
        </div>
        <Link href="/sitters" className="arrow-link">
          Voir tous les sitters <Icon name="arrow" size={14} />
        </Link>
      </div>

      <div
        className="home-sitters-grid"
        style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-5)" }}
      >
        {sitters.slice(0, 4).map((s, i) => {
          const collar = FALLBACK_COLLARS[i % FALLBACK_COLLARS.length]!;
          const sitterId = s.id ?? "";
          return (
            <Link
              key={sitterId || i}
              href={sitterId ? `/sitters/${sitterId}` : "#"}
              className="card card-hover"
              style={{ display: "flex", flexDirection: "column" }}
            >
              <div
                style={{
                  height: 180,
                  background: s.avatar_url
                    ? `url(${s.avatar_url}) center / cover no-repeat`
                    : `linear-gradient(135deg, ${collar}22 0%, ${collar}55 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                {!s.avatar_url && (
                  <div
                    style={{
                      fontFamily: "var(--font-brand), system-ui, sans-serif",
                      fontSize: 56,
                      color: collar,
                      opacity: 0.6,
                    }}
                  >
                    {s.full_name?.[0]?.toUpperCase() ?? "·"}
                  </div>
                )}
              </div>
              <div style={{ padding: "var(--space-5)", display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{displayName(s.full_name)}</div>
                {s.experience_years !== null && s.experience_years !== undefined && (
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: "var(--ink-500)",
                      marginTop: 4,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {s.experience_years === 0 ? "Débutant" : `${s.experience_years} an${s.experience_years > 1 ? "s" : ""} d'exp.`}
                  </div>
                )}
                <div
                  style={{
                    marginTop: "auto",
                    paddingTop: "var(--space-4)",
                    borderTop: "1px solid var(--ink-200)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 22, letterSpacing: "-0.02em", lineHeight: 1 }}>
                      {HOME_CARD_PRICE_EUR} €
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 10,
                        color: "var(--ink-500)",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        marginTop: 2,
                      }}
                    >
                      pour {HOME_CARD_DURATION_HOURS}h
                    </div>
                  </div>
                  <span className="btn btn-primary btn-sm">Voir</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function HomeTrust() {
  const features: { i: "shield" | "lock" | "phone"; t: string; d: string }[] = [
    {
      i: "shield",
      t: "Sitters vérifiés",
      d: "Pièce d'identité, casier judiciaire, formation premiers secours canins.",
    },
    {
      i: "lock",
      t: "Paiement Stripe",
      d: "Pré-autorisation à la réservation, débit après la garde uniquement.",
    },
    {
      i: "phone",
      t: "Support 7/7",
      d: "Une équipe humaine joignable à tout moment, en français et anglais.",
    },
  ];
  return (
    <section style={{ padding: "var(--space-20) var(--space-8)", background: "var(--peach-100)" }}>
      <div
        className="home-trust-grid"
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 1.2fr",
          gap: "var(--space-12)",
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/trust-dog.jpg"
            alt="Portrait d'un Border Collie noir et blanc"
            style={{
              width: "100%",
              maxWidth: 520,
              aspectRatio: "4 / 5",
              objectFit: "cover",
              borderRadius: 28,
              display: "block",
            }}
          />
        </div>

        <div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--coral-600)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: "var(--space-4)",
              fontWeight: 600,
            }}
          >
            Confiance
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 3.5vw, 44px)",
              letterSpacing: "-0.02em",
              lineHeight: 1,
              margin: 0,
              marginBottom: "var(--space-6)",
              fontWeight: 400,
            }}
          >
            Votre chien
            <br />
            <span style={{ color: "var(--coral-500)" }}>en sécurité</span>, toujours.
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", marginTop: "var(--space-8)" }}>
            {features.map((f) => (
              <div key={f.i} style={{ display: "flex", gap: "var(--space-4)", alignItems: "flex-start" }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    background: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon name={f.i} size={20} color="var(--coral-500)" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{f.t}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--ink-600)", lineHeight: 1.6 }}>
                    {f.d}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomeCTA() {
  return (
    <section style={{ padding: "var(--space-20) 1rem", maxWidth: 1280, margin: "0 auto" }}>
      <div
        style={{
          background: "var(--coral-500)",
          borderRadius: 32,
          padding: "var(--space-16) var(--space-8)",
          position: "relative",
          overflow: "hidden",
          color: "white",
          textAlign: "center",
        }}
      >
        <div style={{ position: "relative" }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(32px, 4.5vw, 56px)",
              letterSpacing: "-0.03em",
              lineHeight: 0.95,
              margin: 0,
              fontWeight: 400,
            }}
          >
            Prêt à <span style={{  }}>partir ?</span>
          </h2>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 16,
              marginTop: "var(--space-6)",
              maxWidth: 480,
              marginLeft: "auto",
              marginRight: "auto",
              lineHeight: 1.6,
              opacity: 0.95,
            }}
          >
            Réservez votre première garde en moins d&apos;une minute. Sans engagement, sans abonnement.
          </p>
          <div style={{ marginTop: "var(--space-8)", display: "flex", gap: "var(--space-3)", justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn btn-lg" style={{ background: "white", color: "var(--coral-600)" }}>
              Réserver maintenant <Icon name="arrow" size={16} />
            </button>
            <button
              className="btn btn-lg"
              style={{ background: "transparent", color: "white", border: "1px solid rgba(255,255,255,0.4)" }}
            >
              Devenir sitter
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomeFooter() {
  const cols: { t: string; l: { label: string; href?: string }[] }[] = [
    {
      t: "Navigation",
      l: [
        { label: "Trouver un sitter" },
        { label: "Devenir sitter" },
        { label: "Tarifs" },
      ],
    },
    {
      t: "Aide",
      l: [
        { label: "Centre d'aide" },
        { label: "CGU" },
        { label: "Confidentialité" },
        { label: "__cookie-settings__" },
      ],
    },
    {
      t: "Contact",
      l: [{ label: "support@arko.life", href: "mailto:support@arko.life" }],
    },
  ];
  return (
    <footer
      style={{
        background: "var(--ink-900)",
        color: "rgba(255,255,255,0.7)",
        padding: "var(--space-16) var(--space-8) var(--space-8)",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div
          className="home-footer-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr repeat(3, 1fr)",
            gap: "var(--space-10)",
            marginBottom: "var(--space-12)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "var(--space-4)" }}>
              <div
                style={{
                  fontFamily: "var(--font-brand), system-ui, sans-serif",
                  fontSize: 28,
                  letterSpacing: "0.02em",
                  color: "var(--peach-100)",
                  lineHeight: 1,
                }}
              >
                ARKO
              </div>
            </div>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, lineHeight: 1.6, maxWidth: 280, margin: 0 }}>
              Le dog-sitting de courte durée pour explorer la ville sans contrainte.
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.t}>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "white",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 600,
                  marginBottom: "var(--space-4)",
                }}
              >
                {c.t}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                {c.l.map((item) =>
                  item.label === "__cookie-settings__" ? (
                    <CookieSettingsLink
                      key="cookie-settings"
                      style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}
                    />
                  ) : (
                    <a key={item.label} href={item.href} style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>
                      {item.label}
                    </a>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            paddingTop: "var(--space-6)",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "var(--space-4)",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "0.04em",
          }}
        >
          <div>© 2026 ARKO · Paris, France</div>
          <div style={{ display: "flex", gap: "var(--space-5)" }}>
            <span>Français · FR</span>
            <span>EUR €</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
