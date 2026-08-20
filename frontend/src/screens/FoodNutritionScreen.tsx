import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useMemo, useState } from "react";
import { Text, TextInput } from "react-native";

import { api, BadgeEarned } from "../api";
import { Button, Card, Screen } from "../components/ui";
import BadgeBanner from "../components/BadgeBanner";
import FeedbackPrompt from "../components/FeedbackPrompt";
import { getFoodDraft } from "../foodDraft";
import { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList, "FoodNutrition">;

function scaleMacros(
  nutrition: { calories: number; protein: number; carbs: number; fat: number },
  grams: number,
) {
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
  const [done, setDone] = useState(false);

  const multiReady =
    draft?.mode === "multi"
      ? draft.items
          .filter((item) => item.matched && item.dish)
          .map((item) => ({
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
  }, [
    draft?.mode === "single" ? draft.dish.id : null,
    draft?.mode === "single" ? draft.dish.default_serving_g : null,
  ]);

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
      setBadges(logged.gamification?.new_badges ?? []);
      setDone(true);
      api.logEvent({
        event_type: "task_completed",
        task: "food_log",
        screen: "FoodNutrition",
      });
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
      setBadges(earned);
      setDone(true);
      api.logEvent({
        event_type: "task_completed",
        task: "food_log",
        screen: "FoodNutrition",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log meal");
    } finally {
      setBusy(false);
    }
  }

  if (!draft) {
    return (
      <Screen>
        <Text className="text-caption text-muted">No dish selected.</Text>
      </Screen>
    );
  }

  if (draft.mode === "multi") {
    if (!scaledMulti || !multiTotals || multiReady.length === 0) {
      return (
        <Screen>
          <Text className="text-caption text-muted">
            No matched plate items yet. Go back and pick dishes for unmatched
            items.
          </Text>
        </Screen>
      );
    }
    return (
      <Screen>
        <Text className="text-display font-semibold text-ink">
          Plate nutrition
        </Text>
        <BadgeBanner badges={badges} />
        {done ? (
          <>
            <FeedbackPrompt screen="FoodNutrition" />
            <Button
              label="Continue"
              onPress={() => {
                navigation.popToTop();
                navigation.navigate("Home");
              }}
            />
          </>
        ) : null}
        <Text className="mb-sm mt-sm text-caption text-muted">
          Macros come from each matched dish in the catalog. Unmatched items are
          not logged.
        </Text>
        {multiReady.map((item, index) => {
          const row = scaledMulti[index];
          return (
            <Card key={`${item.dish.id}-${index}`} className="mb-sm mt-sm">
              <Text className="text-heading font-semibold text-ink">
                {item.dish.name}
              </Text>
              <Text className="mt-xxs text-caption text-muted">
                Source: {item.dish.nutrition_source}
              </Text>
              <Text className="mb-xs mt-md text-caption font-semibold text-ink">
                Serving size (g)
              </Text>
              <TextInput
                keyboardType="numeric"
                className="rounded-md border border-border bg-white p-md text-ink"
                value={servings[index] ?? ""}
                onChangeText={(value) => {
                  setServings((prev) => {
                    const next = [...prev];
                    next[index] = value;
                    return next;
                  });
                }}
              />
              <Text className="mt-md text-heading font-semibold text-ink">
                {Math.round(row.calories)} kcal · P {row.protein.toFixed(1)} · C{" "}
                {row.carbs.toFixed(1)} · F {row.fat.toFixed(1)}
              </Text>
            </Card>
          );
        })}
        <Text className="my-md text-heading font-semibold text-ink">
          Total {Math.round(multiTotals.calories)} kcal · P{" "}
          {multiTotals.protein.toFixed(1)} · C {multiTotals.carbs.toFixed(1)} ·
          F {multiTotals.fat.toFixed(1)}
        </Text>
        {error ? (
          <Text className="text-caption text-danger">{error}</Text>
        ) : null}
        {!done ? (
          <Button
            label={busy ? "Saving…" : "Add plate to log"}
            onPress={confirmMulti}
            disabled={busy}
            busy={busy}
            className="mt-lg"
          />
        ) : null}
      </Screen>
    );
  }

  if (!scaledSingle) {
    return (
      <Screen>
        <Text className="text-caption text-muted">No dish selected.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text className="text-display font-semibold text-ink">
        {draft.dish.name}
      </Text>
      <BadgeBanner badges={badges} />
      {done ? (
        <>
          <FeedbackPrompt screen="FoodNutrition" />
          <Button
            label="Continue"
            onPress={() => {
              navigation.popToTop();
              navigation.navigate("Home");
            }}
          />
        </>
      ) : null}
      <Text className="mt-sm text-caption text-muted">
        Source: {draft.dish.nutrition_source}. Ingredients are from the recipe
        table, not the photo.
      </Text>
      <Text className="mb-xs mt-md text-caption font-semibold text-ink">
        Inferred ingredients
      </Text>
      {draft.dish.ingredients.map((item) => (
        <Text key={item.name} className="mb-xxs text-caption text-muted">
          {item.name} — {item.typical_quantity}
        </Text>
      ))}
      <Text className="mb-xs mt-md text-caption font-semibold text-ink">
        Serving size (g)
      </Text>
      <TextInput
        keyboardType="numeric"
        className="rounded-md border border-border bg-white p-md text-ink"
        value={serving}
        onChangeText={setServing}
      />
      <Text className="my-md text-heading font-semibold text-ink">
        {Math.round(scaledSingle.calories)} kcal · P{" "}
        {scaledSingle.protein.toFixed(1)} · C {scaledSingle.carbs.toFixed(1)} ·
        F {scaledSingle.fat.toFixed(1)}
      </Text>
      {error ? (
        <Text className="text-caption text-danger">{error}</Text>
      ) : null}
      {!done ? (
        <Button
          label={busy ? "Saving…" : "Add to log"}
          onPress={confirmSingle}
          disabled={busy}
          busy={busy}
          className="mt-lg"
        />
      ) : null}
    </Screen>
  );
}
