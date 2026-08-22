import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Image, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { HeroMockup } from "../components/marketing/HeroMockup";
import { LandingNav } from "../components/marketing/LandingNav";
import { MarketingSection } from "../components/marketing/MarketingSection";
import { ActionStack } from "../components/layout/ActionStack";
import { ResponsiveGrid } from "../components/layout/ResponsiveGrid";
import { AnimatedSection } from "../components/motion/AnimatedSection";
import { useBreakpoint } from "../hooks/useBreakpoint";
import {
  BRAND,
  MOCKUP_DESKTOP,
  MOCKUP_MOBILE,
  MOCKUP_TABLET,
  STATS,
} from "../marketing/landingAssets";
import { useTheme } from "../ThemeProvider";
import { RootStackParamList } from "../navigation/types";
import { AppText, Button, Card } from "../components/ui";

type Nav = NativeStackNavigationProp<RootStackParamList, "Landing">;

const FEATURES = [
  {
    icon: "nutrition-outline" as const,
    title: "Smart meal logging",
    body: "Snap a photo — calories, protein, and macros estimated in seconds.",
    accent: BRAND.primaryBright,
  },
  {
    icon: "barbell-outline" as const,
    title: "Structured training",
    body: "Follow workouts and multi-week programs matched to your equipment.",
    accent: BRAND.fluorescent,
  },
  {
    icon: "pulse-outline" as const,
    title: "Wearable vitals",
    body: "Steps, heart rate, sleep, and blood pressure synced to Home.",
    accent: BRAND.primary,
  },
  {
    icon: "chatbubble-ellipses-outline" as const,
    title: "Coach that reads your week",
    body: "Ask questions grounded in your real logs — not generic tips.",
    accent: "#0284C7",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Set your profile",
    body: "Goals, body stats, and equipment — we calibrate targets for you.",
  },
  {
    n: "02",
    title: "Log daily activity",
    body: "Meals by photo, workouts from the library, vitals from your watch.",
  },
  {
    n: "03",
    title: "Review & improve",
    body: "Rings, weekly trends, and coach insights show what to do next.",
  },
];

