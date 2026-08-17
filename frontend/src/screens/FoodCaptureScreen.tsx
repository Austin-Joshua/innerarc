import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { api } from "../api";
import { setFoodDraft, singleFromClassify } from "../foodDraft";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, typography } from "../theme";
import { usePhotoCapture } from "../usePhotoCapture";

type Nav = NativeStackNavigationProp<RootStackParamList, "FoodCapture">;

export default function FoodCaptureScreen() {
  const navigation = useNavigation<Nav>();
  const { pick, busy, error } = usePhotoCapture({
    task: "food_log",
    screen: "FoodCapture",
    quality: 0.7,
    permissionDeniedMessage: "Permission is needed to add a meal photo.",
    failureMessage: "Classification failed",
    capture: (uri) => api.classify(uri),
    onCaptured: (classified, uri) => {
      setFoodDraft(singleFromClassify(classified, uri));
      navigation.navigate("FoodResult");
    },
  });

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
