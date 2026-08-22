import { PropsWithChildren, ReactNode } from "react";
import { Image, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { AnimatedSection } from "../motion/AnimatedSection";
import { ContentContainer } from "../layout/ContentContainer";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { AUTH_HERO, BRAND } from "../../marketing/landingAssets";
import { useTheme } from "../../ThemeProvider";
import { AppText } from "../ui/AppText";
import { Card } from "../ui/Card";

type AuthShellProps = PropsWithChildren<{
  title: string;
  subtitle: string;
  footer?: ReactNode;
}>;

function AuthHeroPanel() {
  const { isDark } = useTheme();
  const { isDesktop } = useBreakpoint();

  if (!isDesktop) {
    return (
      <LinearGradient
        colors={
          isDark
            ? [BRAND.heroDarkMid, BRAND.heroDarkStart]
            : [BRAND.heroLightMid, BRAND.heroLightStart]
        }
        className="overflow-hidden rounded-2xl"
      >
        <Image
          source={{ uri: AUTH_HERO }}
          style={{ width: "100%", height: 168 }}
          resizeMode="cover"
          accessibilityLabel="Innerarc wellness dashboard"
        />
      </LinearGradient>
    );
  }

  return (
    <View
      className="min-h-[520px] flex-1 overflow-hidden rounded-2xl"
      style={{ minHeight: 520 }}
    >
      <LinearGradient
        colors={[BRAND.heroDarkMid, BRAND.heroDarkStart, "#000000"]}
        className="flex-1 justify-center p-xl"
      >
        <AppText variant="wordmark" style={{ color: BRAND.fluorescent }}>
          Innerarc
        </AppText>
        <AppText variant="title" className="mt-lg font-extrabold text-white">
          Your wellness, accelerated.
        </AppText>
        <AppText variant="body" className="mt-sm leading-6 text-white/70">
          Meals, training, wearables, and coach — one native-feeling dashboard.
        </AppText>
        <Image
          source={{ uri: AUTH_HERO }}
          style={{ width: "100%", height: 240, marginTop: 28 }}
          resizeMode="contain"
          accessibilityLabel="Innerarc app preview"
        />
      </LinearGradient>
    </View>
  );
}

export function AuthShell({ title, subtitle, footer, children }: AuthShellProps) {
  const { isDesktop } = useBreakpoint();

  const formCard = (
    <Card variant="elevated" className="px-lg py-lg">
      <AppText variant="overline" muted>
        Secure sign-in
      </AppText>
      <AppText variant="heading" className="mt-sm font-extrabold">
        {title}
      </AppText>
      <AppText variant="body" muted className="mb-lg mt-sm leading-6">
        {subtitle}
      </AppText>
      {children}
    </Card>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="grow px-lg pb-xl pt-lg"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ContentContainer width="wide" align="center" className="w-full">
          {isDesktop ? (
            <View className="w-full flex-row items-stretch gap-xl">
              <AnimatedSection className="min-w-0 flex-1" direction="down">
                <AuthHeroPanel />
              </AnimatedSection>
              <AnimatedSection delay={80} className="min-w-0 flex-1 justify-center">
                {formCard}
                {footer ? <View className="mt-lg items-center">{footer}</View> : null}
              </AnimatedSection>
            </View>
          ) : (
            <View className="w-full gap-lg">
              <AnimatedSection direction="down">
                <AppText variant="wordmark" accent>
                  Innerarc
                </AppText>
              </AnimatedSection>
              <AnimatedSection delay={50}>
                <AuthHeroPanel />
              </AnimatedSection>
              <AnimatedSection delay={100}>{formCard}</AnimatedSection>
              {footer ? (
                <AnimatedSection delay={140} className="items-center">
                  {footer}
                </AnimatedSection>
              ) : null}
            </View>
          )}
        </ContentContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
