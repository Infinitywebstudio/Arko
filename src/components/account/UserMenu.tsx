"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { signOutAction } from "@/lib/auth/actions";

export type UserMenuProps = {
  /** Display name + email shown in the dropdown header. */
  fullName: string;
  email: string;
  /** Optional remote avatar URL (Supabase storage). Falls back to initials. */
  avatarUrl?: string | null;
  /** Settings link (client: /compte/parametres, sitter: /sitter/parametres). */
  settingsHref: string;
  /** Profile link - sitter only (/sitter/profil); clients omit it. */
  profileHref?: string;
  /** True when the pill sits over a dark hero (transparent nav). Switches
   *  text/border/chevron to a light treatment so the name stays readable. */
  onDark?: boolean;
  /** Compact trigger: 40x40 avatar-only button (no name, no chevron, no
   *  border). Used as the mobile right-side icon so logged-in visitors get
   *  the same dropdown UX as desktop instead of a one-way link. */
  compact?: boolean;
};

/**
 * Avatar + first-name pill that opens a dropdown (profile, settings, logout).
 * Shared by the dashboard header and the public marketing nav so a logged-in
 * visitor sees the exact same account control everywhere. Self-contained:
 * owns its open state, outside-click, and Escape handling.
 */
export function UserMenu({
  fullName,
  email,
  avatarUrl,
  settingsHref,
  profileHref,
  onDark = false,
  compact = false,
}: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Click outside closes the dropdown.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Escape closes the dropdown.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const firstName = fullName.trim().split(/\s+/)[0] || fullName;
  const initials = getInitials(fullName);
  const close = () => setOpen(false);

  return (
    <div ref={ref} style={{ position: "relative", display: "flex" }}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Ouvrir le menu utilisateur"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: compact ? "center" : undefined,
          gap: compact ? 0 : 10,
          width: compact ? 40 : undefined,
          height: compact ? 40 : undefined,
          padding: compact ? 0 : "4px 10px 4px 4px",
          background: open
            ? onDark
              ? "rgba(255,255,255,0.16)"
              : "var(--ink-100)"
            : "transparent",
          border: compact
            ? "none"
            : `1px solid ${onDark ? "rgba(255,255,255,0.45)" : "var(--ink-200)"}`,
          borderRadius: 999,
          cursor: "pointer",
          transition: "background 0.15s, border-color 220ms ease",
        }}
      >
        <Avatar size={compact ? 34 : 32} avatarUrl={avatarUrl} initials={initials} />
        {!compact && (
          <>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                fontWeight: 600,
                color: onDark ? "white" : "var(--ink-800)",
                maxWidth: 120,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                transition: "color 220ms ease",
              }}
            >
              {firstName}
            </span>
            <ChevronIcon open={open} onDark={onDark} />
          </>
        )}
      </button>

      {open && (
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
            <MenuLink href={profileHref} icon={<UserIcon />} onNavigate={close}>
              Mon profil
            </MenuLink>
          )}
          <MenuLink href={settingsHref} icon={<GearIcon />} onNavigate={close}>
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

/** Round avatar - remote image when available, initials fallback otherwise.
 *  Exported so the dashboard mobile drawer reuses the exact same treatment. */
export function Avatar({
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

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function ChevronIcon({ open, onDark = false }: { open: boolean; onDark?: boolean }) {
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
        color: onDark ? "rgba(255,255,255,0.8)" : "var(--ink-500)",
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 160ms ease, color 220ms ease",
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

/** Exported so the dashboard mobile drawer's logout button reuses it. */
export function LogoutIcon() {
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
