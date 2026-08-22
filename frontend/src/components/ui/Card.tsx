import { PropsWithChildren } from "react";
import { View } from "react-native";

export type CardVariant = "elevated" | "surface" | "accent" | "outline";

type CardProps = PropsWithChildren<{
  variant?: CardVariant;
  className?: string;
}>;

const variantClass: Record<CardVariant, string> = {
  elevated: "border-border bg-elevated",
  surface: "border-border bg-surface",
  accent: "border-accent/40 bg-accent-soft",
  outline: "border-border bg-transparent",
};

export function Card({
  children,
  variant = "elevated",
  className = "",
}: CardProps) {
  return (
    <View
      className={`rounded-lg border p-md ${variantClass[variant]} ${className}`.trim()}
    >
      {children}
    </View>
  );
}
