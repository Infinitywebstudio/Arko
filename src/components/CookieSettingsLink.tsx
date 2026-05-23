"use client";

import { openCookiePreferences } from "./CookieConsent";

export default function CookieSettingsLink({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <a
      href="#"
      className={className}
      style={style}
      onClick={(e) => {
        e.preventDefault();
        void openCookiePreferences();
      }}
    >
      Gérer les cookies
    </a>
  );
}
