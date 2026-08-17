import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { api, BadgeEarned } from "../api";
import BadgeBanner from "../components/BadgeBanner";
import { getFoodDraft } from "../foodDraft";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, typography } from "../theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "FoodNutrition">;

function scaleMacros(nutrition: { calories: number; protein: number; carbs: number; fat: number }, grams: number) {
  const scale = grams / 100;
  return {
    calories: nutrition.calories * scale,
    protein: nutrition.protein * scale,
    carbs: nutrition.carbs * scale,
    fat: nutrition.fat * scale,
  };
}

export default function FoodNutritionScreen() {
  const navigation = useNavigation<Nav>();
  const draft = getFoodDraft();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [badges, setBadges] = useState<BadgeEarned[]>([]);

  const multiReady =
    draft?.mode === "multi"
      ? draft.items.filter((item) => item.matched && item.dish).map((item) => ({
          dish: item.dish!,
          confidence_score: item.confidence_score ?? 0.5,
          serving_size_g: item.serving_size_g ?? item.dish!.default_serving_g,
          suggested_label: item.suggested_label,
        }))
      : [];

  const [serving, setServing] = useState(
    String(draft?.mode === "single" ? draft.dish.default_serving_g : ""),
  );
  const [servings, setServings] = useState<string[]>(
    multiReady.map((item) => String(item.serving_size_g)),
  );

  useEffect(() => {
    if (draft?.mode === "single") {
      setServing(String(draft.dish.default_serving_g));
    }
  }, [draft?.mode === "single" ? draft.dish.id : null, draft?.mode === "single" ? draft.dish.default_serving_g : null]);

  useEffect(() => {
    if (draft?.mode === "multi") {
      setServings(multiReady.map((item) => String(item.serving_size_g)));
    }
  }, [draft?.mode, draft?.mode === "multi" ? draft.items.length : 0]);

  const scaledSingle = useMemo(() => {
    if (!draft || draft.mode !== "single") return null;
    return scaleMacros(draft.dish.nutrition_per_100g, Number(serving) || 0);
  }, [draft, serving]);

  const scaledMulti = useMemo(() => {
    if (!draft || draft.mode !== "multi") return null;
    return multiReady.map((item, index) =>
      scaleMacros(item.dish.nutrition_per_100g, Number(servings[index]) || 0),
    );
  }, [draft, servings, multiReady.length]);

  const multiTotals = useMemo(() => {
    if (!scaledMulti) return null;
    return scaledMulti.reduce(
      (acc, row) => ({
        calories: acc.calories + row.calories,
        protein: acc.protein + row.protein,
        carbs: acc.carbs + row.carbs,
        fat: acc.fat + row.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }, [scaledMulti]);

  async function confirmSingle() {
    if (!draft || draft.mode !== "single") return;
    setBusy(true);
    setError(null);
    try {
      const logged = await api.logMeal({
        dish_id: draft.dish.id,
        confidence_score: draft.confidence_score,
        serving_size_g: Number(serving),
        image_url: draft.image_url,
      });
      const earned = logged.gamification?.new_badges ?? [];
      if (earned.length) {
        setBadges(earned);
      } else {
        navigation.popToTop();
        navigation.navigate("Home");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log meal");
    } finally {
      setBusy(false);
    }
  }

  async function confirmMulti() {
    if (!draft || draft.mode !== "multi" || multiReady.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const loggedAt = new Date().toISOString();
      let earned: BadgeEarned[] = [];
      for (let i = 0; i < multiReady.length; i += 1) {
        const item = multiReady[i];
        const logged = await api.logMeal({
          dish_id: item.dish.id,
          confidence_score: item.confidence_score,
          serving_size_g: Number(servings[i]) || item.serving_size_g,
          image_url: draft.image_url,
          logged_at: loggedAt,
        });
        earned = [...earned, ...(logged.gamification?.new_badges ?? [])];
      }
      if (earned.length) {
        setBadges(earned);
      } else {
        navigation.popToTop();
        navigation.navigate("Home");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log meal");
    } finally {
      setBusy(false);
    }
  }

  if (!draft) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>No dish selected.</Text>
      </View>
    );
  }

  if (draft.mode === "multi") {
    if (!scaledMulti || !multiTotals || multiReady.length === 0) {
      return (
        <View style={styles.container}>
          <Text style={styles.muted}>
            No matched plate items yet. Go back and pick dishes for unmatched items.
          </Text>
        </View>
      );
    }
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <Text style={styles.title}>Plate nutrition</Text>
        <BadgeBanner badges={badges} />
        {badges.length ? (
          <Pressable
            style={styles.button}
            onPress={() => {
              navigation.popToTop();
              navigation.navigate("Home");
            }}
          >
            <Text style={styles.buttonLabel}>Continue</Text>
          </Pressable>
        ) : null}
        <Text style={styles.muted}>
          Macros come from each matched dish in the catalog. Unmatched items are not logged.
        </Text>
        {multiReady.map((item, index) => {
          const row = scaledMulti[index];
          return (
            <View key={`${item.dish.id}-${index}`} style={styles.itemBlock}>
              <Text style={styles.label}>{item.dish.name}</Text>
              <Text style={styles.muted}>Source: {item.dish.nutrition_source}</Text>
              <Text style={styles.label}>Serving size (g)</Text>
              <TextInput
                keyboardType="numeric"
                style={styles.input}
                value={servings[index] ?? ""}
                onChangeText={(value) => {
                  setServings((prev) => {
                    const next = [...prev];
                    next[index] = value;
                    return next;
                  });
                }}
              />
              <Text style={styles.heading}>
                {Math.round(row.calories)} kcal · P {row.protein.toFixed(1)} · C {row.carbs.toFixed(1)} · F{" "}
                {row.fat.toFixed(1)}
              </Text>
            </View>
          );
        })}
        <Text style={styles.heading}>
          Total {Math.round(multiTotals.calories)} kcal · P {multiTotals.protein.toFixed(1)} · C{" "}
          {multiTotals.carbs.toFixed(1)} · F {multiTotals.fat.toFixed(1)}
        </Text>
        {error ? <Text style={styles.muted}>{error}</Text> : null}
        <Pressable disabled={busy} onPress={confirmMulti} style={styles.button}>
          <Text style={styles.buttonLabel}>{busy ? "Saving…" : "Add plate to log"}</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (!scaledSingle) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>No dish selected.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xl }}>
      <Text style={styles.title}>{draft.dish.name}</Text>
      <BadgeBanner badges={badges} />
      {badges.length ? (
        <Pressable
          style={styles.button}
          onPress={() => {
            navigation.popToTop();
            navigation.navigate("Home");
          }}
        >
          <Text style={styles.buttonLabel}>Continue</Text>
        </Pressable>
      ) : null}
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
        {Math.round(scaledSingle.calories)} kcal · P {scaledSingle.protein.toFixed(1)} · C{" "}
        {scaledSingle.carbs.toFixed(1)} · F {scaledSingle.fat.toFixed(1)}
      </Text>
      {error ? <Text style={styles.muted}>{error}</Text> : null}
      <Pressable disabled={busy} onPress={confirmSingle} style={styles.button}>
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
  itemBlock: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
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
