/**
 * Innerarc design tokens. Calm / wellness, not clinical.
 * Keep hex values in sync with tailwind.config.js + global.css variables.
 */

export type ThemeColors = {
  background: string;
  surface: string;
  elevated: string;
  text: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  border: string;
  white: string;
  success: string;
  successMuted: string;
  warning: string;
  warningMuted: string;
  danger: string;
  dangerMuted: string;
  neutral: string;
};

/** Light palette — Module 12 keep-all except blue accent swap. */
export const lightColors: ThemeColors = {
  background: "#F6F4F1",
  surface: "#EFECE8",
  elevated: "#FFFFFF",
  text: "#2C2A28",
  textMuted: "#6F6B66",
  accent: "#3F63C4",
  accentSoft: "#D8E2F7",
  border: "#E0DCD6",
  white: "#FFFFFF",
  success: "#5F7A68",
  successMuted: "#E4EDE6",
  warning: "#B0894F",
  warningMuted: "#F3ECDD",
  danger: "#8B3A3A",
  dangerMuted: "#F3E6E6",
  neutral: "#9A958F",
};

/**
 * Dark palette — Module 14.
 * Border/neutral derived muted from surface/tertiary; no neon.
 */
export const darkColors: ThemeColors = {
  background: "#15171B",
  surface: "#1E2126",
  elevated: "#262A31",
  text: "#F2F3F5",
  textMuted: "#9AA0A8",
  accent: "#3F6FD0",
  accentSoft: "#223652",
  border: "#32363E",
  white: "#FFFFFF",
  success: "#5FA98C",
  successMuted: "#1E2E28",
  warning: "#D3A968",
  warningMuted: "#2E2A1F",
  danger: "#D08080",
  dangerMuted: "#2E2020",
  neutral: "#8B9199",
};

/** @deprecated Prefer useTheme().colors — defaults to light for non-React callers. */
export const colors: ThemeColors = lightColors;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
} as const;

export function getElevation(palette: ThemeColors) {
  return {
    none: {
      shadowColor: "transparent",
      shadowOpacity: 0,
      shadowRadius: 0,
      shadowOffset: { width: 0, height: 0 },
      elevation: 0,
    },
    1: {
      shadowColor: palette.text,
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    2: {
      shadowColor: palette.text,
      shadowOpacity: 0.1,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
  } as const;
}

export const elevation = getElevation(lightColors);

export function getTypography(palette: ThemeColors) {
  return {
    display: {
      fontSize: 28,
      fontWeight: "600" as const,
      color: palette.text,
      lineHeight: 34,
    },
    title: {
      fontSize: 28,
      fontWeight: "600" as const,
      color: palette.text,
      lineHeight: 34,
    },
    heading: {
      fontSize: 20,
      fontWeight: "600" as const,
      color: palette.text,
      lineHeight: 26,
    },
    body: {
      fontSize: 16,
      fontWeight: "400" as const,
      color: palette.text,
      lineHeight: 24,
    },
    caption: {
      fontSize: 14,
      fontWeight: "400" as const,
      color: palette.textMuted,
      lineHeight: 20,
    },
    muted: {
      fontSize: 14,
      fontWeight: "400" as const,
      color: palette.textMuted,
      lineHeight: 20,
    },
    numeral: {
      fontSize: 22,
      fontWeight: "700" as const,
      color: palette.text,
      lineHeight: 28,
    },
  };
}

export const typography = getTypography(lightColors);

export type ThemePreference = "system" | "light" | "dark";
