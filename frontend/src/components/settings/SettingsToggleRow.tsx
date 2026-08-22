import { Switch, View } from "react-native";

import { useTheme } from "../../ThemeProvider";
import { AppText } from "../ui/AppText";

type SettingsToggleRowProps = {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  fitness?: boolean;
};

export function SettingsToggleRow({
  label,
  description,
  value,
  onValueChange,
  disabled = false,
  fitness = false,
}: SettingsToggleRowProps) {
  const { colors } = useTheme();

  return (
    <View className="flex-row items-center justify-between gap-md border-b border-border py-md last:border-b-0">
      <View className="min-w-0 flex-1">
        <AppText
          variant="bodyStrong"
          style={fitness ? { color: colors.accentBright } : undefined}
        >
          {label}
        </AppText>
        {description ? (
          <AppText variant="caption" muted className="mt-xxs leading-5">
            {description}
          </AppText>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{
          false: colors.ringTrack,
          true: fitness ? colors.accentBright : colors.accent,
        }}
        thumbColor={colors.white}
      />
    </View>
  );
}
