import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "../../ThemeProvider";
import { ThemePreference } from "../../theme";
import { INTERACTIVE_NAV } from "./interactiveStyles";
import { AppText } from "./AppText";

const THEME_ICONS = {
  light: "sunny-outline",
  dark: "moon-outline",
} as const satisfies Record<"light" | "dark", keyof typeof Ionicons.glyphMap>;

const THEME_LABELS = {
  light: "Light mode",
  dark: "Dark mode",
} as const;

type AppearanceToggleProps = {
  compact?: boolean;
  icon?: boolean;
  /** Apple Fitness mobile header styling. */
  fitness?: boolean;
};

function effectiveMode(
  preference: ThemePreference,
  isDark: boolean,
): "light" | "dark" {
  if (preference === "system") return isDark ? "dark" : "light";
  return preference;
}

type AppearanceTogglePropsWithTheme = AppearanceToggleProps;

export function AppearanceToggle({
  compact = false,
  icon = false,
  fitness = false,
}: AppearanceTogglePropsWithTheme) {
  const { preference, setPreference, colors, isDark } = useTheme();
  const mode = effectiveMode(preference, isDark);
  const iconColor = fitness ? colors.accentBright : colors.accent;

  const toggle = () => {
    setPreference(mode === "dark" ? "light" : "dark");
  };

  if (icon) {
    return (
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityLabel={`${THEME_LABELS[mode]}. Tap to switch.`}
        hitSlop={8}
        className={`rounded-md p-xs ${INTERACTIVE_NAV}`}
      >
        <Ionicons name={THEME_ICONS[mode]} size={fitness ? 24 : 22} color={iconColor} />
      </Pressable>
    );
  }

  return (
    <View className={compact ? "max-w-xs" : undefined}>
      {!compact ? (
        <AppText variant="label" className="mb-sm">
          Theme
        </AppText>
      ) : null}
      <View className="flex-row gap-xxs">
        {(["light", "dark"] as const).map((option) => {
          const selected = mode === option;
          return (
            <Pressable
              key={option}
              onPress={() => setPreference(option)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              className={`flex-1 items-center rounded-md border px-sm py-sm ${
                selected
                  ? "border-accent bg-accent-soft"
                  : "border-border bg-elevated"
              }`}
            >
              <Text
                className={`text-caption font-semibold capitalize ${
                  selected ? "text-accent" : "text-ink"
                }`}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function AppearanceShortcut() {
  return null;
}
