import { PropsWithChildren } from "react";
import { View } from "react-native";

type CardProps = PropsWithChildren<{
  className?: string;
}>;

export function Card({ children, className = "" }: CardProps) {
  return (
    <View
      className={`rounded-lg border border-border bg-white p-md ${className}`.trim()}
    >
      {children}
    </View>
  );
}
