import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { api, Dish } from "../api";
import { getFoodDraft, setFoodDraft } from "../foodDraft";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, typography } from "../theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "FoodEdit">;

export default function FoodEditScreen() {
  const navigation = useNavigation<Nav>();
  const draft = getFoodDraft();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api
      .dishes()
      .then(setDishes)
      .catch(() => setDishes([]));
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
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Correct the dish</Text>
      <TextInput
        placeholder="Search dishes"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        value={query}
        onChangeText={setQuery}
      />
      {filtered.map((dish) => (
        <Pressable
          key={dish.id}
          onPress={() => select(dish)}
          style={styles.row}
        >
          <Text style={styles.name}>{dish.name}</Text>
          <Text style={styles.muted}>{dish.nutrition_source}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  title: { ...typography.title, marginBottom: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    color: colors.text,
  },
  row: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: { ...typography.heading, fontSize: 16 },
  muted: { ...typography.muted },
});
