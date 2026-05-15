"use client";

import { useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "@/components/mascot";

type Role = "client" | "sitter";

type Step = {
  i: IconName;
  n: string;
  t: string;
  d: string;
};

const CLIENT_STEPS: Step[] = [
  {
    i: "search",
    n: "01",
    t: "Trouvez votre sitter",
    d: "Parcourez les profils près de votre lieu : musée, restaurant, balade. Bio, zones, disponibilités en clair.",
  },
  {
    i: "calendar",
    n: "02",
    t: "Réservez en 1 minute",
    d: "Sélectionnez la durée (1, 2 ou 3 h) et les options. Paiement sécurisé Stripe, débité à la confirmation.",
  },
  {
    i: "check",
    n: "03",
    t: "Recevez la confirmation",
    d: "Le sitter accepte sous quelques minutes. Email automatique avec son numéro et lien WhatsApp.",
  },
  {
    i: "message",
    n: "04",
    t: "Coordonnez en direct",
    d: "Téléphone et WhatsApp accessibles dès la confirmation pour fixer le point de rencontre exact.",
  },
  {
    i: "heart",
    n: "05",
    t: "Profitez sereinement",
    d: "Votre chien est entre de bonnes pattes. Annulation gratuite jusqu’au début de la garde.",
  },
  {
    i: "star",
    n: "06",
    t: "Laissez votre retour",
    d: "Un commentaire libre en fin de garde pour remercier le sitter et aider la communauté.",
  },
];

const SITTER_STEPS: Step[] = [
  {
    i: "user",
    n: "01",
    t: "Créez votre profil",
    d: "Bio, expérience, zones d’intervention, photo. Validation rapide par l’équipe ARKO.",
  },
  {
    i: "clock",
    n: "02",
    t: "Définissez vos créneaux",
    d: "Disponibilités hebdomadaires par jour, modifiables à tout moment depuis votre espace.",
  },
  {
    i: "bell",
    n: "03",
    t: "Recevez les demandes",
    d: "Notification email à chaque réservation. Toutes les infos client + lieu en un coup d’œil.",
  },
  {
    i: "check",
    n: "04",
    t: "Acceptez ou refusez",
    d: "En un clic. Refus = remboursement automatique du client, aucune friction pour vous.",
  },
  {
    i: "shield",
    n: "05",
    t: "Réalisez la garde",
    d: "Vous êtes l’unique source de vérité. Coordonnez par WhatsApp, faites les choses à votre rythme.",
  },
  {
    i: "wallet",
    n: "06",
    t: "Clôturez et soyez payé",
    d: "Une fois la garde finie, clôture en 1 clic. Reversement de votre part sous 7 jours.",
  },
];

export function HomeApproach() {
  const [role, setRole] = useState<Role>("client");
  const [activeIdx, setActiveIdx] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const steps = role === "client" ? CLIENT_STEPS : SITTER_STEPS;

  // Drive the mobile pagination dots from the actual scroll position.
  // IntersectionObserver beats a scroll listener here — it fires exactly
  // when a card's threshold crosses, no debouncing required.
  useEffect(() => {
    const root = trackRef.current;
    if (!root) return;
    const cards = Array.from(root.children) as HTMLElement[];
    if (cards.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        // Pick the card with the highest intersectionRatio currently.
        // Multiple entries may fire on a single scroll — only act on the
        // one that's most visible.
        const best = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (best) {
          const idx = cards.indexOf(best.target as HTMLElement);
          if (idx >= 0) setActiveIdx(idx);
        }
      },
      { root, threshold: [0.55, 0.85] },
    );
    cards.forEach((c) => io.observe(c));
    return () => io.disconnect();
    // Re-bind when role changes — `steps` length is constant but the
    // children identity changes, so observer targets must be refreshed.
  }, [role]);

  // Reset to the first card when switching roles so the dots don't claim
  // an index past the end of the visible track.
  useEffect(() => {
    setActiveIdx(0);
    trackRef.current?.scrollTo({ left: 0, behavior: "instant" as ScrollBehavior });
  }, [role]);

  const scrollToCard = (idx: number) => {
    const root = trackRef.current;
    if (!root) return;
    const card = root.children[idx] as HTMLElement | undefined;
    if (!card) return;
    // `inline: "start"` aligns the card's leading edge to the scroll-padding,
    // which is what our snap-points expect.
    card.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  };

  return (
    <section
      style={{
        padding: "var(--space-20) var(--space-8)",
        maxWidth: 1280,
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "var(--space-12)" }}>
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
            lineHeight: 1.05,
            margin: 0,
            fontWeight: 400,
            color: "var(--ink-900)",
          }}
        >
          Une approche pensée pour vous.
        </h2>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 14,
            color: "var(--ink-600)",
            marginTop: "var(--space-4)",
            maxWidth: 580,
            marginInline: "auto",
            lineHeight: 1.6,
          }}
        >
          Chaque étape a été conçue pour rendre l’expérience simple, fluide et fiable —
          côté tourisme comme côté sitter.
        </p>

        {/* Role toggle */}
        <div
          role="tablist"
          aria-label="Parcours utilisateur"
          style={{
            display: "inline-flex",
            marginTop: "var(--space-8)",
            background: "white",
            borderRadius: 999,
            border: "1px solid var(--ink-200)",
            padding: 4,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <RoleTab
            active={role === "client"}
            onClick={() => setRole("client")}
            icon="user"
            label="Je suis client"
          />
          <RoleTab
            active={role === "sitter"}
            onClick={() => setRole("sitter")}
            icon="heart"
            label="Je suis sitter"
          />
        </div>
      </div>

      {/* Steps grid (carrousel snap-scroll on mobile, see globals.css) */}
      <div
        ref={trackRef}
        className="home-approach-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "var(--space-5)",
        }}
      >
        {steps.map((s) => (
          <article
            key={s.n}
            style={{
              background: "white",
              border: "1px solid var(--ink-200)",
              borderRadius: 20,
              padding: "var(--space-6)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-3)",
              transition: "transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                minHeight: 56,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: "var(--coral-50)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon name={s.i} size={24} color="var(--coral-600)" />
              </div>
              <div
                style={{
                  fontFamily: "var(--font-brand), system-ui, sans-serif",
                  fontSize: 32,
                  letterSpacing: "0.02em",
                  color: "var(--ink-900)",
                  lineHeight: 1,
                  display: "flex",
                  alignItems: "center",
                  height: 56,
                }}
              >
                {s.n}
              </div>
            </div>
            <h3
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 16,
                fontWeight: 700,
                color: "var(--ink-900)",
                margin: 0,
                marginTop: "var(--space-2)",
                letterSpacing: "-0.005em",
                lineHeight: 1.3,
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
          </article>
        ))}
      </div>

      {/* Pagination dots — `display: none` by default, flipped to flex on
          mobile via `.home-approach-dots` in globals.css. Click jumps the
          carousel to that card; the active dot is driven by the observer. */}
      <div
        className="home-approach-dots"
        role="tablist"
        aria-label="Pagination des étapes"
        style={{
          display: "none",
          justifyContent: "center",
          gap: 8,
          marginTop: 16,
        }}
      >
        {steps.map((s, i) => {
          const active = i === activeIdx;
          return (
            <button
              key={s.n}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={`Étape ${i + 1} sur ${steps.length} : ${s.t}`}
              onClick={() => scrollToCard(i)}
              style={{
                width: active ? 24 : 8,
                height: 8,
                borderRadius: 999,
                background: active ? "var(--coral-500)" : "var(--ink-300)",
                border: "none",
                padding: 0,
                cursor: "pointer",
                transition: "width 220ms ease, background 220ms ease",
              }}
            />
          );
        })}
      </div>
    </section>
  );
}

function RoleTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: IconName;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 18px",
        borderRadius: 999,
        background: active ? "var(--coral-500)" : "transparent",
        color: active ? "white" : "var(--ink-700)",
        fontFamily: "var(--font-mono)",
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: "0.01em",
        cursor: "pointer",
        transition: "background 180ms ease, color 180ms ease",
      }}
    >
      <Icon name={icon} size={15} color={active ? "white" : "var(--ink-700)"} />
      {label}
    </button>
  );
}
