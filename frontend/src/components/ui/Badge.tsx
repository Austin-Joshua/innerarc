import { Text, View } from "react-native";

type BadgeTone = "accent" | "success" | "warning" | "danger" | "neutral";

type BadgeProps = {
  label: string;
  tone?: BadgeTone;
  className?: string;
};

const toneClass: Record<BadgeTone, string> = {
  accent: "bg-accent-soft border-accent",
  success: "bg-success-muted border-success",
  warning: "bg-warning-muted border-warning",
  danger: "bg-danger-muted border-danger",
  neutral: "bg-surface border-border",
};

const labelClass: Record<BadgeTone, string> = {
  accent: "text-accent",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  neutral: "text-muted",
};

export function Badge({ label, tone = "accent", className = "" }: BadgeProps) {
  return (
    <View
      className={`self-start rounded-sm border px-sm py-xxs ${toneClass[tone]} ${className}`.trim()}
    >
      <Text className={`text-caption font-semibold ${labelClass[tone]}`}>
        {label}
      </Text>
    </View>
  );
}
