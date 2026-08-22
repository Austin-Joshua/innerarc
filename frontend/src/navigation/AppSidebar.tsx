import { Ionicons } from "@expo/vector-icons";
import {
  DrawerContentComponentProps,
} from "@react-navigation/drawer";
import { DrawerActions } from "@react-navigation/native";
import { useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { signOut } from "../authFlow";
import { AppearanceToggle, AppText, Button, Card } from "../components/ui";
import { NotificationBellButton } from "../components/layout/NotificationBellButton";
import { INTERACTIVE_NAV } from "../components/ui/interactiveStyles";
import { useTheme } from "../ThemeProvider";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { getRootNavigation } from "./navHelpers";
import { useSidebarLayout } from "./SidebarLayoutContext";

type NavItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: (props: DrawerContentComponentProps) => void;
};

const PRIMARY: NavItem[] = [
  {
    label: "Home",
    icon: "home-outline",
    onPress: ({ navigation }) => {
      navigation.navigate("Tabs", { screen: "Home" });
      navigation.dispatch(DrawerActions.closeDrawer());
    },
  },
  {
    label: "Log Meal",
    icon: "restaurant-outline",
    onPress: ({ navigation }) => {
      navigation.navigate("Tabs", {
        screen: "LogMeal",
        params: { screen: "FoodCapture" },
      });
      navigation.dispatch(DrawerActions.closeDrawer());
    },
  },
  {
    label: "Workouts",
    icon: "barbell-outline",
    onPress: ({ navigation }) => {
      navigation.navigate("Tabs", {
        screen: "Workouts",
        params: { screen: "WorkoutLibrary" },
      });
      navigation.dispatch(DrawerActions.closeDrawer());
    },
  },
  {
    label: "Progress",
    icon: "camera-outline",
    onPress: ({ navigation }) => {
      navigation.navigate("Tabs", {
        screen: "Progress",
        params: { screen: "ProgressCapture" },
      });
      navigation.dispatch(DrawerActions.closeDrawer());
    },
  },
  {
    label: "Coach",
    icon: "chatbubble-ellipses-outline",
    onPress: ({ navigation }) => {
      navigation.navigate("Tabs", { screen: "Coach" });
      navigation.dispatch(DrawerActions.closeDrawer());
    },
  },
];

const SECONDARY: NavItem[] = [
  {
    label: "Connections",
    icon: "watch-outline",
    onPress: ({ navigation }) => {
      navigation.navigate("WearableConnect");
      navigation.dispatch(DrawerActions.closeDrawer());
    },
  },
  {
    label: "Profile",
    icon: "person-outline",
    onPress: ({ navigation }) => {
      navigation.navigate("Profile");
      navigation.dispatch(DrawerActions.closeDrawer());
    },
  },
  {
    label: "Settings",
    icon: "settings-outline",
    onPress: ({ navigation }) => {
      navigation.navigate("Settings");
      navigation.dispatch(DrawerActions.closeDrawer());
    },
  },
];

function SidebarItem({
  item,
  props,
  collapsed,
  destructive,
  onPress,
}: {
  item: NavItem;
  props: DrawerContentComponentProps;
  collapsed: boolean;
  destructive?: boolean;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => {
        if (onPress) {
          onPress();
          return;
        }
        item.onPress(props);
      }}
      accessibilityRole="button"
      accessibilityLabel={item.label}
      className={`mb-xxs flex-row items-center rounded-md py-xs ${INTERACTIVE_NAV} ${
        collapsed ? "justify-center px-xs" : "px-sm"
      }`}
    >
      <Ionicons
        name={item.icon}
        size={19}
        color={destructive ? colors.danger : colors.accent}
      />
      {!collapsed ? (
        <AppText
          variant="body"
          className={`ml-sm ${destructive ? "text-danger" : ""}`}
        >
          {item.label}
        </AppText>
      ) : null}
    </Pressable>
  );
}

export function AppSidebar(props: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { isMobile } = useBreakpoint();
  const { collapsed, toggleCollapsed } = useSidebarLayout();
  const narrow = !isMobile && collapsed;
  const [signOutOpen, setSignOutOpen] = useState(false);

  const onMenuPress = () => {
    if (isMobile) {
      props.navigation.dispatch(DrawerActions.closeDrawer());
      return;
    }
    toggleCollapsed();
  };

  const confirmSignOut = () => {
    setSignOutOpen(false);
    props.navigation.dispatch(DrawerActions.closeDrawer());
    signOut(getRootNavigation(props.navigation) as never);
  };

  const signOutItem: NavItem = {
    label: "Sign out",
    icon: "log-out-outline",
    onPress: () => {},
  };

  return (
    <>
      <View
        className="flex-1 bg-elevated"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <View className={`flex-1 ${narrow ? "px-xs py-sm" : "px-sm py-md"}`}>
          <View
            className={`mb-sm flex-row items-center ${narrow ? "justify-center" : ""}`}
          >
            <Pressable
              onPress={onMenuPress}
              accessibilityRole="button"
              accessibilityLabel={
                isMobile
                  ? "Close menu"
                  : collapsed
                    ? "Expand sidebar"
                    : "Collapse sidebar"
              }
              hitSlop={12}
              className={`rounded-md p-xs ${INTERACTIVE_NAV}`}
            >
              <Ionicons name="menu" size={20} color={colors.text} />
            </Pressable>
          </View>

          {PRIMARY.map((item) => (
            <SidebarItem
              key={item.label}
              item={item}
              props={props}
              collapsed={narrow}
            />
          ))}

          <View className={narrow ? "mt-sm" : "mt-md"} />

          {SECONDARY.map((item) => (
            <SidebarItem
              key={item.label}
              item={item}
              props={props}
              collapsed={narrow}
            />
          ))}

          {isMobile ? (
            <View className="mt-auto flex-row items-center gap-md pt-lg">
              <NotificationBellButton />
              <AppearanceToggle icon />
            </View>
          ) : null}
        </View>

        <View
          className={`border-t border-border ${narrow ? "px-xs py-sm" : "px-sm py-md"}`}
        >
          <SidebarItem
            item={signOutItem}
            props={props}
            collapsed={narrow}
            destructive
            onPress={() => setSignOutOpen(true)}
          />
        </View>
      </View>

      <Modal
        transparent
        visible={signOutOpen}
        animationType="fade"
        onRequestClose={() => setSignOutOpen(false)}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/40 px-lg"
          onPress={() => setSignOutOpen(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Card variant="elevated" className="w-full min-w-[280px] max-w-sm">
              <AppText variant="heading">Sign out?</AppText>
          <AppText variant="body" muted className="mb-lg mt-xs">
                Sign out and return to login?
              </AppText>
              <Button
                label="Cancel"
                variant="secondary"
                onPress={() => setSignOutOpen(false)}
              />
              <Button
                label="Sign out"
                variant="destructive"
                className="mt-sm"
                onPress={confirmSignOut}
              />
            </Card>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
