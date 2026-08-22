import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { Pressable, Text, TextInput } from "react-native";

import { api, Dish } from "../api";
import { ContentContainer, ResponsiveGrid } from "../components/layout";
import { Card, Screen } from "../components/ui";
import { INTERACTIVE_CARD_PRESSABLE } from "../components/ui/interactiveStyles";
import { getFoodDraft, setFoodDraft } from "../foodDraft";
import {
  isFoodPreview,
  PREVIEW_DISHES,
  seedFoodPreviewDraft,
} from "../foodPreviewSeed";
import { LogMealStackParamList } from "../navigation/types";
import { useTheme } from "../ThemeProvider";

type Nav = NativeStackNavigationProp<LogMealStackParamList, "FoodEdit">;

export default function FoodEditScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const draft = getFoodDraft();
  const [dishes, setDishes] = useState<Dish[]>(() =>
    isFoodPreview() ? PREVIEW_DISHES : [],
  );
  const [query, setQuery] = useState("");

  useEffect(() => {
    seedFoodPreviewDraft();
    if (isFoodPreview()) return;
    let active = true;
    api
      .dishes()
      .then((list) => {
        if (active) setDishes(list);
      })
      .catch(() => {
        if (active) setDishes([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = dishes.filter((dish) =>
    dish.name.toLowerCase().includes(query.toLowerCase()),
  );

  function select(dish: Dish) {
    if (!draft) return;
    if (draft.mode === "multi") {
      const index = draft.editingItemIndex ?? 0;
      const items = draft.items.map((item, i) => {
        if (i !== index) return item;
        return {
          ...item,
          matched: true,
          dish,
          serving_size_g: item.serving_size_g ?? dish.default_serving_g,
        };
      });
      setFoodDraft({ ...draft, items, editingItemIndex: null });
      navigation.navigate("FoodResult");
      return;
    }
    setFoodDraft({ ...draft, dish });
    navigation.navigate("FoodNutrition");
  }

  return (
    <Screen>
      <ContentContainer width="content">
      <Text className="mb-md text-display font-semibold text-ink">
        Correct the dish
      </Text>
      <TextInput
        placeholder="Search dishes"
        placeholderTextColor={colors.textMuted}
        className="mb-md rounded-md border border-border bg-elevated p-md text-ink"
        value={query}
        onChangeText={setQuery}
      />
      <ResponsiveGrid>
        {filtered.map((dish) => (
          <Pressable
            key={dish.id}
            className={INTERACTIVE_CARD_PRESSABLE}
            onPress={() => select(dish)}
          >
            <Card interactive>
              <Text className="text-heading font-semibold text-ink">
                {dish.name}
              </Text>
              <Text className="mt-xxs text-caption text-muted">
                {dish.nutrition_source}
              </Text>
            </Card>
          </Pressable>
        ))}
      </ResponsiveGrid>
      </ContentContainer>
    </Screen>
  );
}
