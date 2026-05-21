import type { ReactNode } from "react";

// The Arko dog mascot and the Paw mark were removed (brand direction: no
// mascot). Avatar fallbacks now use the Initials component; this module keeps
// only the utility icon set used across the UI.

export type IconName =
  | "pin" | "clock" | "star" | "shield" | "search" | "arrow" | "arrowLeft"
  | "close" | "check" | "heart" | "user" | "calendar" | "menu" | "wallet"
  | "message" | "lock" | "plus" | "minus" | "info" | "bell" | "filter" | "phone";

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export function Icon({ name, size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  const base = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const paths: Record<IconName, ReactNode> = {
    pin: (<><path d="M12 21s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12Z" /><circle cx="12" cy="9" r="2.5" /></>),
    clock: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
    star: <path d="M12 3l2.7 5.6 6.3.9-4.5 4.4 1 6.1-5.5-2.9-5.5 2.9 1-6.1L3 9.5l6.3-.9Z" />,
    shield: (<><path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6l8-3Z" /><path d="M9 12l2 2 4-4" /></>),
    search: (<><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>),
    arrow: (<><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></>),
    arrowLeft: (<><path d="M19 12H5" /><path d="M11 6l-6 6 6 6" /></>),
    close: (<><path d="M6 6l12 12" /><path d="M18 6L6 18" /></>),
    check: <path d="M5 12l5 5 9-11" />,
    heart: <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.5-7 10-7 10Z" />,
    user: (<><circle cx="12" cy="8" r="4" /><path d="M4 20a8 8 0 0 1 16 0" /></>),
    calendar: (<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>),
    menu: (<><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>),
    wallet: (<><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M3 10h18" /><circle cx="17" cy="15" r="1.2" fill={color} /></>),
    message: <path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2Z" />,
    lock: (<><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>),
    plus: (<><path d="M12 5v14" /><path d="M5 12h14" /></>),
    minus: <path d="M5 12h14" />,
    info: (<><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><circle cx="12" cy="8" r="1" fill={color} /></>),
    bell: (<><path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4Z" /><path d="M10 20a2 2 0 0 0 4 0" /></>),
    filter: <path d="M4 5h16l-6 8v5l-4 2v-7Z" />,
    phone: <path d="M5 4h3l2 5-2 1a10 10 0 0 0 6 6l1-2 5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />,
  };
  return <svg {...base}>{paths[name]}</svg>;
}
