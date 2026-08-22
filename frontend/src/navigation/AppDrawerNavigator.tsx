import { createDrawerNavigator } from "@react-navigation/drawer";

import { NotificationsProvider } from "../context/NotificationsContext";
import { WearableSyncProvider } from "../context/WearableSyncContext";
import { useTheme } from "../ThemeProvider";
import { useBreakpoint } from "../hooks/useBreakpoint";
import ProfileScreen from "../screens/ProfileScreen";
import SettingsScreen from "../screens/SettingsScreen";
import WearableConnectScreen from "../screens/WearableConnectScreen";
import { AppSidebar } from "./AppSidebar";
import { AppTitleBar } from "./AppTitleBar";
import { MainTabNavigator } from "./MainTabNavigator";
import {
  SIDEBAR_WIDTH_COLLAPSED,
  SIDEBAR_WIDTH_EXPANDED,
  SidebarLayoutProvider,
  useSidebarLayout,
} from "./SidebarLayoutContext";
import { MainDrawerParamList } from "./types";

const Drawer = createDrawerNavigator<MainDrawerParamList>();

const FITNESS_SHELL_ROUTES = new Set(["Tabs", "Settings", "Profile", "WearableConnect"]);

function AppDrawerNavigatorInner() {
  const { colors } = useTheme();
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const { collapsed } = useSidebarLayout();
  const useFitnessShell = !isDesktop;

  const drawerWidth = isMobile
    ? SIDEBAR_WIDTH_EXPANDED
    : collapsed
      ? SIDEBAR_WIDTH_COLLAPSED
      : SIDEBAR_WIDTH_EXPANDED;

  return (
    <Drawer.Navigator
      drawerContent={(props) => <AppSidebar {...props} />}
      screenOptions={({ route }) => ({
        header:
          useFitnessShell && FITNESS_SHELL_ROUTES.has(route.name)
            ? undefined
            : (props) => <AppTitleBar {...props} />,
        headerShown: !(useFitnessShell && FITNESS_SHELL_ROUTES.has(route.name)),
        drawerType: isDesktop ? "permanent" : "front",
        swipeEnabled: !isDesktop,
        swipeEdgeWidth: isMobile || isTablet ? 48 : 0,
        drawerStyle: {
          width: drawerWidth,
          backgroundColor: colors.elevated,
          borderRightColor: colors.border,
          borderRightWidth: 1,
        },
        overlayColor: "rgba(0,0,0,0.45)",
        drawerActiveBackgroundColor: "transparent",
        drawerInactiveBackgroundColor: "transparent",
      })}
    >
      <Drawer.Screen
        name="Tabs"
        component={MainTabNavigator}
        options={{ title: "Innerarc" }}
      />
      <Drawer.Screen
        name="WearableConnect"
        component={WearableConnectScreen}
        options={{ title: "Connections" }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "My profile" }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: "Settings" }}
      />
    </Drawer.Navigator>
  );
}

export function AppDrawerNavigator() {
  return (
    <SidebarLayoutProvider>
      <NotificationsProvider>
        <WearableSyncProvider>
          <AppDrawerNavigatorInner />
        </WearableSyncProvider>
      </NotificationsProvider>
    </SidebarLayoutProvider>
  );
}
