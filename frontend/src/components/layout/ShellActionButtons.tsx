import { View } from "react-native";

import { NotificationBellButton } from "./NotificationBellButton";
import { ProfileMenuButton } from "./ProfileMenuButton";
import { SyncDevicesButton } from "./SyncDevicesButton";
import { AppearanceToggle } from "../ui";

/** Sync, notifications, theme, and profile — single chrome cluster for all breakpoints. */
export function ShellActionButtons() {
  return (
    <View className="flex-row items-center gap-xs">
      <SyncDevicesButton />
      <NotificationBellButton variant="fitness" />
      <AppearanceToggle icon fitness />
      <ProfileMenuButton />
    </View>
  );
}
