"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOutAction } from "@/lib/auth/actions";

export type DashboardNavLink = {
  href: string;
  label: string;
};

type Props = {
  /** "Client" or "Sitter" — rendered as the pill next to the wordmark. */
  roleLabel: string;
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
  roleLabel,
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Closing on navigation is handled by per-link onClick (below) instead of
  // an effect on `pathname`, because setting state in an effect triggers
  // the react-hooks/set-state-in-effect lint and React's cascading-render
  // warning. Same-route clicks (clicking the link for the current page)
  // never fire onClick-after-pathname-change anyway — they fire on click,
  // which is what we want.
  const closeAll = useCallback(() => {
    setDrawerOpen(false);
    setMenuOpen(false);
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

  // Escape closes drawer and dropdown.
  useEffect(() => {
    if (!drawerOpen && !menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawerOpen(false);
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen, menuOpen]);

  // Click outside closes the desktop dropdown.
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  const firstName = fullName.trim().split(/\s+/)[0] || fullName;
  const initials = getInitials(fullName);
  // Pick the single most specific nav match so the root link (e.g. "/compte")
  // doesn't light up on a sub-route ("/compte/bookings") in addition to the
  // child link.
  const activeHref = pickActiveHref(pathname, navLinks);

  return (
    <>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(247, 244, 236, 0.85)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderBottom: "1px solid rgba(216, 213, 200, 0.6)",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          {/* Mobile hamburger — hidden ≥ 860px via CSS. */}
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
              borderRadius: 10,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--ink-700)",
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
              gap: 10,
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-brand), system-ui, sans-serif",
                fontSize: 22,
                letterSpacing: "0.02em",
                color: "var(--coral-600)",
                lineHeight: 1,
              }}
            >
              ARKO
            </span>
            <span
              className="dash-nav-badge"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--coral-700)",
                background: "var(--coral-50)",
                padding: "3px 8px",
                borderRadius: 999,
              }}
            >
              {roleLabel}
            </span>
          </Link>

          {/* Desktop nav — hidden < 860px via CSS. */}
          <nav
            className="dash-nav-links"
            aria-label={`Navigation ${roleLabel.toLowerCase()}`}
            style={{
              display: "flex",
              gap: 4,
              marginLeft: 24,
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
                  style={{
                    padding: "8px 14px",
                    borderRadius: 999,
                    color: active ? "var(--coral-700)" : "var(--ink-700)",
                    background: active ? "var(--coral-50)" : "transparent",
                    textDecoration: "none",
                    transition: "background 0.15s, color 0.15s",
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div style={{ flex: 1 }} />

          {/* Desktop user dropdown — hidden < 860px via CSS. */}
          <div
            ref={menuRef}
            className="dash-nav-user"
            style={{ position: "relative", display: "flex" }}
          >
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Ouvrir le menu utilisateur"
              onClick={() => setMenuOpen((v) => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "4px 10px 4px 4px",
                background: menuOpen ? "var(--ink-100)" : "transparent",
                border: "1px solid var(--ink-200)",
                borderRadius: 999,
                cursor: "pointer",
                transition: "background 0.15s",
              }}
            >
              <Avatar size={32} avatarUrl={avatarUrl} initials={initials} />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--ink-800)",
                  maxWidth: 120,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {firstName}
              </span>
              <ChevronIcon open={menuOpen} />
            </button>

            {menuOpen && (
              <div
                role="menu"
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  minWidth: 260,
                  background: "rgba(247, 244, 236, 0.96)",
                  backdropFilter: "blur(20px) saturate(180%)",
                  WebkitBackdropFilter: "blur(20px) saturate(180%)",
                  border: "1px solid rgba(216, 213, 200, 0.6)",
                  borderRadius: 14,
                  boxShadow: "0 12px 36px rgba(15, 19, 16, 0.14)",
                  padding: 6,
                  zIndex: 60,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    borderBottom: "1px solid rgba(216, 213, 200, 0.6)",
                    marginBottom: 6,
                  }}
                >
                  <Avatar size={40} avatarUrl={avatarUrl} initials={initials} />
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
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

                {profileHref && (
                  <MenuLink href={profileHref} icon={<UserIcon />} onNavigate={closeAll}>
                    Mon profil
                  </MenuLink>
                )}
                <MenuLink href={settingsHref} icon={<GearIcon />} onNavigate={closeAll}>
                  Paramètres
                </MenuLink>

                <div
                  style={{
                    borderTop: "1px solid rgba(216, 213, 200, 0.6)",
                    marginTop: 6,
                    paddingTop: 6,
                  }}
                >
                  <form action={signOutAction}>
                    <button
                      type="submit"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        width: "100%",
                        padding: "10px 12px",
                        background: "transparent",
                        border: "none",
                        borderRadius: 10,
                        fontFamily: "var(--font-mono)",
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--ink-700)",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <LogoutIcon />
                      Déconnexion
                    </button>
                  </form>
                </div>
              </div>
            )}
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
        aria-label={`Menu ${roleLabel.toLowerCase()}`}
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

        <form action={signOutAction}>
          <button
            type="submit"
            className="btn btn-outline"
            style={{
              width: "100%",
              height: 48,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <LogoutIcon />
            Déconnexion
          </button>
        </form>
      </aside>
    </>
  );
}

function MenuLink({
  href,
  icon,
  children,
  onNavigate,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onNavigate}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 10,
        fontFamily: "var(--font-mono)",
        fontSize: 13,
        fontWeight: 500,
        color: "var(--ink-700)",
        textDecoration: "none",
      }}
    >
      {icon}
      {children}
    </Link>
  );
}

function Avatar({
  size,
  avatarUrl,
  initials,
}: {
  size: number;
  avatarUrl?: string | null;
  initials: string;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          background: "var(--peach-200)",
        }}
      />
    );
  }
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--coral-100)",
        color: "var(--coral-700)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-mono)",
        fontSize: Math.round(size * 0.38),
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initials}
    </span>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
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

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        color: "var(--ink-500)",
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 160ms ease",
      }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20a8 8 0 0 1 16 0" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}
