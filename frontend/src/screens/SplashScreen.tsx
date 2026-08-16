import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { api, setToken } from "../api";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, typography } from "../theme";
import { getStoredToken } from "../storage";

type SplashNav = NativeStackNavigationProp<RootStackParamList, "Splash">;

export default function SplashScreen() {
  const navigation = useNavigation<SplashNav>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await getStoredToken();
        if (!stored) {
          navigation.replace("Auth");
          return;
        }
        setToken(stored);
        const user = await api.me();
        if (cancelled) return;
        navigation.replace(user.profile ? "Home" : "Onboarding");
      } catch {
        setToken(null);
        if (!cancelled) navigation.replace("Auth");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.wordmark}>Innerarc</Text>
      <Text style={styles.tagline}>Nutrition, training, and progress — one loop.</Text>
      <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.lg }} />
      {error ? <Text style={styles.tagline}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  wordmark: {
    ...typography.title,
    letterSpacing: 0.5,
  },
  tagline: {
    ...typography.muted,
    marginTop: spacing.sm,
    textAlign: "center",
  },
});
