import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import { api, setToken } from "../api";
import { AppText } from "../components/ui";
import { runModule7Verify } from "../m7Verify";
import { RootStackParamList } from "../navigation/types";
import { useTheme } from "../ThemeProvider";
import { getStoredToken } from "../storage";

type SplashNav = NativeStackNavigationProp<RootStackParamList, "Splash">;

export default function SplashScreen() {
  const navigation = useNavigation<SplashNav>();
  const { colors } = useTheme();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (process.env.EXPO_PUBLIC_M7_VERIFY === "1") {
        await runModule7Verify();
        if (!cancelled) navigation.replace("Main");
        return;
      }
      if (process.env.EXPO_PUBLIC_SHELL_PREVIEW === "1") {
        if (!cancelled) navigation.replace("Main");
        return;
      }
      try {
        const stored = await getStoredToken();
        if (!stored) {
          navigation.replace("Landing");
          return;
        }
        setToken(stored);
        const user = await api.me();
        if (cancelled) return;
        navigation.replace(user.profile ? "Main" : "Onboarding");
      } catch {
        setToken(null);
        if (!cancelled) navigation.replace("Landing");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigation]);

  return (
    <View className="flex-1 items-center justify-center bg-background px-xl">
      <AppText variant="wordmark" accent>
        Innerarc
      </AppText>
      <AppText variant="caption" className="mt-sm text-center">
        {process.env.EXPO_PUBLIC_M7_VERIFY === "1"
          ? "Verifying Health Connect integration…"
          : "Nutrition, training, and progress in one place."}
      </AppText>
      <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
    </View>
  );
}
