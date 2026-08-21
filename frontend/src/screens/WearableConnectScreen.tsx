import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { Platform, Text } from "react-native";

import { api } from "../api";
import { AppearanceToggle, Button, Screen } from "../components/ui";
import { healthConnect } from "../healthConnect";
import { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList, "WearableConnect">;

export const LAST_SYNC_KEY = "wearable_last_synced_at";

export default function WearableConnectScreen() {
  const navigation = useNavigation<Nav>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (Platform.OS !== "android") {
    return (
      <Screen>
        <Text className="mb-md text-title text-ink">Health Connect</Text>
        <Text className="mb-md text-body text-ink">
          Wearable sync is Android Health Connect only in this pass. Apple
          HealthKit is deferred.
        </Text>
        <AppearanceToggle />
      </Screen>
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
          "Permissions granted, but no recent steps / heart rate / sleep data was found.",
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
      <Text className="mb-md text-title text-ink">Connect Health Connect</Text>
      <Text className="mb-md text-body text-ink">
        Innerarc reads steps, heart rate, and sleep from Android Health Connect
        so you can see them on Home. Data stays on your device until you tap
        Sync — nothing is shared automatically.
      </Text>
      <Text className="mb-md text-body text-ink">
        Next, Android will ask for Health Connect read access. You can revoke
        this anytime in system settings.
      </Text>
      {error ? (
        <Text className="mb-sm text-caption text-danger">{error}</Text>
      ) : null}
      {message ? (
        <Text className="mb-sm text-caption text-muted">{message}</Text>
      ) : null}
      <Button
        label="Continue to permissions"
        className="mt-lg"
        onPress={onContinue}
        disabled={busy}
        busy={busy}
      />
      <Text className="mb-sm mt-xl text-heading font-semibold text-ink">
        Settings
      </Text>
      <AppearanceToggle />
    </Screen>
  );
}
