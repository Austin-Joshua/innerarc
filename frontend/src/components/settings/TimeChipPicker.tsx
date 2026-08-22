import { Pressable, View } from "react-native";

import {
  formatReminderLabel,
  REMINDER_TIME_OPTIONS,
} from "../../settings/appSettings";
import { AppText } from "../ui/AppText";

type TimeChipPickerProps = {
  label: string;
  value: string;
  onChange: (time: string) => void;
  enabled?: boolean;
};

export function TimeChipPicker({
  label,
  value,
  onChange,
  enabled = true,
}: TimeChipPickerProps) {
  return (
    <View className="mb-md">
      <AppText variant="label" className="mb-sm">
        {label}
      </AppText>
      <View className="flex-row flex-wrap gap-xs">
        {REMINDER_TIME_OPTIONS.map((time) => {
          const selected = value === time;
          return (
            <Pressable
              key={time}
              disabled={!enabled}
              onPress={() => onChange(time)}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled: !enabled }}
              className={`rounded-full border px-md py-xs ${
                selected
                  ? "border-accent bg-accent-soft"
                  : "border-border bg-elevated"
              } ${!enabled ? "opacity-40" : ""}`}
            >
              <AppText
                variant="caption"
                className={`font-semibold ${selected ? "text-accent" : ""}`}
              >
                {formatReminderLabel(time)}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
