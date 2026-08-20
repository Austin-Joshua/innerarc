import { Text, View } from "react-native";

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
      <Text className="text-numeral font-bold text-ink">{value}</Text>
      <Text className="mt-xxs text-caption text-muted">{label}</Text>
    </View>
  );
}
