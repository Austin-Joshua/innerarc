import { BreakpointTier } from "../../hooks/useBreakpoint";

export const FITNESS_LAYOUT = {
  mobile: {
    ringSize: 200,
    ringStroke: 18,
    titleSize: 32,
    tabBarHeight: 62,
    tabBarRadius: 28,
    sectionCols: 1,
    gridCols: 2,
  },
  tablet: {
    ringSize: 240,
    ringStroke: 20,
    titleSize: 40,
    tabBarHeight: 48,
    tabBarRadius: 24,
    sectionCols: 2,
    gridCols: 3,
  },
  desktop: {
    ringSize: 280,
    ringStroke: 22,
    titleSize: 44,
    tabBarHeight: 0,
    tabBarRadius: 0,
    sectionCols: 3,
    gridCols: 4,
  },
} as const;

export function fitnessTokens(tier: BreakpointTier) {
  return FITNESS_LAYOUT[tier];
}

export function fitnessHPadding(tier: BreakpointTier): string {
  if (tier === "mobile") return "px-md";
  if (tier === "tablet") return "px-lg";
  return "px-xl";
}
