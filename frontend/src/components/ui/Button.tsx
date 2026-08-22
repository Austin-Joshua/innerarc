import { ActivityIndicator, Pressable, Text } from "react-native";

import { useTheme } from "../../ThemeProvider";
import { INTERACTIVE_BUTTON, INTERACTIVE_PRIMARY } from "./interactiveStyles";

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
  const interactiveClass = inactive
    ? ""
    : variant === "primary"
      ? INTERACTIVE_PRIMARY
      : INTERACTIVE_BUTTON;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      className={`items-center rounded-full px-lg py-md shadow-sm fine-hover:shadow-md ${variantClass[variant]} ${interactiveClass} ${inactive ? "opacity-50" : ""} ${className}`.trim()}
    >
      {busy ? (
        <ActivityIndicator
          color={variant === "primary" ? colors.white : colors.accent}
        />
      ) : (
        <Text
          accessible={false}
          importantForAccessibility="no"
          className={`text-bodyStrong ${labelClass[variant]}`}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
