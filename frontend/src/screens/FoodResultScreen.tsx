import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { api } from "../api";
import { FoodDraft, getFoodDraft, setFoodDraft } from "../foodDraft";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, typography } from "../theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "FoodResult">;

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
      <View style={styles.container}>
        <Text style={styles.muted}>
          No prediction yet. Go back and add a photo.
        </Text>
      </View>
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
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
      >
        <Text style={styles.title}>Plate items</Text>
        <Text style={styles.muted}>
          Each item is separate — edit unmatched dishes before logging.
          Nutrition still comes from the dishes table, not the photo model.
        </Text>
        {draft.local_uri ? (
          <Image
            source={{ uri: draft.local_uri }}
            style={styles.photo}
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
            <View key={`${title}-${index}`} style={styles.itemCard}>
              <Text style={styles.itemTitle}>{title}</Text>
              <Text style={styles.muted}>
                {item.matched ? "Matched" : "No dish match"} · portion{" "}
                {item.portion} · conf {conf}
              </Text>
              {!item.matched ? (
                <Text style={styles.warn}>
                  Pick a dish to include this item in the log.
                </Text>
              ) : null}
              <Pressable
                onPress={() => {
                  setFoodDraft({ ...draft, editingItemIndex: index });
                  navigation.navigate("FoodEdit");
                }}
                style={styles.itemEdit}
              >
                <Text style={styles.secondaryLabel}>
                  {item.matched ? "Edit dish" : "No dish match — pick a dish"}
                </Text>
              </Pressable>
            </View>
          );
        })}
        {error ? <Text style={styles.muted}>{error}</Text> : null}
        {unmatched ? (
          <Text style={styles.warn}>
            {unmatched} unmatched item{unmatched === 1 ? "" : "s"} will be
            skipped until corrected.
          </Text>
        ) : null}
        <Pressable
          onPress={() => navigation.navigate("FoodNutrition")}
          style={styles.button}
          disabled={!draft.items.some((item) => item.matched && item.dish)}
        >
          <Text style={styles.buttonLabel}>Review nutrition & log</Text>
        </Pressable>
      </ScrollView>
    );
  }

  const pct = Math.round(draft.confidence_score * 100);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{draft.dish.name}</Text>
      <Text style={styles.confidence}>Confidence {pct}%</Text>
      <Text style={styles.muted}>
        Predictions are estimates. If this is the wrong dish, edit it before
        logging.
      </Text>
      {draft.local_uri ? (
        <Image
          source={{ uri: draft.local_uri }}
          style={styles.photo}
          accessibilityLabel="Meal photo"
        />
      ) : null}
      {error ? <Text style={styles.muted}>{error}</Text> : null}
      <Pressable
        onPress={() => navigation.navigate("FoodEdit")}
        style={styles.secondary}
      >
        <Text style={styles.secondaryLabel}>Edit dish</Text>
      </Pressable>
      <Pressable
        onPress={runPlateClassify}
        style={styles.secondary}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <Text style={styles.secondaryLabel}>This is more than one dish</Text>
        )}
      </Pressable>
      <Pressable
        onPress={() => navigation.navigate("FoodNutrition")}
        style={styles.button}
      >
        <Text style={styles.buttonLabel}>This looks right</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  title: { ...typography.title },
  confidence: {
    ...typography.heading,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  muted: { ...typography.muted, marginBottom: spacing.lg },
  warn: { ...typography.muted, color: colors.accent, marginBottom: spacing.sm },
  photo: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
  },
  itemCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  itemTitle: { ...typography.heading, fontSize: 16, marginBottom: 4 },
  itemEdit: { marginTop: spacing.sm },
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
