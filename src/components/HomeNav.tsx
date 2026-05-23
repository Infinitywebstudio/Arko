"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOutAction } from "@/lib/auth/actions";
import type { NavUser } from "@/lib/auth/helpers";
import { UserMenu } from "@/components/account/UserMenu";

/**
 * Floating glass pill nav for the marketing pages. Always opaque (frosted
 * white), detached from the top edge with a margin, sits over the hero on
 * desktop. Mobile (< 860px) collapses to burger + person icon and opens the
 * existing left-side drawer.
 *
 * The active route gets a solid white pastille so the user always knows
 * where they are in the site.
 */
const NAV_LINKS: Array<{ href: string; label: string }> = [
  { href: "/", label: "Accueil" },
  { href: "/sitters", label: "Trouver un sitter" },
  { href: "/comment-ca-marche", label: "Comment ça marche" },
  { href: "/inscription?role=sitter", label: "Devenir sitter" },
  { href: "/aide", label: "Aide" },
];

/** When `user` is set the visitor is authenticated: the desktop auth CTAs are
 *  replaced by the shared UserMenu dropdown, the mobile icon points at their
 *  space, and the drawer shows "Mon espace" + logout. Resolved server-side
 *  (navUserFrom) by the page rendering HomeNav. */
export function HomeNav({ user }: { user?: NavUser | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

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

  const isActive = (href: string) => {
    const base = href.split("?")[0]!;
    if (base === "/") return pathname === "/";
    return pathname === base || pathname.startsWith(base + "/");
  };

  return (
    <>
      <nav
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
          {/* Left group - flex:1 so the center links stay visually centered
              regardless of the side groups' content widths. */}
          <div
            style={{
              flex: "1 1 0",
              display: "flex",
              alignItems: "center",
              gap: 4,
              minWidth: 0,
            }}
          >
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
                borderRadius: 999,
                background: "transparent",
                cursor: "pointer",
                color: "var(--ink-800)",
              }}
            >
              <BurgerIcon color="currentColor" />
            </button>
            <Link
              href="/"
              style={{
                fontFamily: "var(--font-brand), system-ui, sans-serif",
                fontSize: 26,
                letterSpacing: "0.02em",
                color: "var(--coral-700)",
                lineHeight: 1,
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
              gap: 2,
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            {NAV_LINKS.map((l) => {
              const active = isActive(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
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
                  {l.label}
                </Link>
              );
            })}
          </div>
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
            {/* Mobile-only auth shortcut on the right edge of the pill.
                Hidden ≥ 860px (see `.home-nav-person` in globals.css).
                Logged-in visitors get a compact UserMenu (same dropdown as
                desktop); logged-out get a plain link to /connexion. */}
            {user ? (
              <div className="home-nav-person" style={{ display: "none" }}>
                <UserMenu
                  fullName={user.fullName}
                  email={user.email}
                  avatarUrl={user.avatarUrl}
                  settingsHref={user.settingsHref}
                  profileHref={user.profileHref}
                  compact
                />
              </div>
            ) : (
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
                  background: "transparent",
                  color: "var(--ink-800)",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20a8 8 0 0 1 16 0" />
                </svg>
              </Link>
            )}
            <div
              className="home-nav-ctas"
              style={{ display: "flex", gap: 8, alignItems: "center" }}
            >
              {user ? (
                <UserMenu
                  fullName={user.fullName}
                  email={user.email}
                  avatarUrl={user.avatarUrl}
                  settingsHref={user.settingsHref}
                  profileHref={user.profileHref}
                />
              ) : (
                <>
                  <Link
                    href="/connexion"
                    className="btn btn-ghost btn-sm"
                    style={{ color: "var(--ink-800)" }}
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/inscription"
                    className="btn btn-primary btn-sm btn-pill"
                  >
                    S&apos;inscrire
                  </Link>
                </>
              )}
            </div>
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

        {/* CTAs first - Uber Eats pattern, the most actionable items at the top */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {user ? (
            <>
              <Link
                href={user.spaceHref}
                className="btn btn-primary"
                onClick={() => setOpen(false)}
                style={{ height: 48, width: "100%" }}
              >
                Mon espace
              </Link>
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
            </>
          ) : (
            <>
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
            </>
          )}
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
          <DrawerLink href="/comment-ca-marche" label="Comment ça marche" onNavigate={() => setOpen(false)} />
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
