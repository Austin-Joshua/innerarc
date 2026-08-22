import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "../ui/AppText";
import { useTheme } from "../../ThemeProvider";
import { FITNESS_MOBILE } from "./fitnessMobileTheme";
import { MainTabParamList } from "../../navigation/types";

const TAB_LABELS: Record<keyof MainTabParamList, string> = {
  Home: "Summary",
  LogMeal: "Nutrition",
  Workouts: "Workout",
  Progress: "Progress",
  Coach: "Coach",
};

const TAB_ICONS: Record<
  keyof MainTabParamList,
  { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }
> = {
  Home: { active: "radio-button-on", inactive: "radio-button-off-outline" },
  LogMeal: { active: "restaurant", inactive: "restaurant-outline" },
  Workouts: { active: "barbell", inactive: "barbell-outline" },
  Progress: { active: "camera", inactive: "camera-outline" },
  Coach: { active: "chatbubble-ellipses", inactive: "chatbubble-ellipses-outline" },
};

export function FitnessMobileTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View
      className="px-md"
      style={{ paddingBottom: Math.max(insets.bottom, 8), backgroundColor: colors.background }}
    >
      <View
        className="flex-row items-center justify-around px-sm py-xs"
        style={{
          height: FITNESS_MOBILE.tabBarHeight,
          borderRadius: FITNESS_MOBILE.tabBarRadius,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const name = route.name as keyof MainTabParamList;
          const icons = TAB_ICONS[name];
          const iconName = focused ? icons.active : icons.inactive;
          const label = TAB_LABELS[name];

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              className="min-w-0 flex-1 items-center justify-center py-xs"
            >
              <View
                className="mb-xxs items-center justify-center rounded-full"
                style={{
                  width: 36,
                  height: 36,
                  backgroundColor: focused ? `${colors.accentBright}22` : "transparent",
                }}
              >
                <Ionicons
                  name={iconName}
                  size={22}
                  color={focused ? colors.accentBright : colors.textMuted}
                />
              </View>
              <AppText
                variant="overline"
                numberOfLines={1}
                style={{
                  color: focused ? colors.accentBright : colors.textMuted,
                  fontSize: 9,
                }}
              >
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
