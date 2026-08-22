import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";

import { api } from "../api";
import { AppearanceToggle, AppText, Button, Screen } from "../components/ui";
import { healthConnect } from "../healthConnect";
import { RootStackParamList } from "../navigation/types";
import { isAndroid, isIOS, isWeb } from "../platform";

type Nav = NativeStackNavigationProp<RootStackParamList, "WearableConnect">;

export const LAST_SYNC_KEY = "wearable_last_synced_at";

function UnavailablePanel({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <Screen>
      <AppText variant="title" className="mb-md">
        {title}
      </AppText>
      <AppText variant="body" className="mb-md">
        {body}
      </AppText>
      <AppText variant="overline" className="mb-sm">
        Settings
      </AppText>
      <AppearanceToggle />
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
      navigation.navigate("Home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <AppText variant="title" className="mb-md">
        Connect Health Connect
      </AppText>
      <AppText variant="body" className="mb-md">
        Innerarc reads steps, heart rate, and sleep from Android Health Connect
        so you can see them on Home. Data stays on your device until you sync
        it — nothing is shared automatically.
      </AppText>
      <AppText variant="body" className="mb-md">
        Next, Android will ask for Health Connect read access. You can revoke
        this anytime in system settings.
      </AppText>
      {error ? (
        <AppText variant="caption" className="mb-sm text-danger">
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
      <AppText variant="overline" className="mb-sm mt-xl">
        Settings
      </AppText>
      <AppearanceToggle />
    </Screen>
  );
}
