import Link from "next/link";
import { Arko, Paw, Icon, type ArkoMood } from "./mascot";
import { zoneLabel } from "@/lib/zones";
import type { Database } from "@/lib/supabase/database.types";

type SitterPublic = Database["public"]["Views"]["sitters_public"]["Row"];

export function HomeNav() {
  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(250, 247, 245, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--ink-200)",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "16px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Arko size={36} mood="alert" collar="#FF5A5F" />
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 30,
              fontStyle: "italic",
              color: "var(--coral-500)",
              lineHeight: 1,
            }}
          >
            arko
          </div>
        </div>
        <div
          className="home-nav-links"
          style={{
            display: "flex",
            gap: 32,
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            color: "var(--ink-700)",
            fontWeight: 500,
          }}
        >
          <a>Trouver un sitter</a>
          <a>Comment ça marche</a>
          <a>Devenir sitter</a>
          <a>Aide</a>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link href="/connexion" className="btn btn-ghost btn-sm">
            Connexion
          </Link>
          <Link href="/inscription" className="btn btn-primary btn-sm btn-pill">
            S&apos;inscrire
          </Link>
        </div>
      </div>
    </nav>
  );
}

export function HomeHero() {
  return (
    <section
      style={{
        padding: "var(--space-16) var(--space-8) var(--space-20)",
        maxWidth: 1280,
        margin: "0 auto",
      }}
    >
      <div
        className="home-hero-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 1fr",
          gap: "var(--space-12)",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              background: "var(--coral-50)",
              color: "var(--coral-700)",
              borderRadius: 999,
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: "var(--space-6)",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                background: "var(--coral-500)",
                borderRadius: 999,
              }}
            />
            Nouveau · Disponible à Paris
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(64px, 8vw, 112px)",
              lineHeight: 0.92,
              letterSpacing: "-0.03em",
              margin: 0,
              color: "var(--ink-900)",
              fontWeight: 400,
            }}
          >
            Visitez la ville.
            <br />
            <span style={{ fontStyle: "italic", color: "var(--coral-500)" }}>Arko</span> garde
            <br />
            votre chien.
          </h1>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 16,
              color: "var(--ink-600)",
              marginTop: "var(--space-6)",
              maxWidth: 480,
              lineHeight: 1.6,
            }}
          >
            1, 2 ou 3 heures de garde, par des dog-sitters vérifiés près de chez vous.
            Réservation en moins d&apos;une minute, paiement sécurisé.
          </p>

          <div
            style={{
              marginTop: "var(--space-8)",
              background: "white",
              border: "1px solid var(--ink-200)",
              borderRadius: 999,
              padding: 8,
              display: "flex",
              alignItems: "center",
              boxShadow: "var(--shadow-md)",
              maxWidth: 580,
            }}
          >
            <div style={{ flex: 1.3, padding: "10px 24px", borderRight: "1px solid var(--ink-200)" }}>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--ink-500)",
                  fontWeight: 600,
                }}
              >
                Où
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>Musée d&apos;Orsay, Paris</div>
            </div>
            <div style={{ flex: 1, padding: "10px 24px", borderRight: "1px solid var(--ink-200)" }}>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--ink-500)",
                  fontWeight: 600,
                }}
              >
                Durée
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>2 heures</div>
            </div>
            <div style={{ flex: 1, padding: "10px 24px" }}>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--ink-500)",
                  fontWeight: 600,
                }}
              >
                Quand
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>Maintenant</div>
            </div>
            <button
              className="btn btn-primary btn-pill"
              style={{ width: 56, height: 56, padding: 0, flexShrink: 0 }}
              aria-label="Rechercher"
            >
              <Icon name="search" size={20} color="white" />
            </button>
          </div>

          <div
            style={{
              marginTop: "var(--space-6)",
              display: "flex",
              gap: "var(--space-6)",
              flexWrap: "wrap",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--ink-600)",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="shield" size={14} color="var(--success-500)" /> Assurance incluse
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="check" size={14} color="var(--success-500)" /> Sitters vérifiés
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="lock" size={14} color="var(--success-500)" /> Paiement Stripe
            </span>
          </div>
        </div>

        <div
          style={{
            position: "relative",
            aspectRatio: "1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 50% 50%, var(--peach-200) 0%, var(--peach-100) 50%, transparent 80%)",
              borderRadius: "50%",
            }}
          />
          <div
            style={{
              position: "relative",
              width: "85%",
              aspectRatio: "1",
              background: "linear-gradient(160deg, #FFE5D9 0%, #FFCABF 100%)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 40px 80px rgba(255, 90, 95, 0.2)",
            }}
          >
            <Arko size={320} mood="happy" />
          </div>

          <div
            style={{
              position: "absolute",
              top: "8%",
              right: "0%",
              background: "white",
              padding: "12px 16px",
              borderRadius: 16,
              boxShadow: "var(--shadow-lg)",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              fontWeight: 600,
              transform: "rotate(4deg)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ width: 8, height: 8, background: "var(--success-500)", borderRadius: 999 }} />
            3 sitters dispo · 4 min
          </div>
          <div
            style={{
              position: "absolute",
              bottom: "12%",
              left: "-2%",
              background: "var(--ink-900)",
              color: "white",
              padding: "12px 16px",
              borderRadius: 16,
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              fontWeight: 600,
              transform: "rotate(-3deg)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ color: "var(--coral-300)" }}>★</span> 4.9 · 2 400+ avis
          </div>
          <div
            style={{
              position: "absolute",
              top: "45%",
              right: "-4%",
              background: "var(--coral-500)",
              color: "white",
              padding: "10px 14px",
              borderRadius: 14,
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              fontWeight: 600,
              transform: "rotate(6deg)",
              boxShadow: "var(--shadow-coral)",
            }}
          >
            Réservé en 47s
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
                fontStyle: "italic",
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
  const steps: { n: string; t: string; d: string; mood: ArkoMood }[] = [
    {
      n: "01",
      t: "Choisissez un lieu",
      d: "Précisez où vous serez : musée, restaurant, balade. On trouve un sitter à 5 min à pied.",
      mood: "alert",
    },
    {
      n: "02",
      t: "Réservez en 1 min",
      d: "Sélectionnez la durée et options. Le paiement est sécurisé par Stripe, débité après la garde.",
      mood: "happy",
    },
    {
      n: "03",
      t: "Profitez tranquille",
      d: "Photos en temps réel, géolocalisation du sitter, support 24/7. Votre chien est entre de bonnes pattes.",
      mood: "waggy",
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
            fontSize: "clamp(44px, 6vw, 72px)",
            letterSpacing: "-0.02em",
            lineHeight: 1,
            margin: 0,
            fontWeight: 400,
          }}
        >
          Trois étapes,
          <br />
          <span style={{ fontStyle: "italic", color: "var(--coral-500)" }}>zéro stress.</span>
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
            <div
              style={{
                position: "absolute",
                top: -20,
                right: -20,
                width: 140,
                height: 140,
                background: "var(--peach-100)",
                borderRadius: "50%",
                opacity: 0.6,
              }}
            />
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
                <Arko size={64} mood={s.mood} />
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
const HOME_CARD_PRICE_EUR = 32;

// Visual rotation for the Arko mascot fallback when a sitter has no avatar.
const FALLBACK_MOODS: ArkoMood[] = ["happy", "alert", "waggy", "happy"];
const FALLBACK_COLLARS = ["#FF5A5F", "#1B2A49", "#2E7D5B", "#F4A261"];

function displayName(full: string | null): string {
  if (!full) return "Sitter";
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]!;
  return `${parts[0]} ${parts[parts.length - 1]![0]!}.`;
}

export function HomeSitters({ sitters }: { sitters: SitterPublic[] }) {
  if (!sitters || sitters.length === 0) {
    // No sitters in DB yet — hide the whole section so the page stays clean.
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
              fontSize: "clamp(40px, 5vw, 60px)",
              letterSpacing: "-0.02em",
              lineHeight: 1,
              margin: 0,
              fontWeight: 400,
            }}
          >
            Des dog-sitters
            <br />
            <span style={{ fontStyle: "italic", color: "var(--coral-500)" }}>de confiance.</span>
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
          const mood = FALLBACK_MOODS[i % FALLBACK_MOODS.length]!;
          const area = s.service_zones && s.service_zones[0] ? zoneLabel(s.service_zones[0]) : "Arles";
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
                {!s.avatar_url && <Arko size={130} mood={mood} collar={collar} />}
              </div>
              <div style={{ padding: "var(--space-5)", display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{displayName(s.full_name)}</div>
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
                  <Icon name="pin" size={12} /> {area}
                  {s.experience_years !== null && s.experience_years !== undefined && (
                    <span style={{ marginLeft: 8 }}>
                      · {s.experience_years === 0 ? "Débutant" : `${s.experience_years} an${s.experience_years > 1 ? "s" : ""} d'exp.`}
                    </span>
                  )}
                </div>
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
      t: "Support 24/7",
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
          <div
            style={{
              background: "white",
              borderRadius: 28,
              padding: "var(--space-8)",
              boxShadow: "var(--shadow-lg)",
              maxWidth: 360,
              width: "100%",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: "var(--space-5)" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  background: "var(--peach-200)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Arko size={48} mood="happy" />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>Marie &amp; Loulou</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-500)" }}>
                  Touriste · Madrid
                </div>
              </div>
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 22,
                fontStyle: "italic",
                lineHeight: 1.3,
                color: "var(--ink-800)",
                letterSpacing: "-0.01em",
              }}
            >
              &ldquo;Visiter le Louvre avec un chien était impossible. Avec Arko, c&apos;est devenu simple.
              Camille était parfaite.&rdquo;
            </div>
            <div style={{ marginTop: "var(--space-5)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ color: "var(--coral-500)", fontSize: 14 }}>★ ★ ★ ★ ★</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-500)" }}>il y a 2 jours</div>
            </div>
          </div>
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
              fontSize: "clamp(40px, 5vw, 60px)",
              letterSpacing: "-0.02em",
              lineHeight: 1,
              margin: 0,
              marginBottom: "var(--space-6)",
              fontWeight: 400,
            }}
          >
            Votre chien
            <br />
            <span style={{ fontStyle: "italic", color: "var(--coral-500)" }}>en sécurité</span>, toujours.
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
                    boxShadow: "var(--shadow-sm)",
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
    <section style={{ padding: "var(--space-20) var(--space-8)", maxWidth: 1280, margin: "0 auto" }}>
      <div
        style={{
          background: "var(--coral-500)",
          borderRadius: 32,
          padding: "var(--space-16) var(--space-12)",
          position: "relative",
          overflow: "hidden",
          color: "white",
          textAlign: "center",
        }}
      >
        <div style={{ position: "absolute", top: -40, left: -40, opacity: 0.15 }}>
          <Paw size={180} color="white" />
        </div>
        <div style={{ position: "absolute", bottom: -50, right: -30, opacity: 0.15 }}>
          <Paw size={220} color="white" />
        </div>
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "var(--space-6)" }}>
            <Arko size={100} mood="waggy" collar="#FFFFFF" fur="#FFE5D9" />
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(48px, 7vw, 88px)",
              letterSpacing: "-0.03em",
              lineHeight: 0.95,
              margin: 0,
              fontWeight: 400,
            }}
          >
            Prêt à <span style={{ fontStyle: "italic" }}>partir ?</span>
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
  const cols: { t: string; l: string[] }[] = [
    { t: "Produit", l: ["Trouver un sitter", "Devenir sitter", "Tarifs", "Villes disponibles"] },
    { t: "Société", l: ["À propos", "Blog", "Presse", "Recrutement"] },
    { t: "Aide", l: ["Centre d'aide", "Contact", "CGU", "Confidentialité"] },
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
              <Arko size={36} mood="alert" collar="#FF5A5F" />
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 30,
                  fontStyle: "italic",
                  color: "var(--coral-300)",
                  lineHeight: 1,
                }}
              >
                arko
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
                {c.l.map((item) => (
                  <a key={item} style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>
                    {item}
                  </a>
                ))}
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
