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
  collar = "#2D5A3F",
  fur = "#1F2C24",
  ...rest
}: ArkoProps) {
  // Side-profile silhouette of a shepherd-style dog, head facing left to
  // echo the brand logo (vertical version). The mood adjusts ear angle and
  // eye openness; the muzzle is fixed (the logo dog is stoic on purpose).
  // Ear pivot is at its base (38, 24) so rotation looks like the ear
  // hinging on the skull, not flying off.
  const earRotate = mood === "alert" ? -8 : mood === "sleepy" ? 18 : -2;
  const eyeOpen = mood !== "sleepy";
  const tongue = mood === "happy" || mood === "waggy";
  const stroke = "#0F1310";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" {...rest}>
      {/* Neck ruff / chest tuft — sits behind the head silhouette for depth */}
      <path
        d="M68 82 Q60 90 50 89 Q42 88 38 82 L42 78 Q50 82 58 80 Z"
        fill={fur}
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
        opacity="0.9"
      />

      {/* Head silhouette: forehead → ear → top → back of neck → chest →
          throat → underchin → nose tip → top of muzzle → back to forehead.
          Sharp jaw and pointed muzzle match the brand-logo profile. */}
      <g transform={`rotate(${earRotate} 38 24)`}>
        <path
          d="M30 30
             L 38 8
             L 50 22
             C 60 24, 74 32, 82 48
             C 84 64, 78 78, 70 84
             L 50 86
             C 40 82, 32 74, 28 68
             C 22 64, 16 60, 10 58
             L 4 56
             C 6 51, 12 49, 22 48
             C 26 44, 28 38, 30 30
             Z"
          fill={fur}
          stroke={stroke}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Inner ear — slightly lighter to give the silhouette dimension */}
        <path
          d="M36 12 L 41 22 L 46 20 Z"
          fill="#7A5E3A"
          opacity="0.75"
        />
      </g>

      {/* Eye — single visible eye on the profile side. White highlight only
          when awake; sleepy mood collapses it to a stitched-line. */}
      {eyeOpen ? (
        <>
          <ellipse cx="32" cy="50" rx="2.2" ry="2.8" fill="#FFFFFF" />
          <ellipse cx="32" cy="50" rx="1.3" ry="1.8" fill={stroke} />
        </>
      ) : (
        <path
          d="M29 50 Q32 52 35 50"
          stroke="#FFFFFF"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
        />
      )}

      {/* Nose — solid dark, with a tiny highlight to read as a snout tip */}
      <ellipse cx="7" cy="55" rx="2.6" ry="2" fill={stroke} />
      <circle cx="6.2" cy="54.2" r="0.6" fill="#FFFFFF" opacity="0.6" />

      {/* Mouth — short line under the snout, opens slightly on happy/waggy */}
      {tongue ? (
        <>
          <path
            d="M9 58 Q14 60 20 59"
            stroke={stroke}
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M11 60 Q14 64 17 61 Z"
            fill={collar || "#C26A52"}
            stroke={stroke}
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <path
          d="M9 58 L 18 58"
          stroke={stroke}
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
        />
      )}

      {/* Collar — curves under the neck/chest. Tag hangs at the front. */}
      {collar && (
        <g>
          <path
            d="M28 78 Q48 92 70 84"
            stroke={collar}
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
          />
          <circle
            cx="32"
            cy="82"
            r="3"
            fill={collar}
            stroke={stroke}
            strokeWidth="1.2"
          />
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
