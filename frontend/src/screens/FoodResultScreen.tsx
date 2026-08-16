import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { getFoodDraft } from "../foodDraft";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, typography } from "../theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "FoodResult">;

export default function FoodResultScreen() {
  const navigation = useNavigation<Nav>();
  const draft = getFoodDraft();
  if (!draft) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>No prediction yet. Go back and add a photo.</Text>
      </View>
    );
  }
  const pct = Math.round(draft.confidence_score * 100);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{draft.dish.name}</Text>
      <Text style={styles.confidence}>Confidence {pct}%</Text>
      <Text style={styles.muted}>
        Predictions are estimates. If this is the wrong dish, edit it before logging.
      </Text>
      {draft.local_uri ? (
        <Image source={{ uri: draft.local_uri }} style={styles.photo} accessibilityLabel="Meal photo" />
      ) : null}
      <Pressable onPress={() => navigation.navigate("FoodEdit")} style={styles.secondary}>
        <Text style={styles.secondaryLabel}>Edit dish</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate("FoodNutrition")} style={styles.button}>
        <Text style={styles.buttonLabel}>This looks right</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.xl },
  title: { ...typography.title },
  confidence: { ...typography.heading, marginTop: spacing.sm, marginBottom: spacing.sm },
  muted: { ...typography.muted, marginBottom: spacing.lg },
  photo: { width: "100%", height: 220, borderRadius: 16, marginBottom: spacing.lg, backgroundColor: colors.surface },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  buttonLabel: { color: colors.white, fontWeight: "600", fontSize: 16 },
  secondary: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  secondaryLabel: { color: colors.accent, fontWeight: "600" },
});
