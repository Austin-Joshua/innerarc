import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { api } from "../api";
import { healthConnect } from "../healthConnect";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, typography } from "../theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "WearableConnect">;

export const LAST_SYNC_KEY = "wearable_last_synced_at";

export default function WearableConnectScreen() {
  const navigation = useNavigation<Nav>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (Platform.OS !== "android") {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Health Connect</Text>
        <Text style={styles.body}>
          Wearable sync is Android Health Connect only in this pass. Apple HealthKit is deferred.
        </Text>
      </View>
    );
  }

  const onContinue = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const ok = await healthConnect.initialize();
      if (!ok) {
        setError("Health Connect is not available on this device.");
        return;
      }
      const granted = await healthConnect.requestPermissions(__DEV__);
      if (!granted) {
        setError("Permissions were not granted. You can try again from Connections.");
        return;
      }
      let readings = await healthConnect.readRecent();
      if (readings.length === 0 && __DEV__) {
        await healthConnect.seedVerificationData();
        readings = await healthConnect.readRecent();
      }
      if (readings.length === 0) {
        setMessage("Permissions granted, but no recent steps / heart rate / sleep data was found.");
        return;
      }
      const result = await api.wearableSync(readings);
      await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      setMessage(
        `Synced ${result.total} reading(s) (${result.inserted} new, ${result.updated} updated).`,
      );
      navigation.navigate("Home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connect Health Connect</Text>
      <Text style={styles.body}>
        Innerarc reads steps, heart rate, and sleep from Android Health Connect so you can see them
        on Home. Data stays on your device until you tap Sync — nothing is shared automatically.
      </Text>
      <Text style={styles.body}>
        Next, Android will ask for Health Connect read access. You can revoke this anytime in system
        settings.
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.muted}>{message}</Text> : null}
      <Pressable
        style={[styles.button, busy && styles.buttonDisabled]}
        onPress={onContinue}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.buttonLabel}>Continue to permissions</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.xl },
  title: { ...typography.title, marginBottom: spacing.md },
  body: { ...typography.body, marginBottom: spacing.md, lineHeight: 22 },
  muted: { ...typography.muted, marginBottom: spacing.sm },
  error: { color: "#B42318", marginBottom: spacing.sm },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonLabel: { color: colors.white, fontWeight: "600", fontSize: 16 },
});
