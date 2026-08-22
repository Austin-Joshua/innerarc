import { Pressable, View } from "react-native";

import { WeightUnit } from "../../settings/appSettings";
import { AppText } from "../ui/AppText";

type UnitToggleProps = {
  label: string;
  value: WeightUnit;
  onChange: (unit: WeightUnit) => void;
};

export function UnitToggle({ label, value, onChange }: UnitToggleProps) {
  return (
    <View className="mb-md">
      <AppText variant="label" className="mb-sm">
        {label}
      </AppText>
      <View className="flex-row gap-xs">
        {(["kg", "lb"] as const).map((unit) => {
          const selected = value === unit;
          return (
            <Pressable
              key={unit}
              onPress={() => onChange(unit)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              className={`flex-1 items-center rounded-md border py-sm ${
                selected
                  ? "border-accent bg-accent-soft"
                  : "border-border bg-elevated"
              }`}
            >
              <AppText
                variant="bodyStrong"
                className={selected ? "text-accent" : undefined}
              >
                {unit.toUpperCase()}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
