"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon, type IconName } from "@/components/mascot";

export type BottomNavTab = {
  href: string;
  /** Whether the link is "active" if the pathname starts with this prefix.
   *  Defaults to exact-match. */
  matchPrefix?: boolean;
  icon: IconName;
  label: string;
};

type Props = {
  tabs: BottomNavTab[];
};

/**
 * Mobile-only sticky bottom navigation. Hidden on viewports ≥ 768px via the
 * `.bottom-nav` CSS rule in globals.css, which also pushes a matching
 * padding-bottom onto `body` so content doesn't slip under the bar.
 *
 * The active state uses prefix-matching for nested routes (e.g. "/sitter/profil"
 * keeps "Profil" highlighted even on a deep edit page) when `matchPrefix` is
 * true on the tab; otherwise it's strict equality.
 */
export default function BottomNav({ tabs }: Props) {
  const pathname = usePathname() ?? "";

  return (
    <nav className="bottom-nav" aria-label="Navigation principale">
      {tabs.map((t) => {
        const active = t.matchPrefix
          ? pathname === t.href || pathname.startsWith(`${t.href}/`)
          : pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`bottom-nav-item${active ? " is-active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <Icon name={t.icon} size={20} />
            <span className="bottom-nav-label">{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
