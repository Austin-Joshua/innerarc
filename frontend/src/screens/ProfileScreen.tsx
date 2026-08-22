import { DrawerNavigationProp } from "@react-navigation/drawer";
import { DrawerActions, useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { View } from "react-native";

import { api } from "../api";
import {
  defaultProfileForm,
  formToProfile,
  ProfileFields,
  ProfileFormState,
  profileToForm,
} from "../components/ProfileFields";
import { ContentContainer, PageShell } from "../components/layout";
import { FitnessScreenTitle, FitnessStatGrid } from "../components/fitness/FitnessMobileParts";
import { FitnessListSection } from "../components/fitness/FitnessListSection";
import { AppText, Button, PageTitle, Screen } from "../components/ui";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { MainDrawerParamList } from "../navigation/types";

type Nav = DrawerNavigationProp<MainDrawerParamList, "Profile">;

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { isMobile, isTablet, tier, isDesktop } = useBreakpoint();
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

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const formBlock = (
    <>
      {!loaded && !error ? (
        <AppText variant="caption" className="text-center">
          Loading…
        </AppText>
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
        className="mt-lg w-full"
      />
    </>
  );

  if (!isDesktop) {
    return (
      <Screen hideAppName scroll>
        <PageShell centeredMobile={false}>
          <FitnessScreenTitle title="Profile" tier={tier} onMenu={openDrawer} />

          {email ? (
            <FitnessStatGrid
              items={[
                { label: "Signed in as", value: email.split("@")[0] },
                { label: "Goal", value: form.goal?.replace(/_/g, " ") || "—" },
                { label: "Activity", value: form.activity?.replace(/_/g, " ") || "—" },
                { label: "Equipment", value: form.equipment?.replace(/_/g, " ") || "—" },
              ]}
            />
          ) : null}

          <FitnessListSection title="Your details" caption="Update targets and preferences">
            <View className="py-md">{formBlock}</View>
          </FitnessListSection>
        </PageShell>
      </Screen>
    );
  }

  return (
    <Screen hideAppName scroll className="pt-md">
      <ContentContainer width="content">
        <PageTitle className="mb-xs">My profile</PageTitle>
        {email ? (
          <AppText variant="caption" className="mb-lg w-full text-center">
            Signed in as {email}
          </AppText>
        ) : null}
        <View className="w-full">{formBlock}</View>
      </ContentContainer>
    </Screen>
  );
}
