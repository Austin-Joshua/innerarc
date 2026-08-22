import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "../ui/AppText";
import { useTheme } from "../../ThemeProvider";
import { BreakpointTier } from "../../hooks/useBreakpoint";
import { fitnessTokens } from "./fitnessLayout";
import { FITNESS_TAB_ICONS, FITNESS_TAB_LABELS } from "./fitnessTabConfig";
import { MainTabParamList } from "../../navigation/types";
import { Ionicons } from "@expo/vector-icons";

type FitnessTabBarProps = BottomTabBarProps & {
  position: "top" | "bottom";
  tier: BreakpointTier;
};

export function FitnessTabBar({ state, navigation, position, tier }: FitnessTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const tokens = fitnessTokens(tier);
  const isTop = position === "top";

  const pill = (
    <View
      className={`flex-row items-center ${isTop ? "self-center px-md py-xs" : "justify-around px-sm py-xs"}`}
      style={{
        height: tokens.tabBarHeight,
        borderRadius: tokens.tabBarRadius,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        maxWidth: isTop ? 560 : undefined,
        width: isTop ? "100%" : undefined,
      }}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const name = route.name as keyof MainTabParamList;
        const icons = FITNESS_TAB_ICONS[name];
        const iconName = focused ? icons.active : icons.inactive;
        const label = FITNESS_TAB_LABELS[name];

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
            className={`min-w-0 flex-1 items-center justify-center ${isTop ? "px-xs py-xs" : "py-xs"}`}
          >
            <View
              className={`items-center justify-center rounded-full ${isTop ? "" : "mb-xxs"}`}
              style={{
                width: isTop ? 32 : 36,
                height: isTop ? 32 : 36,
                backgroundColor: focused ? `${colors.accentBright}22` : "transparent",
              }}
            >
              <Ionicons
                name={iconName}
                size={isTop ? 20 : 22}
                color={focused ? colors.accentBright : colors.textMuted}
              />
            </View>
            {!isTop ? (
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
            ) : (
              <AppText
                variant="caption"
                numberOfLines={1}
                className="mt-xxs font-semibold"
                style={{
                  color: focused ? colors.accentBright : colors.textMuted,
                  fontSize: 11,
                }}
              >
                {label}
              </AppText>
            )}
          </Pressable>
        );
      })}
    </View>
  );

  if (isTop) {
    return (
      <View
        className="items-center px-lg pb-sm pt-xs"
        style={{ backgroundColor: colors.background }}
      >
        {pill}
      </View>
    );
  }

  return (
    <View
      className="px-md"
      style={{ paddingBottom: Math.max(insets.bottom, 8), backgroundColor: colors.background }}
    >
      {pill}
    </View>
  );
}
