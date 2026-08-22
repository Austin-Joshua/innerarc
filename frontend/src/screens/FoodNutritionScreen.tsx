import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useMemo, useState } from "react";
import { Text, TextInput } from "react-native";

import { api, BadgeEarned, Dish } from "../api";
import { MealNutritionCharts } from "../charts/NutritionCharts";
import { ContentContainer } from "../components/layout";
import {
  Button,
  Card,
  NutritionConfidenceBadge,
  Screen,
} from "../components/ui";
import BadgeBanner from "../components/BadgeBanner";
import FeedbackPrompt from "../components/FeedbackPrompt";
import {
  FoodDraftMulti,
  FoodDraftSingle,
  getFoodDraft,
} from "../foodDraft";
import {
  isFoodPreview,
  previewLogMealGamification,
  seedFoodPreviewDraft,
} from "../foodPreviewSeed";
import { LogMealStackParamList } from "../navigation/types";
import { goToHome } from "../navigation/navHelpers";

type Nav = NativeStackNavigationProp<LogMealStackParamList, "FoodNutrition">;

type MatchedItem = {
  dish: Dish;
  confidence_score: number;
  serving_size_g: number;
  suggested_label: string;
};

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

function matchedPlateItems(draft: FoodDraftMulti): MatchedItem[] {
  return draft.items
    .filter((item) => item.matched && item.dish)
    .map((item) => ({
      dish: item.dish!,
      confidence_score: item.confidence_score ?? 0.5,
      serving_size_g: item.serving_size_g ?? item.dish!.default_serving_g,
      suggested_label: item.suggested_label,
    }));
}

function plateSourceKey(draft: FoodDraftMulti): string {
  return draft.items
    .map((item) =>
      item.dish
        ? `${item.dish.id}:${item.serving_size_g ?? item.dish.default_serving_g}`
        : `u:${item.suggested_label}`,
    )
    .join("|");
}

export default function FoodNutritionScreen() {
  const navigation = useNavigation<Nav>();
  seedFoodPreviewDraft();
  const draft = getFoodDraft();
  if (!draft) {
    return (
      <Screen>
        <ContentContainer width="content">
          <Text className="text-caption text-muted">No dish selected.</Text>
          <Button
            label="Back to capture"
            variant="secondary"
            className="mt-lg"
            onPress={() => navigation.navigate("FoodCapture")}
          />
        </ContentContainer>
      </Screen>
    );
  }
  if (draft.mode === "multi") {
    return <MultiFoodNutrition key={plateSourceKey(draft)} draft={draft} />;
  }
  return (
    <SingleFoodNutrition
      key={`${draft.dish.id}:${draft.dish.default_serving_g}`}
      draft={draft}
    />
  );
}

function SingleFoodNutrition({ draft }: { draft: FoodDraftSingle }) {
  const navigation = useNavigation<Nav>();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [badges, setBadges] = useState<BadgeEarned[]>([]);
  const [done, setDone] = useState(false);
  const [serving, setServing] = useState(String(draft.dish.default_serving_g));

  const scaled = useMemo(
    () => scaleMacros(draft.dish.nutrition_per_100g, Number(serving) || 0),
    [draft.dish.nutrition_per_100g, serving],
  );

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      if (isFoodPreview()) {
        setBadges(previewLogMealGamification().new_badges);
        setDone(true);
        return;
      }
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

  return (
    <Screen>
      <ContentContainer width="content">
      <Text className="text-display font-semibold text-ink">
        {draft.dish.name}
      </Text>
      <NutritionConfidenceBadge
        confidence={draft.dish.nutrition_confidence}
        className="mt-sm"
      />
      <BadgeBanner badges={badges} />
      {done ? (
        <>
          <FeedbackPrompt screen="FoodNutrition" />
          <Button
            label="Continue"
            onPress={() => {
              navigation.popToTop();
              goToHome(navigation);
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
        className="rounded-md border border-border bg-elevated p-md text-ink"
        value={serving}
        onChangeText={setServing}
      />
      <MealNutritionCharts macros={scaled} />
      <Text className="my-md text-heading font-semibold text-ink">
        {Math.round(scaled.calories)} kcal · P {scaled.protein.toFixed(1)} · C{" "}
        {scaled.carbs.toFixed(1)} · F {scaled.fat.toFixed(1)}
      </Text>
      {error ? (
        <Text className="text-caption text-danger">{error}</Text>
      ) : null}
      {!done ? (
        <Button
          label={busy ? "Saving…" : "Add to log"}
          onPress={confirm}
          disabled={busy}
          busy={busy}
          className="mt-lg"
        />
      ) : null}
      </ContentContainer>
    </Screen>
  );
}

function MultiFoodNutrition({ draft }: { draft: FoodDraftMulti }) {
  const navigation = useNavigation<Nav>();
  const multiReady = useMemo(
    () => matchedPlateItems(draft),
    [draft],
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [badges, setBadges] = useState<BadgeEarned[]>([]);
  const [done, setDone] = useState(false);
  const [servings, setServings] = useState(() =>
    multiReady.map((item) => String(item.serving_size_g)),
  );

  const scaledMulti = useMemo(
    () =>
      multiReady.map((item, index) =>
        scaleMacros(item.dish.nutrition_per_100g, Number(servings[index]) || 0),
      ),
    [multiReady, servings],
  );

  const multiTotals = useMemo(
    () =>
      scaledMulti.reduce(
        (acc, row) => ({
          calories: acc.calories + row.calories,
          protein: acc.protein + row.protein,
          carbs: acc.carbs + row.carbs,
          fat: acc.fat + row.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      ),
    [scaledMulti],
  );

  async function confirm() {
    if (multiReady.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      if (isFoodPreview()) {
        setBadges(previewLogMealGamification().new_badges);
        setDone(true);
        return;
      }
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

  if (multiReady.length === 0) {
    return (
      <Screen>
        <ContentContainer width="content">
          <Text className="text-caption text-muted">
            No matched plate items yet. Go back and pick dishes for unmatched
            items.
          </Text>
          <Button
            label="Back to result"
            variant="secondary"
            className="mt-lg"
            onPress={() => navigation.navigate("FoodResult")}
          />
        </ContentContainer>
      </Screen>
    );
  }

  return (
    <Screen>
      <ContentContainer width="content">
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
              goToHome(navigation);
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
            <NutritionConfidenceBadge
              confidence={item.dish.nutrition_confidence}
              className="mt-sm"
            />
            <Text className="mt-xxs text-caption text-muted">
              Source: {item.dish.nutrition_source}
            </Text>
            <Text className="mb-xs mt-md text-caption font-semibold text-ink">
              Serving size (g)
            </Text>
            <TextInput
              keyboardType="numeric"
              className="rounded-md border border-border bg-elevated p-md text-ink"
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
        {multiTotals.protein.toFixed(1)} · C {multiTotals.carbs.toFixed(1)} · F{" "}
        {multiTotals.fat.toFixed(1)}
      </Text>
      <MealNutritionCharts macros={multiTotals} />
      {error ? (
        <Text className="text-caption text-danger">{error}</Text>
      ) : null}
      {!done ? (
        <Button
          label={busy ? "Saving…" : "Add plate to log"}
          onPress={confirm}
          disabled={busy}
          busy={busy}
          className="mt-lg"
        />
      ) : null}
      </ContentContainer>
    </Screen>
  );
}
