import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { api } from "../api";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, typography } from "../theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "Onboarding">;

const SEX = ["male", "female"] as const;
const GOALS = ["fat_loss", "muscle_gain", "recomposition", "endurance", "general_fitness"] as const;
const ACTIVITY = [
  "sedentary",
  "lightly_active",
  "moderately_active",
  "very_active",
  "extra_active",
] as const;
const EQUIPMENT = ["none", "home_gym", "full_gym"] as const;

function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.chips}>
      {options.map((option) => (
        <Pressable
          key={option}
          onPress={() => onChange(option)}
          style={[styles.chip, value === option && styles.chipOn]}
        >
          <Text style={[styles.chipLabel, value === option && styles.chipLabelOn]}>
            {option.replaceAll("_", " ")}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function OnboardingScreen() {
  const navigation = useNavigation<Nav>();
  const [height, setHeight] = useState("170");
  const [weight, setWeight] = useState("70");
  const [sex, setSex] = useState<(typeof SEX)[number]>("male");
  const [goal, setGoal] = useState<(typeof GOALS)[number]>("general_fitness");
  const [activity, setActivity] = useState<(typeof ACTIVITY)[number]>("moderately_active");
  const [equipment, setEquipment] = useState<(typeof EQUIPMENT)[number]>("none");
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    try {
      await api.saveProfile({
        height_cm: Number(height),
        weight_kg: Number(weight),
        biological_sex: sex,
        goal,
        activity_level: activity,
        equipment_access: equipment,
      });
      navigation.replace("Home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile");
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xl }}>
      <Text style={styles.title}>Your starting point</Text>
      <Text style={styles.muted}>Used only to set calorie targets — not to gate workouts.</Text>
      <Text style={styles.label}>Height (cm)</Text>
      <TextInput keyboardType="numeric" style={styles.input} value={height} onChangeText={setHeight} />
      <Text style={styles.label}>Weight (kg)</Text>
      <TextInput keyboardType="numeric" style={styles.input} value={weight} onChangeText={setWeight} />
      <Text style={styles.label}>Biological sex</Text>
      <Chips options={SEX} value={sex} onChange={setSex} />
      <Text style={styles.label}>Goal</Text>
      <Chips options={GOALS} value={goal} onChange={setGoal} />
      <Text style={styles.label}>Activity</Text>
      <Chips options={ACTIVITY} value={activity} onChange={setActivity} />
      <Text style={styles.label}>Equipment</Text>
      <Chips options={EQUIPMENT} value={equipment} onChange={setEquipment} />
      {error ? <Text style={styles.muted}>{error}</Text> : null}
      <Pressable onPress={save} style={styles.button}>
        <Text style={styles.buttonLabel}>Continue</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.xl },
  title: { ...typography.title, marginBottom: spacing.xs },
  muted: { ...typography.muted, marginBottom: spacing.lg },
  label: { ...typography.heading, fontSize: 14, marginTop: spacing.sm, marginBottom: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    color: colors.text,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  chipOn: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  chipLabel: { color: colors.textMuted, fontSize: 13 },
  chipLabelOn: { color: colors.text, fontWeight: "600" },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  buttonLabel: { color: colors.white, fontWeight: "600", fontSize: 16 },
});
