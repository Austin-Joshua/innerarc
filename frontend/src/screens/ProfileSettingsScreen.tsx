import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useState } from "react";

import { api } from "../api";
import {
  defaultProfileForm,
  formToProfile,
  ProfileFields,
  ProfileFormState,
  profileToForm,
} from "../components/ProfileFields";
import { AppText, Button, Screen } from "../components/ui";
import { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList, "ProfileSettings">;

export default function ProfileSettingsScreen() {
  const navigation = useNavigation<Nav>();
  const [email, setEmail] = useState("");
  const [form, setForm] = useState<ProfileFormState>(defaultProfileForm());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      api
        .me()
        .then((user) => {
          if (!active) return;
          setEmail(user.email);
          if (user.profile) {
            setForm(profileToForm(user.profile));
          }
          setLoaded(true);
        })
        .catch((err) => {
          if (!active) return;
          setError(err instanceof Error ? err.message : "Could not load profile");
        });
      return () => {
        active = false;
      };
    }, []),
  );

  async function save() {
    setError(null);
    setBusy(true);
    try {
      await api.saveProfile(formToProfile(form));
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <AppText variant="display" className="mb-xs">
        Profile & settings
      </AppText>
      {email ? (
        <AppText variant="caption" className="mb-lg">
          Signed in as {email}
        </AppText>
      ) : null}
      {!loaded && !error ? (
        <AppText variant="caption">Loading…</AppText>
      ) : (
        <ProfileFields form={form} onChange={setForm} />
      )}
      {error ? (
        <AppText variant="caption" className="mt-sm text-danger">
          {error}
        </AppText>
      ) : null}
      <Button
        label={busy ? "Saving…" : "Save profile"}
        onPress={save}
        disabled={busy || !loaded}
        busy={busy}
        className="mt-lg"
      />
    </Screen>
  );
}
