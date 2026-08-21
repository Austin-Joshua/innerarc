import { ActivityIndicator, Pressable, Text } from "react-native";

import { useTheme } from "../../ThemeProvider";

type Variant = "primary" | "secondary" | "destructive";

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  busy?: boolean;
  className?: string;
};

const variantClass: Record<Variant, string> = {
  primary: "bg-accent border border-accent",
  secondary: "bg-transparent border border-border",
  destructive: "bg-danger-muted border border-danger",
};

const labelClass: Record<Variant, string> = {
  primary: "text-white",
  secondary: "text-accent",
  destructive: "text-danger",
};

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  busy = false,
  className = "",
}: ButtonProps) {
  const { colors } = useTheme();
  const inactive = disabled || busy;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      className={`items-center rounded-md px-md py-md ${variantClass[variant]} ${inactive ? "opacity-50" : ""} ${className}`.trim()}
    >
      {busy ? (
        <ActivityIndicator
          color={variant === "primary" ? colors.white : colors.accent}
        />
      ) : (
        <Text className={`text-body font-semibold ${labelClass[variant]}`}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
