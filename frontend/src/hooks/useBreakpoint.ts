import { useWindowDimensions } from "react-native";

/** Tailwind defaults — sm 640, md 768, lg 1024 (Module 12/14). */
const MD = 768;
const LG = 1024;

export type BreakpointTier = "mobile" | "tablet" | "desktop";

export function useBreakpoint() {
  const { width } = useWindowDimensions();
  const tier: BreakpointTier =
    width >= LG ? "desktop" : width >= MD ? "tablet" : "mobile";
  return {
    width,
    tier,
    isMobile: tier === "mobile",
    isTablet: tier === "tablet",
    isDesktop: tier === "desktop",
    isAtLeastMd: width >= MD,
    isAtLeastLg: width >= LG,
  };
}
