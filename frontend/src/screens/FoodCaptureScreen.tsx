import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { api } from "../api";
import { setFoodDraft, singleFromClassify } from "../foodDraft";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, typography } from "../theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "FoodCapture">;

export default function FoodCaptureScreen() {
  const navigation = useNavigation<Nav>();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function pick(fromCamera: boolean) {
    setBusy(true);
    setError(null);
    api.logEvent({
      event_type: "task_started",
      task: "food_log",
      screen: "FoodCapture",
    });
    try {
      const permission = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError("Permission is needed to add a meal photo.");
        return;
      }
      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
      if (result.canceled || !result.assets[0]) return;
      const uri = result.assets[0].uri;
      const classified = await api.classify(uri);
      setFoodDraft(singleFromClassify(classified, uri));
      navigation.navigate("FoodResult");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Classification failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log a meal</Text>
      <Text style={styles.muted}>
        Photograph a dish or choose an existing photo. The model names the dish;
        ingredients come from the recipe table, not from pixels.
      </Text>
      {error ? <Text style={styles.muted}>{error}</Text> : null}
      <Pressable
        disabled={busy}
        onPress={() => pick(true)}
        style={styles.button}
      >
        <Text style={styles.buttonLabel}>
          {busy ? "Working…" : "Take photo"}
        </Text>
      </Pressable>
      <Pressable
        disabled={busy}
        onPress={() => pick(false)}
        style={styles.secondary}
      >
        <Text style={styles.secondaryLabel}>Choose from library</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    justifyContent: "center",
  },
  title: { ...typography.title, marginBottom: spacing.sm },
  muted: { ...typography.muted, marginBottom: spacing.lg },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  buttonLabel: { color: colors.white, fontWeight: "600", fontSize: 16 },
  secondary: { paddingVertical: spacing.md, alignItems: "center" },
  secondaryLabel: { color: colors.accent, fontWeight: "600" },
});