export default function LandingScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, isDark } = useTheme();
  const { isDesktop, isTablet, tier, width } = useBreakpoint();

  const heroColors = (
    isDark
      ? [BRAND.heroDarkStart, BRAND.heroDarkMid, BRAND.heroDarkEnd]
      : [BRAND.heroLightStart, BRAND.heroLightMid, BRAND.heroLightEnd]
  ) as [string, string, string];

  const showcaseUri =
    tier === "desktop"
      ? MOCKUP_DESKTOP
      : tier === "tablet"
        ? MOCKUP_TABLET
        : MOCKUP_MOBILE;

  const showcaseW = isDesktop
    ? Math.min(680, width - 48)
    : isTablet
      ? Math.min(480, width - 48)
      : Math.min(280, width - 48);

  const showcaseH = isDesktop ? 300 : isTablet ? 240 : 360;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <LandingNav />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero — nav is above in document flow, no spacer overlap */}
        <LinearGradient colors={heroColors} className="w-full">
          <View className="mx-auto w-full max-w-wide px-lg pb-xxl pt-xl">
            <View
              className={
                isDesktop
                  ? "flex-row items-center gap-xxl"
                  : "w-full"
              }
            >
              <AnimatedSection className={isDesktop ? "min-w-0 flex-1" : "w-full"}>
                <View
                  className="mb-lg self-start rounded-full px-md py-xs"
                  style={{
                    backgroundColor: isDark ? BRAND.glowDark : BRAND.glowLight,
                  }}
                >
                  <AppText variant="overline" style={{ color: colors.accent }}>
                    Wellness acceleration platform
                  </AppText>
                </View>

                <AppText
                  variant="display"
                  className="mb-md font-extrabold"
                  style={{
                    fontSize: isDesktop ? 44 : 32,
                    lineHeight: isDesktop ? 52 : 38,
                  }}
                >
                  Nutrition, training, and progress — one calm dashboard.
                </AppText>

                <AppText variant="body" muted className="mb-xl max-w-prose leading-7">
                  Innerarc brings meals, workouts, wearable vitals, and an AI coach
                  into one responsive experience — built to feel native on every device.
                </AppText>

                <ActionStack align={isDesktop ? "start" : "center"}>
                  <Button
                    label="Get started free"
                    onPress={() => navigation.navigate("SignUp")}
                    className="w-full"
                  />
                  <Button
                    label="Sign in"
                    variant="secondary"
                    onPress={() => navigation.navigate("Login")}
                    className="mt-sm w-full"
                  />
                </ActionStack>
              </AnimatedSection>

              {isDesktop ? (
                <AnimatedSection delay={100} className="min-w-0 flex-1 items-end">
                  <HeroMockup />
                </AnimatedSection>
              ) : null}
            </View>

            {!isDesktop ? (
              <AnimatedSection delay={120} className="mt-xxl w-full items-center">
                <HeroMockup />
              </AnimatedSection>
            ) : null}
          </View>
        </LinearGradient>

        {/* Stats */}
        <MarketingSection compact className="border-y border-border bg-surface">
          <View
            className={
              isDesktop
                ? "flex-row items-start justify-between gap-lg"
                : "gap-xl"
            }
          >
            {STATS.map((s, i) => (
              <AnimatedSection
                key={s.label}
                delay={40 + i * 40}
                className={isDesktop ? "min-w-0 flex-1 items-center" : "items-center"}
              >
                <AppText variant="display" accent className="font-extrabold">
                  {s.value}
                </AppText>
                <AppText variant="caption" muted className="mt-xs text-center">
                  {s.label}
                </AppText>
              </AnimatedSection>
            ))}
          </View>
        </MarketingSection>

        {/* Features */}
        <MarketingSection
          centered
          header={
            <AnimatedSection className="mb-xl w-full items-center">
              <AppText variant="overline" muted>
                Platform
              </AppText>
              <AppText variant="title" className="mt-sm text-center font-extrabold">
                Everything you need to move forward
              </AppText>
              <AppText variant="body" muted className="mt-md max-w-prose text-center leading-6">
                Four pillars — logging, training, vitals, and coaching — unified
                under one green design system.
              </AppText>
            </AnimatedSection>
          }
        >
          <ResponsiveGrid desktopCols={4} gapClassName="gap-md" equalWidth>
            {FEATURES.map((f, i) => (
              <AnimatedSection key={f.title} delay={80 + i * 60}>
                <Card variant="elevated" interactive className="h-full p-lg">
                  <View
                    className="mb-md self-start rounded-xl p-sm"
                    style={{ backgroundColor: `${f.accent}22` }}
                  >
                    <Ionicons name={f.icon} size={24} color={f.accent} />
                  </View>
                  <AppText variant="subhead" className="mb-xs font-bold">
                    {f.title}
                  </AppText>
                  <AppText variant="caption" muted className="leading-5">
                    {f.body}
                  </AppText>
                </Card>
              </AnimatedSection>
            ))}
          </ResponsiveGrid>
        </MarketingSection>

        {/* Responsive showcase */}
        <LinearGradient
          colors={
            isDark ? ["#0A1F0A", "#000000"] : ["#ECFDF5", "#F0FDF4", "#FFFFFF"]
          }
        >
          <MarketingSection>
            <View
              className={
                isTablet
                  ? "flex-row items-center gap-xxl"
                  : "w-full"
              }
            >
              <AnimatedSection className={isTablet ? "min-w-0 flex-1" : "mb-xl w-full"}>
                <AppText variant="overline" muted>
                  Responsive by design
                </AppText>
                <AppText variant="title" className="mb-md mt-sm font-extrabold">
                  Built for phone, tablet, and desktop
                </AppText>
                <AppText variant="body" muted className="leading-7">
                  Sidebar on wide screens. Tabs and drawer on mobile. Rings, weekly
                  calories, and health cards reflow without overlapping.
                </AppText>
              </AnimatedSection>
              <AnimatedSection
                delay={80}
                className={isTablet ? "min-w-0 flex-1 items-center" : "items-center"}
              >
                <Image
                  source={{ uri: showcaseUri }}
                  style={{ width: showcaseW, height: showcaseH, maxWidth: "100%" }}
                  resizeMode="contain"
                  accessibilityLabel="Innerarc responsive preview"
                />
              </AnimatedSection>
            </View>
          </MarketingSection>
        </LinearGradient>

        {/* How it works */}
        <MarketingSection
          header={
            <AnimatedSection className="mb-xl">
              <AppText variant="overline" muted>
                How it works
              </AppText>
              <AppText variant="title" className="mt-sm font-extrabold">
                Three steps to your first insight
              </AppText>
            </AnimatedSection>
          }
        >
          <ResponsiveGrid desktopCols={3} gapClassName="gap-md" equalWidth>
            {STEPS.map((s, i) => (
              <AnimatedSection key={s.n} delay={60 + i * 70}>
                <Card
                  variant="elevated"
                  className="h-full border-l-[3px] border-l-accent p-lg"
                >
                  <AppText
                    variant="display"
                    accent
                    className="mb-sm font-extrabold opacity-40"
                  >
                    {s.n}
                  </AppText>
                  <AppText variant="subhead" className="mb-xs font-bold">
                    {s.title}
                  </AppText>
                  <AppText variant="caption" muted className="leading-5">
                    {s.body}
                  </AppText>
                </Card>
              </AnimatedSection>
            ))}
          </ResponsiveGrid>
        </MarketingSection>

        {/* CTA */}
        <MarketingSection className="pb-xxl">
          <AnimatedSection>
            <LinearGradient
              colors={
                isDark
                  ? [BRAND.primaryDark, "#000000"]
                  : [BRAND.primaryBright, BRAND.primary]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-2xl p-xl"
              style={{
                shadowColor: isDark ? BRAND.fluorescent : BRAND.primary,
                shadowOpacity: 0.3,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 10 },
                elevation: 8,
              }}
            >
              <AppText variant="title" className="font-extrabold text-white">
                Ready to accelerate your wellness?
              </AppText>
              <AppText variant="body" className="mb-lg mt-sm leading-6 text-white/90">
                Free to try on web and Android. Sync devices, log your first meal,
                and see your rings fill in.
              </AppText>
              <ActionStack align="start">
                <Button
                  label="Create free account"
                  onPress={() => navigation.navigate("SignUp")}
                  variant="secondary"
                  className="min-w-[200px] border-white bg-white"
                />
              </ActionStack>
            </LinearGradient>
          </AnimatedSection>

          <AnimatedSection delay={60} className="mt-xl items-center">
            <AppText variant="caption" muted>
              © {new Date().getFullYear()} Innerarc
            </AppText>
          </AnimatedSection>
        </MarketingSection>
      </ScrollView>
    </SafeAreaView>
  );
}
