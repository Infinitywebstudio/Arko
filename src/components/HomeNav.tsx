"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Sticky top navigation for the marketing homepage. Starts transparent so
 * the hero photo bleeds under it; flips to a solid cream/white surface once
 * the user scrolls past ~hero height so the nav stays legible over body
 * content.
 *
 * The threshold is intentionally generous (80px) — short enough to react
 * the moment the user starts scrolling, long enough that a tiny accidental
 * wheel tick doesn't cause a flicker.
 *
 * Mobile (< 860px) shows a hamburger that opens a left-side drawer with the
 * primary CTAs and the nav links — the desktop link row is hidden at that
 * width via globals.css `.home-nav-links`.
 */
const SCROLL_THRESHOLD = 80;

export function HomeNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > SCROLL_THRESHOLD);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the drawer is open so the page underneath
  // doesn't drift when the user pans inside the panel.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const textColor = scrolled ? "var(--ink-700)" : "rgba(255,255,255,0.9)";
  const wordmarkColor = scrolled ? "var(--coral-600)" : "white";

  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: scrolled ? "rgba(250, 247, 245, 0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid var(--ink-200)" : "1px solid transparent",
          transition:
            "background 220ms ease, border-color 220ms ease, backdrop-filter 220ms ease",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button
              type="button"
              className="home-nav-burger"
              aria-label="Ouvrir le menu"
              aria-expanded={open}
              onClick={() => setOpen(true)}
              style={{
                display: "none",
                width: 40,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 10,
                background: "transparent",
                cursor: "pointer",
                color: textColor,
                transition: "color 220ms ease, background 220ms ease",
              }}
            >
              <BurgerIcon color="currentColor" />
            </button>
            <Link
              href="/"
              style={{
                fontFamily: "var(--font-brand), system-ui, sans-serif",
                fontSize: 28,
                letterSpacing: "0.02em",
                color: wordmarkColor,
                lineHeight: 1,
                transition: "color 220ms ease",
                textDecoration: "none",
              }}
            >
              ARKO
            </Link>
          </div>
          <div
            className="home-nav-links"
            style={{
              display: "flex",
              gap: 32,
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              color: textColor,
              fontWeight: 500,
              transition: "color 220ms ease",
            }}
          >
            <a>Trouver un sitter</a>
            <a>Comment ça marche</a>
            <a>Devenir sitter</a>
            <a>Aide</a>
          </div>
          {/* Mobile-only quick access to auth on the right edge of the bar.
              Hidden ≥ 860px where the inline CTAs take over. */}
          <Link
            href="/connexion"
            className="home-nav-person"
            aria-label="Connexion ou inscription"
            style={{
              display: "none",
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 999,
              background: scrolled ? "var(--ink-100)" : "rgba(255,255,255,0.16)",
              color: textColor,
              transition: "background 220ms ease, color 220ms ease",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20a8 8 0 0 1 16 0" />
            </svg>
          </Link>
          <div
            className="home-nav-ctas"
            style={{ display: "flex", gap: 10, alignItems: "center" }}
          >
            <Link
              href="/connexion"
              className="btn btn-ghost btn-sm"
              style={{ color: textColor, transition: "color 220ms ease" }}
            >
              Connexion
            </Link>
            <Link
              href="/inscription"
              className="btn btn-primary btn-sm btn-pill"
              style={
                scrolled
                  ? undefined
                  : {
                      background: "white",
                      color: "var(--coral-600)",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                    }
              }
            >
              S&apos;inscrire
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile drawer + backdrop. Both mount only when open so they never
          consume hit-tests on desktop. Slide-in from the left, full height,
          frosted glass for the side panel surface. */}
      <div
        aria-hidden={!open}
        onClick={() => setOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 70,
          background: open ? "rgba(15, 19, 16, 0.4)" : "transparent",
          backdropFilter: open ? "blur(2px)" : "none",
          WebkitBackdropFilter: open ? "blur(2px)" : "none",
          pointerEvents: open ? "auto" : "none",
          transition: "background 220ms ease",
        }}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: "min(86vw, 360px)",
          zIndex: 80,
          background: "rgba(247, 244, 236, 0.92)",
          backdropFilter: "blur(28px) saturate(180%)",
          WebkitBackdropFilter: "blur(28px) saturate(180%)",
          borderRight: "1px solid rgba(216, 213, 200, 0.6)",
          padding: "calc(env(safe-area-inset-top) + 24px) 20px 24px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          transform: open ? "translateX(0)" : "translateX(-105%)",
          transition: "transform 260ms cubic-bezier(0.32, 0.72, 0, 1)",
          boxShadow: "8px 0 32px rgba(15, 19, 16, 0.12)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-brand), system-ui, sans-serif",
              fontSize: 26,
              letterSpacing: "0.02em",
              color: "var(--coral-600)",
            }}
          >
            ARKO
          </span>
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setOpen(false)}
            style={{
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 10,
              background: "transparent",
              cursor: "pointer",
              color: "var(--ink-700)",
            }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* CTAs first — Uber Eats pattern, the most actionable items at the top */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Link
            href="/inscription"
            className="btn btn-primary"
            onClick={() => setOpen(false)}
            style={{ height: 48, width: "100%" }}
          >
            S&apos;inscrire
          </Link>
          <Link
            href="/connexion"
            className="btn btn-outline"
            onClick={() => setOpen(false)}
            style={{ height: 48, width: "100%" }}
          >
            Connexion
          </Link>
        </div>

        {/* Nav links */}
        <nav
          aria-label="Liens principaux"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            paddingTop: 8,
            borderTop: "1px solid rgba(216, 213, 200, 0.6)",
          }}
        >
          <DrawerLink href="/sitters" label="Trouver un sitter" onNavigate={() => setOpen(false)} />
          <DrawerLink href="/#how" label="Comment ça marche" onNavigate={() => setOpen(false)} />
          <DrawerLink href="/inscription?role=sitter" label="Devenir sitter" onNavigate={() => setOpen(false)} />
          <DrawerLink href="/aide" label="Aide" onNavigate={() => setOpen(false)} />
        </nav>

        <div style={{ flex: 1 }} />

        <div
          style={{
            paddingTop: 12,
            borderTop: "1px solid rgba(216, 213, 200, 0.6)",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--ink-500)",
          }}
        >
          <Link href="/cgu" onClick={() => setOpen(false)} style={{ color: "var(--ink-500)" }}>
            Conditions générales
          </Link>
          <Link
            href="/confidentialite"
            onClick={() => setOpen(false)}
            style={{ color: "var(--ink-500)" }}
          >
            Confidentialité
          </Link>
        </div>
      </aside>
    </>
  );
}

function BurgerIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}

function DrawerLink({
  href,
  label,
  onNavigate,
}: {
  href: string;
  label: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      style={{
        padding: "12px 4px",
        fontFamily: "var(--font-mono)",
        fontSize: 15,
        fontWeight: 600,
        color: "var(--ink-800)",
        textDecoration: "none",
        borderBottom: "1px solid transparent",
        transition: "color 180ms ease",
      }}
    >
      {label}
    </Link>
  );
}
