import { PropsWithChildren } from "react";
import { View } from "react-native";

import { INTERACTIVE_CARD } from "./interactiveStyles";

export type CardVariant = "elevated" | "surface" | "accent" | "outline";

type CardProps = PropsWithChildren<{
  variant?: CardVariant;
  /** Pair with a parent Pressable that has `group` for fine-pointer hover. */
  interactive?: boolean;
  className?: string;
}>;

const variantClass: Record<CardVariant, string> = {
  elevated: "border-border bg-elevated",
  surface: "border-border bg-surface",
  accent: "border-accent/50 bg-elevated",
  outline: "border-border bg-transparent",
};

export function Card({
  children,
  variant = "elevated",
  interactive = false,
  className = "",
}: CardProps) {
  return (
    <View
      className={`rounded-lg border p-md ${variantClass[variant]} ${interactive ? INTERACTIVE_CARD : ""} ${className}`.trim()}
    >
      {children}
    </View>
  );
}
