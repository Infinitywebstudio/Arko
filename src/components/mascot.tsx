import type { CSSProperties, SVGProps } from "react";

export type ArkoMood = "happy" | "alert" | "sleepy" | "waggy";

type ArkoProps = {
  size?: number;
  mood?: ArkoMood;
  collar?: string;
  fur?: string;
  style?: CSSProperties;
} & Omit<SVGProps<SVGSVGElement>, "style">;

export function Arko({
  size = 80,
  mood = "happy",
  collar = "#FF5A5F",
  fur = "#F4C896",
  ...rest
}: ArkoProps) {
  const eyeY = mood === "sleepy" ? 48 : 46;
  const eyeHeight = mood === "sleepy" ? 2 : 5;
  const tongue = mood === "happy" || mood === "waggy";
  const earRotate = mood === "alert" ? -10 : 0;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" {...rest}>
      <g transform={`rotate(${earRotate} 28 30)`}>
        <path d="M18 22 Q14 38 24 44 Q32 38 30 22 Z" fill={fur} stroke="#24211F" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M22 26 Q20 34 26 38" stroke="#C98F5A" strokeWidth="2" strokeLinecap="round" fill="none" />
      </g>
      <g transform={`rotate(${-earRotate} 72 30)`}>
        <path d="M82 22 Q86 38 76 44 Q68 38 70 22 Z" fill={fur} stroke="#24211F" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M78 26 Q80 34 74 38" stroke="#C98F5A" strokeWidth="2" strokeLinecap="round" fill="none" />
      </g>

      <ellipse cx="50" cy="54" rx="30" ry="28" fill={fur} stroke="#24211F" strokeWidth="2.5" />
      <ellipse cx="50" cy="66" rx="16" ry="12" fill="#FFF0E5" stroke="#24211F" strokeWidth="2" />

      <ellipse cx="40" cy={eyeY} rx="3" ry={eyeHeight} fill="#24211F" />
      <ellipse cx="60" cy={eyeY} rx="3" ry={eyeHeight} fill="#24211F" />
      {mood !== "sleepy" && (
        <>
          <circle cx="41" cy={eyeY - 1} r="1" fill="white" />
          <circle cx="61" cy={eyeY - 1} r="1" fill="white" />
        </>
      )}

      <ellipse cx="50" cy="62" rx="4" ry="3" fill="#24211F" />

      <path d="M50 66 Q46 72 42 70" stroke="#24211F" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M50 66 Q54 72 58 70" stroke="#24211F" strokeWidth="2" strokeLinecap="round" fill="none" />
      {tongue && (
        <path d="M48 70 Q50 76 52 70 Z" fill={collar} stroke="#24211F" strokeWidth="1.5" strokeLinejoin="round" />
      )}

      {collar && (
        <g>
          <path d="M28 78 Q50 86 72 78" stroke={collar} strokeWidth="5" strokeLinecap="round" fill="none" />
          <circle cx="50" cy="84" r="3.5" fill={collar} stroke="#24211F" strokeWidth="1.5" />
        </g>
      )}
    </svg>
  );
}

type PawProps = { size?: number; color?: string } & Omit<SVGProps<SVGSVGElement>, "color">;

export function Paw({ size = 24, color = "currentColor", ...rest }: PawProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} {...rest}>
      <ellipse cx="12" cy="15" rx="5" ry="4.5" />
      <ellipse cx="6" cy="9" rx="2" ry="2.5" />
      <ellipse cx="18" cy="9" rx="2" ry="2.5" />
      <ellipse cx="9" cy="5" rx="1.6" ry="2.2" />
      <ellipse cx="15" cy="5" rx="1.6" ry="2.2" />
    </svg>
  );
}

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
  const paths: Record<IconName, React.ReactNode> = {
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
