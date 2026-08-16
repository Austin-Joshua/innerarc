import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { api } from "../api";
import { getFoodDraft } from "../foodDraft";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, typography } from "../theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "FoodNutrition">;

export default function FoodNutritionScreen() {
  const navigation = useNavigation<Nav>();
  const draft = getFoodDraft();
  const [serving, setServing] = useState(String(draft?.dish.default_serving_g ?? ""));

  useEffect(() => {
    setServing(String(draft?.dish.default_serving_g ?? ""));
  }, [draft?.dish.id, draft?.dish.default_serving_g]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const scaled = useMemo(() => {
    if (!draft) return null;
    const grams = Number(serving) || 0;
    const scale = grams / 100;
    const n = draft.dish.nutrition_per_100g;
    return {
      calories: n.calories * scale,
      protein: n.protein * scale,
      carbs: n.carbs * scale,
      fat: n.fat * scale,
    };
  }, [draft, serving]);

  async function confirm() {
    if (!draft) return;
    setBusy(true);
    setError(null);
    try {
      await api.logMeal({
        dish_id: draft.dish.id,
        confidence_score: draft.confidence_score,
        serving_size_g: Number(serving),
        image_url: draft.image_url,
      });
      navigation.popToTop();
      navigation.navigate("Home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log meal");
    } finally {
      setBusy(false);
    }
  }

  if (!draft || !scaled) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>No dish selected.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xl }}>
      <Text style={styles.title}>{draft.dish.name}</Text>
      <Text style={styles.muted}>
        Source: {draft.dish.nutrition_source}. Ingredients are from the recipe table, not the photo.
      </Text>
      <Text style={styles.label}>Inferred ingredients</Text>
      {draft.dish.ingredients.map((item) => (
        <Text key={item.name} style={styles.muted}>
          {item.name} — {item.typical_quantity}
        </Text>
      ))}
      <Text style={styles.label}>Serving size (g)</Text>
      <TextInput
        keyboardType="numeric"
        style={styles.input}
        value={serving}
        onChangeText={setServing}
      />
      <Text style={styles.heading}>
        {Math.round(scaled.calories)} kcal · P {scaled.protein.toFixed(1)} · C {scaled.carbs.toFixed(1)} · F{" "}
        {scaled.fat.toFixed(1)}
      </Text>
      {error ? <Text style={styles.muted}>{error}</Text> : null}
      <Pressable disabled={busy} onPress={confirm} style={styles.button}>
        <Text style={styles.buttonLabel}>{busy ? "Saving…" : "Add to log"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.xl },
  title: { ...typography.title },
  heading: { ...typography.heading, marginVertical: spacing.md },
  muted: { ...typography.muted, marginBottom: 4 },
  label: { ...typography.heading, fontSize: 16, marginTop: spacing.md, marginBottom: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  buttonLabel: { color: colors.white, fontWeight: "600", fontSize: 16 },
});
