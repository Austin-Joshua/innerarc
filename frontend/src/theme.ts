export const colors = {
  background: "#F6F4F1",
  surface: "#EFECE8",
  text: "#2C2A28",
  textMuted: "#6F6B66",
  accent: "#4A7C74",
  accentSoft: "#D7E4E1",
  border: "#E0DCD6",
  white: "#FFFFFF",
} as const;

export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const typography = {
  title: {
    fontSize: 28,
    fontWeight: "600" as const,
    color: colors.text,
  },
  heading: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: colors.text,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    color: colors.text,
  },
  muted: {
    fontSize: 14,
    fontWeight: "400" as const,
    color: colors.textMuted,
  },
  numeral: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: colors.text,
  },
};
