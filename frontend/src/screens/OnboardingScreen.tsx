import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";

import { api } from "../api";
import {
  defaultProfileForm,
  formToProfile,
  ProfileFields,
  ProfileFormState,
} from "../components/ProfileFields";
import { AppText, Button, Screen } from "../components/ui";
import { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList, "Onboarding">;

export default function OnboardingScreen() {
  const navigation = useNavigation<Nav>();
  const [form, setForm] = useState<ProfileFormState>(defaultProfileForm());
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    try {
      await api.saveProfile(formToProfile(form));
      navigation.replace("Home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile");
    }
  }

  return (
    <Screen>
      <AppText variant="display" className="mb-xs">
        Your starting point
      </AppText>
      <AppText variant="caption" className="mb-lg">
        We use this to calculate calorie targets. It does not limit which
        workouts you can do. You can update it anytime under Profile &
        settings.
      </AppText>
      <ProfileFields form={form} onChange={setForm} />
      {error ? (
        <AppText variant="caption" className="mt-sm text-danger">
          {error}
        </AppText>
      ) : null}
      <Button label="Continue" onPress={save} className="mt-lg" />
    </Screen>
  );
}
