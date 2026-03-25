/**
 * Jio Brand Design Tokens for React / Web Apps
 *
 * VERIFIED from jio.com live site (March 2026):
 *   - JIO_BLUE (#0F3CC9) — confirmed as --color-blue-100 across jio.com
 *   - JIO_RED (#DA2441) — confirmed from live logo SVG
 *   - Font: JioType (Monotype, proprietary) — real files in assets/fonts/jiotype/
 *   - Fallback: Nunito (Google Fonts)
 *
 * NOTE: Older brand references cite #005AAC — that was the PREVIOUS brand blue.
 *
 * APPROXIMATE (sampled from public materials, not official guidelines):
 *   - Extended palette colors
 */

// ── Verified Primary (current brand, March 2026) ──
export const JIO_BLUE = "#0F3CC9";
export const JIO_RED = "#DA2441";
export const WHITE = "#FFFFFF";

// ── Legacy colors (pre-rebrand, still valid for Pantone/print) ──
export const JIO_BLUE_LEGACY = "#005AAC";
export const JIO_RED_LEGACY = "#FF0000";

// ── Extended Palette (APPROXIMATE — "Colours of India") ──
export const SAFFRON = "#FF6F00";
export const MAGENTA = "#D9008D";
export const GREEN = "#00C853";
export const TEAL = "#00BCD4";
export const PURPLE = "#7B1FA2";
export const GOLD = "#FFD600";
export const SKY_BLUE = "#29B6F6";
export const CORAL = "#FF7043";

// ── JDS Design System tokens (from jio.com CSS) ──
export const BLACK = "#141414";
export const GREY_90 = "rgba(0,0,0,0.65)";
export const FOCUS_BLUE = "#005fcc";
export const LIGHT_BG = "#E7EBF8";

// ── Backgrounds ──
export const DEEP_BLUE = "#0a2885";
export const LIGHT_TINT = "#E7EBF8";
export const OFF_WHITE = "#FAFAFA";
export const CHARCOAL = "#141414";

// ── Chart series — use for Recharts, Chart.js, D3, Nivo, etc. ──
export const CHART_COLORS = [
  JIO_BLUE, SAFFRON, MAGENTA, GREEN, TEAL, PURPLE, GOLD, CORAL
];

// ── Typography ──
export const FONT_STACK = "'JioType', 'Nunito', sans-serif";
export const FONT_STACK_FALLBACK = "'Nunito', 'Varela Round', 'Poppins', Arial, sans-serif";
export const GOOGLE_FONTS_URL = "https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap";

// ── Spacing & Shape ──
export const BORDER_RADIUS = "8px";
export const LETTER_SPACING = "0.02em";

// ── Complete theme object for styled-components / Emotion / CSS-in-JS ──
export const jioTheme = {
  colors: {
    primary: JIO_BLUE,
    primaryDark: DEEP_BLUE,
    primaryLight: LIGHT_TINT,
    secondary: JIO_RED,
    background: OFF_WHITE,
    surface: WHITE,
    text: {
      heading: JIO_BLUE,
      body: CHARCOAL,
      caption: GREY_90,
    },
    border: "#E0E0E0",
    india: {
      saffron: SAFFRON,
      magenta: MAGENTA,
      green: GREEN,
      teal: TEAL,
      purple: PURPLE,
      gold: GOLD,
      sky: SKY_BLUE,
      coral: CORAL,
    },
    chart: CHART_COLORS,
  },
  fonts: {
    body: FONT_STACK,
    heading: FONT_STACK,
    fallback: FONT_STACK_FALLBACK,
    googleFontsUrl: GOOGLE_FONTS_URL,
  },
  radii: {
    sm: "4px",
    md: BORDER_RADIUS,
    lg: "12px",
    pill: "100px",
  },
  letterSpacing: LETTER_SPACING,
};

// ── Tailwind CSS color config (paste into tailwind.config.js) ──
export const tailwindJioColors = {
  jio: {
    blue: JIO_BLUE,
    red: JIO_RED,
    deep: DEEP_BLUE,
    tint: LIGHT_TINT,
    saffron: SAFFRON,
    magenta: MAGENTA,
    green: GREEN,
    teal: TEAL,
    purple: PURPLE,
    gold: GOLD,
    sky: SKY_BLUE,
    coral: CORAL,
  },
};
