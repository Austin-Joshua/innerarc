/**
 * Fluorescent green + pitch-black dark palette.
 * Light mode uses readable forest/emerald accents on soft grey.
 */
export type ThemeColors = {
  background: string;
  surface: string;
  elevated: string;
  text: string;
  textMuted: string;
  accent: string;
  accentBright: string;
  accentSoft: string;
  ringSecondary: string;
  ringStreak: string;
  ringTrack: string;
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

export const lightColors: ThemeColors = {
  background: "#FFFFFF",
  surface: "#F5F5F7",
  elevated: "#FFFFFF",
  text: "#1A1A1A",
  textMuted: "#6B7280",
  accent: "#15803D",
  accentBright: "#16A34A",
  accentSoft: "#E5E7EB",
  ringSecondary: "#0284C7",
  ringStreak: "#CA8A04",
  ringTrack: "#E5E7EB",
  border: "#E5E7EB",
  white: "#FFFFFF",
  success: "#166534",
  successMuted: "#ECFDF5",
  warning: "#B0894F",
  warningMuted: "#FEF3C7",
  danger: "#8B3A3A",
  dangerMuted: "#FEE2E2",
  neutral: "#9CA3AF",
};

/** Pitch black OLED-style with fluorescent green accent. */
export const darkColors: ThemeColors = {
  background: "#000000",
  surface: "#0A0A0A",
  elevated: "#111111",
  text: "#FFFFFF",
  textMuted: "#8A8A8A",
  accent: "#39FF14",
  accentBright: "#39FF14",
  accentSoft: "#0A1F0A",
  ringSecondary: "#00E5FF",
  ringStreak: "#FFCC00",
  ringTrack: "#1A1A1A",
  border: "#1F1F1F",
  white: "#FFFFFF",
  success: "#39FF14",
  successMuted: "#0A1F0A",
  warning: "#FFD60A",
  warningMuted: "#1F1A00",
  danger: "#FF453A",
  dangerMuted: "#2E1210",
  neutral: "#6B6B6B",
};

/** @deprecated Prefer useTheme().colors */
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
    wordmark: {
      fontSize: 32,
      fontWeight: "700" as const,
      color: palette.text,
      lineHeight: 38,
      letterSpacing: 1.2,
    },
    display: {
      fontSize: 30,
      fontWeight: "600" as const,
      color: palette.text,
      lineHeight: 36,
    },
    title: {
      fontSize: 24,
      fontWeight: "600" as const,
      color: palette.text,
      lineHeight: 30,
    },
    heading: {
      fontSize: 20,
      fontWeight: "600" as const,
      color: palette.text,
      lineHeight: 26,
    },
    subhead: {
      fontSize: 17,
      fontWeight: "600" as const,
      color: palette.text,
      lineHeight: 24,
    },
    body: {
      fontSize: 16,
      fontWeight: "400" as const,
      color: palette.text,
      lineHeight: 24,
    },
    bodyStrong: {
      fontSize: 16,
      fontWeight: "600" as const,
      color: palette.text,
      lineHeight: 24,
    },
    caption: {
      fontSize: 14,
      fontWeight: "400" as const,
      color: palette.textMuted,
      lineHeight: 20,
    },
    label: {
      fontSize: 13,
      fontWeight: "600" as const,
      color: palette.text,
      lineHeight: 18,
    },
    overline: {
      fontSize: 11,
      fontWeight: "600" as const,
      color: palette.textMuted,
      lineHeight: 14,
      letterSpacing: 0.8,
      textTransform: "uppercase" as const,
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
