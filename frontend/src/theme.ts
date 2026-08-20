/**
 * Innerarc design tokens. Calm / wellness, not clinical.
 * Keep hex values in sync with tailwind.config.js theme.extend.
 */
export const colors = {
  background: "#F6F4F1",
  surface: "#EFECE8",
  text: "#2C2A28",
  textMuted: "#6F6B66",
  accent: "#4A7C74",
  accentSoft: "#D7E4E1",
  border: "#E0DCD6",
  white: "#FFFFFF",
  success: "#5F7A68",
  successMuted: "#E4EDE6",
  warning: "#B0894F",
  warningMuted: "#F3ECDD",
  danger: "#8B3A3A",
  dangerMuted: "#F3E6E6",
  neutral: "#9A958F",
} as const;

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

export const elevation = {
  none: {
    shadowColor: "transparent",
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  1: {
    shadowColor: "#2C2A28",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  2: {
    shadowColor: "#2C2A28",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
} as const;

export const typography = {
  display: {
    fontSize: 28,
    fontWeight: "600" as const,
    color: colors.text,
    lineHeight: 34,
  },
  title: {
    fontSize: 28,
    fontWeight: "600" as const,
    color: colors.text,
    lineHeight: 34,
  },
  heading: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: colors.text,
    lineHeight: 26,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    color: colors.text,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: "400" as const,
    color: colors.textMuted,
    lineHeight: 20,
  },
  muted: {
    fontSize: 14,
    fontWeight: "400" as const,
    color: colors.textMuted,
    lineHeight: 20,
  },
  numeral: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: colors.text,
    lineHeight: 28,
  },
};
