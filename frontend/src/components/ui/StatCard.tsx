import { View } from "react-native";

import { AppText } from "./AppText";

type StatCardProps = {
  value: string | number;
  label: string;
  className?: string;
};

export function StatCard({ value, label, className = "" }: StatCardProps) {
  return (
    <View
      className={`rounded-lg border border-border bg-surface p-lg ${className}`.trim()}
    >
      <AppText variant="numeral">{value}</AppText>
      <AppText variant="caption" className="mt-xxs">
        {label}
      </AppText>
    </View>
  );
}
