import { PropsWithChildren, useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { RootStackParamList } from "../../navigation/types";
import { Button } from "./Button";
import { Card } from "./Card";

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  className?: string;
  /** Override Innerarc home-tap confirm. Default: WorkoutSession confirms. */
  confirmLeaveHome?: boolean;
}>;

const SKIP_APP_NAME = new Set(["Splash"]);
const STATIC_APP_NAME = new Set(["Auth", "Onboarding", "Home"]);

function goHome(
  navigation: NativeStackNavigationProp<RootStackParamList>,
) {
  navigation.popToTop();
  navigation.navigate("Home");
}

function AppNameRow({
  confirmLeaveHome,
  onRequestLeave,
}: {
  confirmLeaveHome?: boolean;
  onRequestLeave: () => void;
}) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const name = route.name;

  if (SKIP_APP_NAME.has(name)) return null;

  const label = (
    <Text className="text-caption font-semibold tracking-wide text-muted">
      Innerarc
    </Text>
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
  confirmLeaveHome,
}: ScreenProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const topEdge = route.name === "Home";
  const [leaveOpen, setLeaveOpen] = useState(false);

  const body = scroll ? (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName={`px-xl pb-xl ${className}`.trim()}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View className={`flex-1 bg-background px-xl ${className}`.trim()}>
      {children}
    </View>
  );

  return (
    <SafeAreaView
      className="relative flex-1 bg-background"
      edges={topEdge ? ["top", "bottom"] : ["bottom"]}
    >
      <AppNameRow
        confirmLeaveHome={confirmLeaveHome}
        onRequestLeave={() => setLeaveOpen(true)}
      />
      {body}
      {leaveOpen ? (
        <View className="absolute inset-0 z-50 items-center justify-center bg-ink/40 px-xl">
          <Card className="w-full">
            <Text className="text-heading text-ink">Leave workout?</Text>
            <Text className="mb-lg mt-xs text-body text-muted">
              Your session progress will be lost.
            </Text>
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
        </View>
      ) : null}
    </SafeAreaView>
  );
}
