import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { api } from "../api";
import { Button, Screen } from "../components/ui";
import { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList, "Onboarding">;

const SEX = ["male", "female"] as const;
const GOALS = [
  "fat_loss",
  "muscle_gain",
  "recomposition",
  "endurance",
  "general_fitness",
] as const;
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
    <View className="flex-row flex-wrap gap-xs">
      {options.map((option) => {
        const selected = value === option;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            className={
              selected
                ? "rounded-full border border-accent bg-accent-soft px-sm py-xs"
                : "rounded-full border border-border bg-elevated px-sm py-xs"
            }
          >
            <Text
              className={
                selected
                  ? "text-caption font-semibold text-ink"
                  : "text-caption text-muted"
              }
            >
              {option.replaceAll("_", " ")}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function OnboardingScreen() {
  const navigation = useNavigation<Nav>();
  const [height, setHeight] = useState("170");
  const [weight, setWeight] = useState("70");
  const [sex, setSex] = useState<(typeof SEX)[number]>("male");
  const [goal, setGoal] = useState<(typeof GOALS)[number]>("general_fitness");
  const [activity, setActivity] =
    useState<(typeof ACTIVITY)[number]>("moderately_active");
  const [equipment, setEquipment] =
    useState<(typeof EQUIPMENT)[number]>("none");
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
    <Screen>
      <Text className="mb-xs text-display font-semibold text-ink">
        Your starting point
      </Text>
      <Text className="mb-lg text-caption text-muted">
        Used only to set calorie targets — not to gate workouts.
      </Text>
      <Text className="mb-xs mt-sm text-caption font-semibold text-ink">
        Height (cm)
      </Text>
      <TextInput
        keyboardType="numeric"
        className="rounded-md border border-border bg-elevated p-md text-ink"
        value={height}
        onChangeText={setHeight}
      />
      <Text className="mb-xs mt-sm text-caption font-semibold text-ink">
        Weight (kg)
      </Text>
      <TextInput
        keyboardType="numeric"
        className="rounded-md border border-border bg-elevated p-md text-ink"
        value={weight}
        onChangeText={setWeight}
      />
      <Text className="mb-xs mt-sm text-caption font-semibold text-ink">
        Biological sex
      </Text>
      <Chips options={SEX} value={sex} onChange={setSex} />
      <Text className="mb-xs mt-sm text-caption font-semibold text-ink">
        Goal
      </Text>
      <Chips options={GOALS} value={goal} onChange={setGoal} />
      <Text className="mb-xs mt-sm text-caption font-semibold text-ink">
        Activity
      </Text>
      <Chips options={ACTIVITY} value={activity} onChange={setActivity} />
      <Text className="mb-xs mt-sm text-caption font-semibold text-ink">
        Equipment
      </Text>
      <Chips options={EQUIPMENT} value={equipment} onChange={setEquipment} />
      {error ? (
        <Text className="mt-sm text-caption text-danger">{error}</Text>
      ) : null}
      <Button label="Continue" onPress={save} className="mt-lg" />
    </Screen>
  );
}
