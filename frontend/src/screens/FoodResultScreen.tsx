import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Image, Text, View } from "react-native";

import { api } from "../api";
import { Badge, Button, Card, Screen } from "../components/ui";
import { FoodDraft, getFoodDraft, setFoodDraft } from "../foodDraft";
import { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList, "FoodResult">;

const photoStyle = { width: "100%" as const, height: 220 };

export default function FoodResultScreen() {
  const navigation = useNavigation<Nav>();
  const [draft, setDraft] = useState<FoodDraft | null>(getFoodDraft());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setDraft(getFoodDraft());
    }, []),
  );

  if (!draft) {
    return (
      <Screen>
        <Text className="text-caption text-muted">
          No prediction yet. Go back and add a photo.
        </Text>
      </Screen>
    );
  }

  async function runPlateClassify() {
    if (!draft) return;
    setBusy(true);
    setError(null);
    try {
      const plate = await api.classifyPlate(draft.local_uri);
      const next: FoodDraft = {
        mode: "multi",
        items: plate.items,
        editingItemIndex: null,
        image_url: plate.image_url,
        local_uri: draft.local_uri,
      };
      setFoodDraft(next);
      setDraft(next);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Plate classification failed",
      );
    } finally {
      setBusy(false);
    }
  }

  if (draft.mode === "multi") {
    const unmatched = draft.items.filter(
      (item) => !item.matched || !item.dish,
    ).length;
    return (
      <Screen>
        <Text className="text-display font-semibold text-ink">Plate items</Text>
        <Text className="mb-lg mt-xs text-caption text-muted">
          Each item is separate — edit unmatched dishes before logging.
          Nutrition still comes from the dishes table, not the photo model.
        </Text>
        {draft.local_uri ? (
          <Image
            source={{ uri: draft.local_uri }}
            style={photoStyle}
            className="mb-lg rounded-lg bg-surface"
            accessibilityLabel="Meal photo"
          />
        ) : null}
        {draft.items.map((item, index) => {
          const title = item.dish?.name ?? item.suggested_label;
          const conf =
            item.confidence_score != null
              ? `${Math.round(item.confidence_score * 100)}%`
              : "—";
          return (
            <Card key={`${title}-${index}`} className="mb-sm">
              <View className="mb-xs flex-row items-center justify-between">
                <Text className="flex-1 text-heading font-semibold text-ink">
                  {title}
                </Text>
                <Badge
                  label={item.matched ? "Matched" : "Unmatched"}
                  tone={item.matched ? "success" : "warning"}
                />
              </View>
              <Text className="text-caption text-muted">
                {item.matched ? "Matched" : "No dish match"} · portion{" "}
                {item.portion} · conf {conf}
              </Text>
              {!item.matched ? (
                <Text className="mt-xs text-caption text-warning">
                  Pick a dish to include this item in the log.
                </Text>
              ) : null}
              <Button
                label={
                  item.matched ? "Edit dish" : "No dish match — pick a dish"
                }
                variant="secondary"
                onPress={() => {
                  setFoodDraft({ ...draft, editingItemIndex: index });
                  navigation.navigate("FoodEdit");
                }}
                className="mt-sm"
              />
            </Card>
          );
        })}
        {error ? (
          <Text className="text-caption text-danger">{error}</Text>
        ) : null}
        {unmatched ? (
          <Text className="mb-sm text-caption text-warning">
            {unmatched} unmatched item{unmatched === 1 ? "" : "s"} will be
            skipped until corrected.
          </Text>
        ) : null}
        <Button
          label="Review nutrition & log"
          onPress={() => navigation.navigate("FoodNutrition")}
          disabled={!draft.items.some((item) => item.matched && item.dish)}
        />
      </Screen>
    );
  }

  const pct = Math.round(draft.confidence_score * 100);

  return (
    <Screen>
      <Text className="text-display font-semibold text-ink">
        {draft.dish.name}
      </Text>
      <Text className="mt-sm text-heading font-semibold text-ink">
        Confidence {pct}%
      </Text>
      <Text className="mb-lg mt-sm text-caption text-muted">
        Predictions are estimates. If this is the wrong dish, edit it before
        logging.
      </Text>
      {draft.local_uri ? (
        <Image
          source={{ uri: draft.local_uri }}
          style={photoStyle}
          className="mb-lg rounded-lg bg-surface"
          accessibilityLabel="Meal photo"
        />
      ) : null}
      {error ? (
        <Text className="mb-sm text-caption text-danger">{error}</Text>
      ) : null}
      <Button
        label="Edit dish"
        variant="secondary"
        onPress={() => navigation.navigate("FoodEdit")}
        className="mb-sm"
      />
      <Button
        label="This is more than one dish"
        variant="secondary"
        onPress={runPlateClassify}
        disabled={busy}
        busy={busy}
        className="mb-sm"
      />
      <Button
        label="This looks right"
        onPress={() => navigation.navigate("FoodNutrition")}
      />
    </Screen>
  );
}
