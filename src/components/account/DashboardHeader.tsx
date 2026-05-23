"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOutAction } from "@/lib/auth/actions";
import { Avatar, UserMenu, getInitials } from "./UserMenu";

export type DashboardNavLink = {
  href: string;
  label: string;
};

type Props = {
  /** Where the wordmark links back to inside the user's space. */
  homeHref: string;
  /** Primary nav items, rendered as a row on desktop and a stack in the drawer. */
  navLinks: DashboardNavLink[];
  /** Settings link, surfaced both in the dropdown and the drawer footer. */
  settingsHref: string;
  /** Profile link (sitter has /sitter/profil; client uses /compte/parametres). */
  profileHref?: string;
  /** Display name + email shown in the dropdown header and drawer user block. */
  fullName: string;
  email: string;
  /** Optional remote avatar URL (Supabase storage). Falls back to initials. */
  avatarUrl?: string | null;
};

const NAV_FONT: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 13,
  fontWeight: 500,
};

export function DashboardHeader({
  homeHref,
  navLinks,
  settingsHref,
  profileHref,
  fullName,
  email,
  avatarUrl,
}: Props) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Closing the drawer on navigation is handled by per-link onClick (below)
  // instead of an effect on `pathname`, because setting state in an effect
  // triggers the react-hooks/set-state-in-effect lint and React's
  // cascading-render warning. The desktop user dropdown manages its own state
  // inside UserMenu.
  const closeAll = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  // Lock body scroll while drawer is open.
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  // Escape closes the drawer (the desktop dropdown handles its own Escape).
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const initials = getInitials(fullName);
  // Pick the single most specific nav match so the root link (e.g. "/compte")
  // doesn't light up on a sub-route ("/compte/bookings") in addition to the
  // child link.
  const activeHref = pickActiveHref(pathname, navLinks);

  return (
    <>
      <header
        style={{
          position: "fixed",
          top: 16,
          left: 16,
          right: 16,
          zIndex: 50,
          margin: "0 auto",
          maxWidth: 1280,
          background: "rgba(255,255,255,0.62)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          border: "1px solid transparent",
          borderRadius: 999,
        }}
      >
        <div
          style={{
            padding: "8px 10px 8px 20px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          {/* Left group - flex:1 keeps the centered nav truly centered. */}
          <div
            style={{
              flex: "1 1 0",
              display: "flex",
              alignItems: "center",
              gap: 10,
              minWidth: 0,
            }}
          >
            {/* Mobile hamburger - hidden ≥ 860px via CSS. */}
            <button
              type="button"
              className="dash-nav-burger"
              aria-label="Ouvrir le menu"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
              style={{
                display: "none",
                width: 40,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 999,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--ink-800)",
                padding: 0,
                flexShrink: 0,
              }}
            >
              <BurgerIcon />
            </button>

            <Link
              href={homeHref}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                textDecoration: "none",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-brand), system-ui, sans-serif",
                  fontSize: 26,
                  letterSpacing: "0.02em",
                  color: "var(--coral-700)",
                  lineHeight: 1,
                }}
              >
                ARKO
              </span>
            </Link>
          </div>

          {/* Centered nav links - hidden < 860px via CSS. */}
          <nav
            className="dash-nav-links"
            aria-label="Navigation principale"
            style={{
              display: "flex",
              gap: 2,
              ...NAV_FONT,
            }}
          >
            {navLinks.map((link) => {
              const active = link.href === activeHref;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeAll}
                  aria-current={active ? "page" : undefined}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 999,
                    color: active ? "var(--ink-900)" : "var(--ink-700)",
                    background: active ? "white" : "transparent",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    transition: "background 160ms ease, color 160ms ease",
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right group - flex:1 mirrors the left for symmetric centering. */}
          <div
            style={{
              flex: "1 1 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 8,
              minWidth: 0,
            }}
          >
            {/* Desktop user dropdown - hidden < 860px via CSS. The mobile
                drawer carries the user block + logout instead. */}
            <div className="dash-nav-user" style={{ display: "flex" }}>
              <UserMenu
                fullName={fullName}
                email={email}
                avatarUrl={avatarUrl}
                settingsHref={settingsHref}
                profileHref={profileHref}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer backdrop */}
      <div
        aria-hidden={!drawerOpen}
        onClick={() => setDrawerOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 70,
          background: drawerOpen ? "rgba(15, 19, 16, 0.4)" : "transparent",
          backdropFilter: drawerOpen ? "blur(2px)" : "none",
          WebkitBackdropFilter: drawerOpen ? "blur(2px)" : "none",
          pointerEvents: drawerOpen ? "auto" : "none",
          transition: "background 220ms ease",
        }}
      />

      {/* Mobile drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu utilisateur"
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
          padding: "calc(env(safe-area-inset-top) + 20px) 20px 24px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          transform: drawerOpen ? "translateX(0)" : "translateX(-105%)",
          transition: "transform 260ms cubic-bezier(0.32, 0.72, 0, 1)",
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
              fontSize: 24,
              letterSpacing: "0.02em",
              color: "var(--coral-600)",
            }}
          >
            ARKO
          </span>
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setDrawerOpen(false)}
            style={{
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 10,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--ink-700)",
              padding: 0,
            }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* User block */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px",
            background: "rgba(255, 255, 255, 0.5)",
            border: "1px solid rgba(216, 213, 200, 0.6)",
            borderRadius: 14,
          }}
        >
          <Avatar size={44} avatarUrl={avatarUrl} initials={initials} />
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--ink-800)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {fullName}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--ink-500)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {email}
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav
          aria-label="Liens"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            paddingTop: 4,
          }}
        >
          {navLinks.map((link) => {
            const active = link.href === activeHref;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeAll}
                style={{
                  display: "block",
                  padding: "12px 14px",
                  borderRadius: 10,
                  fontFamily: "var(--font-mono)",
                  fontSize: 15,
                  fontWeight: 600,
                  color: active ? "var(--coral-700)" : "var(--ink-800)",
                  background: active ? "var(--coral-50)" : "transparent",
                  textDecoration: "none",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ flex: 1 }} />

        <form action={signOutAction} style={{ textAlign: "center", marginTop: 4 }}>
          <button
            type="submit"
            style={{
              background: "transparent",
              border: "none",
              padding: "8px 4px",
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              color: "var(--ink-600)",
              textDecoration: "underline",
              textUnderlineOffset: 4,
              cursor: "pointer",
            }}
          >
            Déconnexion
          </button>
        </form>
      </aside>
    </>
  );
}

function pickActiveHref(
  pathname: string | null,
  links: DashboardNavLink[],
): string | null {
  if (!pathname) return null;
  let best: string | null = null;
  let bestLen = -1;
  for (const { href } of links) {
    const matches = pathname === href || pathname.startsWith(href + "/");
    if (matches && href.length > bestLen) {
      best = href;
      bestLen = href.length;
    }
  }
  return best;
}

function BurgerIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}