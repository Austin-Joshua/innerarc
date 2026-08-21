import { Pressable, Text, View } from "react-native";

import { useTheme } from "../../ThemeProvider";
import { ThemePreference } from "../../theme";

const OPTIONS: ThemePreference[] = ["system", "light", "dark"];

/** Segmented System / Light / Dark — used on Connections. */
export function AppearanceToggle() {
  const { preference, setPreference } = useTheme();

  return (
    <View>
      <Text className="mb-xs text-caption text-muted">Appearance</Text>
      <View className="flex-row gap-sm">
        {OPTIONS.map((option) => {
          const selected = preference === option;
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
      <Text className="mt-xs text-caption text-muted">
        System follows the device setting. Your choice is saved on this device.
      </Text>
    </View>
  );
}
