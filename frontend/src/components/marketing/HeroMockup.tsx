import { Image, View } from "react-native";

import { FloatAnimation } from "./FloatAnimation";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { useTheme } from "../../ThemeProvider";
import {
  MOCKUP_DESKTOP,
  MOCKUP_MOBILE,
  MOCKUP_TABLET,
  BRAND,
} from "../../marketing/landingAssets";

export function HeroMockup() {
  const { tier, width } = useBreakpoint();
  const { isDark } = useTheme();

  const uri =
    tier === "desktop"
      ? MOCKUP_DESKTOP
      : tier === "tablet"
        ? MOCKUP_TABLET
        : MOCKUP_MOBILE;

  const maxW =
    tier === "desktop"
      ? Math.min(720, width - 48)
      : tier === "tablet"
        ? Math.min(520, width - 48)
        : Math.min(260, width - 48);

  const height =
    tier === "desktop" ? 300 : tier === "tablet" ? 240 : Math.min(400, width * 1.05);

  return (
    <FloatAnimation className="w-full items-center">
      <View
        className="overflow-hidden rounded-2xl"
        style={{
          width: maxW,
          maxWidth: "100%",
          shadowColor: isDark ? BRAND.fluorescent : BRAND.primary,
          shadowOpacity: 0.28,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 12 },
          elevation: 10,
        }}
      >
        <Image
          source={{ uri }}
          style={{ width: maxW, height, maxWidth: "100%" }}
          resizeMode="contain"
          accessibilityLabel="Innerarc app preview"
        />
      </View>
    </FloatAnimation>
  );
}
