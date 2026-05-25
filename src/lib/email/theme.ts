/**
 * Design tokens shared across every transactional email. Keep values inline-
 * friendly (hex, px) so they paste straight into the `style` prop - email
 * clients strip stylesheets and CSS variables.
 */

export const colors = {
  text: "#1a1a1a",
  muted: "#666666",
  mutedStrong: "#888888",
  mutedSubtle: "#999999",
  border: "#e6e6e6",
  primary: "#3C582E",
  primaryAccent: "#2E7D5B",
  whatsapp: "#25D366",
  noteBg: "#FFF5F3",
  bodyBg: "#ffffff",
  pageBg: "#f6f5f1",
} as const;

export const fonts = {
  body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
} as const;

export const spacing = {
  containerMaxWidth: 560,
} as const;

export const radii = {
  pill: 999,
  box: 12,
} as const;
