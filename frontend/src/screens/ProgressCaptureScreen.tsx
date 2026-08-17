import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { api } from "../api";
import { setProgressDraft } from "../progressDraft";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, typography } from "../theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "ProgressCapture">;

export default function ProgressCaptureScreen() {
  const navigation = useNavigation<Nav>();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function pick(fromCamera: boolean) {
    setBusy(true);
    setError(null);
    api.logEvent({ event_type: "task_started", task: "progress_photo", screen: "ProgressCapture" });
    try {
      const permission = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError("Permission is needed to add a progress photo.");
        return;
      }
      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
      if (result.canceled || !result.assets[0]) return;
      const uri = result.assets[0].uri;
      const uploaded = await api.uploadProgressPhoto(uri);
      setProgressDraft({ ...uploaded, local_uri: uri });
      api.logEvent({ event_type: "task_completed", task: "progress_photo", screen: "ProgressCapture" });
      navigation.navigate("ProgressCompare");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Pose could not be estimated. Stand fully in frame with even lighting.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Progress photo</Text>
      <Text style={styles.muted}>
        Capture a full-body standing photo. We estimate pose landmarks and two relative ratios —
        not body composition or clinical measures.
      </Text>
      {busy ? <Text style={styles.heading}>Estimating pose…</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable disabled={busy} onPress={() => pick(true)} style={styles.button}>
        <Text style={styles.buttonLabel}>{busy ? "Working…" : "Take photo"}</Text>
      </Pressable>
      <Pressable disabled={busy} onPress={() => pick(false)} style={styles.secondary}>
        <Text style={styles.secondaryLabel}>Choose from library</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.xl },
  title: { ...typography.title, marginBottom: spacing.xs },
  heading: { ...typography.heading, marginVertical: spacing.md },
  muted: { ...typography.muted, marginBottom: spacing.lg },
  error: { ...typography.muted, color: "#8B3A3A", marginBottom: spacing.md },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  buttonLabel: { color: colors.white, fontWeight: "600", fontSize: 16 },
  secondary: {
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryLabel: { color: colors.text, fontWeight: "600", fontSize: 16 },
});
