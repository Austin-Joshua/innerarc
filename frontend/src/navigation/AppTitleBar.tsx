import { Ionicons } from "@expo/vector-icons";
import { DrawerHeaderProps } from "@react-navigation/drawer";
import { DrawerActions } from "@react-navigation/native";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NotificationBellButton } from "../components/layout/NotificationBellButton";
import { ProfileMenuButton } from "../components/layout/ProfileMenuButton";
import { SyncDevicesButton } from "../components/layout/SyncDevicesButton";
import { AppearanceToggle } from "../components/ui";
import { AppText } from "../components/ui/AppText";
import { INTERACTIVE_NAV } from "../components/ui/interactiveStyles";
import { useTheme } from "../ThemeProvider";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { goToHome } from "./navHelpers";

export function AppTitleBar({ navigation }: DrawerHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { isMobile, isAtLeastMd } = useBreakpoint();

  const onTitlePress = () => {
    goToHome(navigation);
  };

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <View
      className="border-b border-border bg-elevated px-md pb-sm"
      style={{ paddingTop: insets.top + 8 }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-sm">
          {isMobile ? (
            <Pressable
              onPress={openDrawer}
              accessibilityRole="button"
              accessibilityLabel="Open menu"
              hitSlop={12}
              className={`rounded-md p-xs ${INTERACTIVE_NAV}`}
            >
              <Ionicons name="menu" size={24} color={colors.text} />
            </Pressable>
          ) : null}
          <Pressable
            onPress={onTitlePress}
            accessibilityRole="button"
            accessibilityLabel="Innerarc, back to Home"
          >
            <AppText variant="wordmark" accent>
              Innerarc
            </AppText>
          </Pressable>
        </View>

        <View className="flex-row items-center gap-sm">
          <SyncDevicesButton />
          {isAtLeastMd ? (
            <>
              <NotificationBellButton />
              <AppearanceToggle icon />
            </>
          ) : null}
          <ProfileMenuButton />
        </View>
      </View>
    </View>
  );
}
