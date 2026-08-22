import { Pressable, Text, TextInput, View } from "react-native";

import { Profile } from "../api";

export const PROFILE_SEX = ["male", "female"] as const;
export const PROFILE_GOALS = [
  "fat_loss",
  "muscle_gain",
  "recomposition",
  "endurance",
  "general_fitness",
] as const;
export const PROFILE_ACTIVITY = [
  "sedentary",
  "lightly_active",
  "moderately_active",
  "very_active",
  "extra_active",
] as const;
export const PROFILE_EQUIPMENT = ["none", "home_gym", "full_gym"] as const;

export type ProfileFormState = {
  height: string;
  weight: string;
  sex: (typeof PROFILE_SEX)[number];
  goal: (typeof PROFILE_GOALS)[number];
  activity: (typeof PROFILE_ACTIVITY)[number];
  equipment: (typeof PROFILE_EQUIPMENT)[number];
};

export function profileToForm(profile: Profile): ProfileFormState {
  return {
    height: String(profile.height_cm),
    weight: String(profile.weight_kg),
    sex: profile.biological_sex as ProfileFormState["sex"],
    goal: profile.goal as ProfileFormState["goal"],
    activity: profile.activity_level as ProfileFormState["activity"],
    equipment: profile.equipment_access as ProfileFormState["equipment"],
  };
}

export function formToProfile(form: ProfileFormState): Profile {
  return {
    height_cm: Number(form.height),
    weight_kg: Number(form.weight),
    biological_sex: form.sex,
    goal: form.goal,
    activity_level: form.activity,
    equipment_access: form.equipment,
  };
}

export const defaultProfileForm = (): ProfileFormState => ({
  height: "170",
  weight: "70",
  sex: "male",
  goal: "general_fitness",
  activity: "moderately_active",
  equipment: "none",
});

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

type ProfileFieldsProps = {
  form: ProfileFormState;
  onChange: (next: ProfileFormState) => void;
};

export function ProfileFields({ form, onChange }: ProfileFieldsProps) {
  return (
    <>
      <Text className="mb-xs mt-sm text-caption font-semibold text-ink">
        Height (cm)
      </Text>
      <TextInput
        keyboardType="numeric"
        className="rounded-md border border-border bg-elevated p-md text-ink"
        value={form.height}
        onChangeText={(height) => onChange({ ...form, height })}
      />
      <Text className="mb-xs mt-sm text-caption font-semibold text-ink">
        Weight (kg)
      </Text>
      <TextInput
        keyboardType="numeric"
        className="rounded-md border border-border bg-elevated p-md text-ink"
        value={form.weight}
        onChangeText={(weight) => onChange({ ...form, weight })}
      />
      <Text className="mb-xs mt-sm text-caption font-semibold text-ink">
        Biological sex
      </Text>
      <Chips
        options={PROFILE_SEX}
        value={form.sex}
        onChange={(sex) => onChange({ ...form, sex })}
      />
      <Text className="mb-xs mt-sm text-caption font-semibold text-ink">Goal</Text>
      <Chips
        options={PROFILE_GOALS}
        value={form.goal}
        onChange={(goal) => onChange({ ...form, goal })}
      />
      <Text className="mb-xs mt-sm text-caption font-semibold text-ink">
        Activity
      </Text>
      <Chips
        options={PROFILE_ACTIVITY}
        value={form.activity}
        onChange={(activity) => onChange({ ...form, activity })}
      />
      <Text className="mb-xs mt-sm text-caption font-semibold text-ink">
        Equipment
      </Text>
      <Chips
        options={PROFILE_EQUIPMENT}
        value={form.equipment}
        onChange={(equipment) => onChange({ ...form, equipment })}
      />
    </>
  );
}
