import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";

import { useWearableSync } from "../../context/WearableSyncContext";
import { navigateDrawer } from "../../navigation/navHelpers";
import { MainDrawerParamList } from "../../navigation/types";
import { useTheme } from "../../ThemeProvider";
import { AppText, Button } from "../ui";
import { INTERACTIVE_NAV } from "../ui/interactiveStyles";
import { TitleBarDropdown } from "./TitleBarDropdown";
import { LAST_SYNC_KEY } from "../../screens/WearableConnectScreen";

function formatLastSync(iso: string | null) {
  if (!iso) return "Not synced yet";
  try {
    return new Date(iso).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "Recently synced";
  }
}

export function SyncDevicesButton() {
  const navigation = useNavigation<DrawerNavigationProp<MainDrawerParamList>>();
  const { colors } = useTheme();
  const { syncBusy, syncMsg, needsConnect, lastSyncedAt, syncNow, clearSyncMsg } =
    useWearableSync();
  const [open, setOpen] = useState(false);
  const [storedSync, setStoredSync] = useState<string | null>(lastSyncedAt);

  useEffect(() => {
    void AsyncStorage.getItem(LAST_SYNC_KEY).then((v) => {
      if (v) setStoredSync(v);
    });
  }, [lastSyncedAt]);

  const lastLabel = formatLastSync(lastSyncedAt ?? storedSync);

  return (
    <>
      <Pressable
        onPress={() => {
          clearSyncMsg();
          setOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel="Sync devices"
        hitSlop={8}
        className={`rounded-md p-xs ${INTERACTIVE_NAV}`}
      >
        {syncBusy ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : (
          <Ionicons name="watch-outline" size={20} color={colors.accent} />
        )}
      </Pressable>

      <TitleBarDropdown open={open} onClose={() => setOpen(false)} width={240}>
        <View className="border-b border-border px-sm py-xs">
          <AppText variant="label">Sync devices</AppText>
        </View>
        <View className="px-sm py-sm">
          <AppText variant="caption" muted className="mb-sm">
            Pull steps, heart rate, and sleep from Health Connect.
          </AppText>
          <AppText variant="overline" muted>
            Last sync
          </AppText>
          <AppText variant="caption" className="mb-md">
            {lastLabel}
          </AppText>
          {syncMsg ? (
            <AppText variant="caption" className="mb-sm text-accent">
              {syncMsg}
            </AppText>
          ) : null}
          <Button
            label={syncBusy ? "Syncing…" : "Sync now"}
            onPress={() => void syncNow()}
            disabled={syncBusy}
            busy={syncBusy}
          />
          {needsConnect ? (
            <Button
              label="Open Connections"
              variant="secondary"
              className="mt-sm"
              onPress={() => {
                setOpen(false);
                navigateDrawer(navigation, "WearableConnect");
              }}
            />
          ) : null}
        </View>
      </TitleBarDropdown>
    </>
  );
}
