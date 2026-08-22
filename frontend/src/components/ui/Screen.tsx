import { PropsWithChildren, useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable, ScrollView, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { RootStackParamList } from "../../navigation/types";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { fitnessHPadding } from "../fitness/fitnessLayout";
import { goToHome as navigateHome } from "../../navigation/navHelpers";
import { Button } from "./Button";
import { AppText } from "./AppText";
import { Card } from "./Card";

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  className?: string;
  /** Hide the legacy in-screen wordmark when app shell chrome is visible. */
  hideAppName?: boolean;
  /** Override Innerarc home-tap confirm. Default: WorkoutSession confirms. */
  confirmLeaveHome?: boolean;
}>;

const SKIP_APP_NAME = new Set(["Splash"]);
const STATIC_APP_NAME = new Set(["Login", "SignUp", "Onboarding"]);
/** Drawer/tabs routes — title bar replaces in-screen wordmark. */
const SHELL_COVERED = new Set([
  "Home",
  "LogMeal",
  "Coach",
  "Progress",
  "Workouts",
  "WorkoutLibrary",
  "WorkoutDetail",
  "ProgramDetail",
  "WearableConnect",
  "Profile",
  "Settings",
  "FoodCapture",
  "FoodResult",
  "FoodEdit",
  "FoodNutrition",
  "ProgressCapture",
  "ProgressCompare",
]);

function goHome(
  navigation: NativeStackNavigationProp<RootStackParamList>,
) {
  navigateHome(navigation);
}

function AppNameRow({
  confirmLeaveHome,
  onRequestLeave,
  hidden,
}: {
  confirmLeaveHome?: boolean;
  onRequestLeave: () => void;
  hidden?: boolean;
}) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const name = route.name;

  if (hidden || SKIP_APP_NAME.has(name) || SHELL_COVERED.has(name)) return null;

  const label = (
    <AppText variant="overline" accent>
      Innerarc
    </AppText>
  );

  if (STATIC_APP_NAME.has(name)) {
    return <View className="px-xl pb-sm pt-xs">{label}</View>;
  }

  const onPress = () => {
    const shouldConfirm =
      confirmLeaveHome ?? name === "WorkoutSession";
    if (shouldConfirm) {
      onRequestLeave();
      return;
    }
    goHome(navigation);
  };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Innerarc, back to Home"
      className="px-xl pb-sm pt-xs"
    >
      {label}
    </Pressable>
  );
}

export function Screen({
  children,
  scroll = true,
  className = "",
  hideAppName = false,
  confirmLeaveHome,
}: ScreenProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const routeName = route.name;
  const { tier, isDesktop } = useBreakpoint();
  const shellChrome = SHELL_COVERED.has(routeName);
  const hPad = shellChrome ? fitnessHPadding(tier) : "px-xl";
  const needsTopInset =
    routeName !== "Splash" && (!shellChrome || (!isDesktop && shellChrome));
  const [leaveOpen, setLeaveOpen] = useState(false);

  const body = scroll ? (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName={`${hPad} pb-xl ${className}`.trim()}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View className={`flex-1 bg-background ${hPad} ${className}`.trim()}>
      {children}
    </View>
  );

  return (
    <SafeAreaView
      className="relative flex-1 bg-background"
      edges={needsTopInset ? ["top", "bottom"] : ["bottom"]}
    >
      <AppNameRow
        confirmLeaveHome={confirmLeaveHome}
        onRequestLeave={() => setLeaveOpen(true)}
        hidden={hideAppName || shellChrome}
      />
      {body}
      {leaveOpen ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          className="absolute inset-0 z-50 items-center justify-center bg-black/50 px-xl"
        >
          <Animated.View entering={FadeIn.duration(220).delay(40)}>
          <Card variant="elevated" className="w-full">
            <AppText variant="heading">Leave workout?</AppText>
            <AppText variant="body" muted className="mb-lg mt-xs">
              Your session progress will be lost.
            </AppText>
            <Button
              label="Stay"
              variant="secondary"
              onPress={() => setLeaveOpen(false)}
            />
            <Button
              label="Leave"
              variant="destructive"
              className="mt-sm"
              onPress={() => {
                setLeaveOpen(false);
                goHome(navigation);
              }}
            />
          </Card>
          </Animated.View>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}
