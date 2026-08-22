import AsyncStorage from "@react-native-async-storage/async-storage";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";

import { api } from "../api";
import { ContentContainer } from "../components/layout";
import { AppearanceShortcut, AppText, Button, PageTitle, Screen } from "../components/ui";
import { healthConnect } from "../healthConnect";
import { goToHome } from "../navigation/navHelpers";
import { MainDrawerParamList } from "../navigation/types";
import { isAndroid, isIOS, isWeb } from "../platform";
import { LAST_SYNC_KEY } from "../wearableKeys";

type Nav = DrawerNavigationProp<MainDrawerParamList, "WearableConnect">;

function UnavailablePanel({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <Screen hideAppName scroll className="pt-md">
      <ContentContainer width="content">
      <PageTitle variant="title" className="mb-md">
        {title}
      </PageTitle>
      <AppText variant="body" className="mb-md w-full text-center">
        {body}
      </AppText>
      <AppearanceShortcut />
      </ContentContainer>
    </Screen>
  );
}

export default function WearableConnectScreen() {
  const navigation = useNavigation<Nav>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (isWeb) {
    return (
      <UnavailablePanel
        title="Connections"
        body="Wearable sync runs in the Android app via Health Connect. On the web, you can log meals, follow workouts, chat with your coach, and review progress."
      />
    );
  }

  if (isIOS) {
    return (
      <UnavailablePanel
        title="Connections"
        body="Apple Health integration is not available yet. Wearable sync currently works on Android through Health Connect."
      />
    );
  }

  if (!isAndroid) {
    return (
      <UnavailablePanel
        title="Connections"
        body="Wearable sync is only supported on Android in this release."
      />
    );
  }

  const onContinue = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const ok = await healthConnect.initialize();
      if (!ok) {
        setError("Health Connect is not available on this device.");
        return;
      }
      const granted = await healthConnect.requestPermissions(__DEV__);
      if (!granted) {
        setError(
          "Permissions were not granted. You can try again from Connections.",
        );
        return;
      }
      let readings = await healthConnect.readRecent();
      if (readings.length === 0 && __DEV__) {
        await healthConnect.seedVerificationData();
        readings = await healthConnect.readRecent();
      }
      if (readings.length === 0) {
        setMessage(
          "Permissions granted, but no recent steps, heart rate, or sleep data was found.",
        );
        return;
      }
      const result = await api.wearableSync(readings);
      await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      setMessage(
        `Synced ${result.total} reading(s) (${result.inserted} new, ${result.updated} updated).`,
      );
      goToHome(navigation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen hideAppName scroll className="pt-md">
      <ContentContainer width="content">
      <PageTitle variant="title" className="mb-md">
        Connect Health Connect
      </PageTitle>
      <AppText variant="body" className="mb-md w-full text-center">
        Innerarc reads steps, heart rate, and sleep from Android Health Connect
        so you can see them on Home. Data stays on your device until you sync
        it — nothing is shared automatically.
      </AppText>
      <AppText variant="body" className="mb-md w-full text-center">
        Next, Android will ask for Health Connect read access. You can revoke
        this anytime in system settings.
      </AppText>
      {error ? (
        <AppText variant="caption" className="mb-sm w-full text-center text-danger">
          {error}
        </AppText>
      ) : null}
      {message ? (
        <AppText variant="caption" className="mb-sm">
          {message}
        </AppText>
      ) : null}
      <Button
        label="Continue to permissions"
        className="mt-lg"
        onPress={onContinue}
        disabled={busy}
        busy={busy}
      />
      <AppearanceShortcut />
      </ContentContainer>
    </Screen>
  );
}
