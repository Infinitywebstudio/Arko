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
 */
const SCROLL_THRESHOLD = 80;

export function HomeNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > SCROLL_THRESHOLD);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const textColor = scrolled ? "var(--ink-700)" : "rgba(255,255,255,0.9)";
  const wordmarkColor = scrolled ? "var(--coral-600)" : "white";

  return (
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
          padding: "16px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              fontFamily: "var(--font-brand), system-ui, sans-serif",
              fontSize: 28,
              letterSpacing: "0.02em",
              color: wordmarkColor,
              lineHeight: 1,
              transition: "color 220ms ease",
            }}
          >
            ARKO
          </div>
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
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
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
  );
}
