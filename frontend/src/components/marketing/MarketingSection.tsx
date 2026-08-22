import { PropsWithChildren, ReactNode } from "react";
import { View } from "react-native";

type MarketingSectionProps = PropsWithChildren<{
  className?: string;
  /** Center section headings and body copy. */
  centered?: boolean;
  header?: ReactNode;
  /** Tighter vertical padding for bands (stats strip). */
  compact?: boolean;
}>;

/** Consistent landing-page section rhythm — prevents crowding and overlap. */
export function MarketingSection({
  children,
  className = "",
  centered = false,
  header,
  compact = false,
}: MarketingSectionProps) {
  const py = compact ? "py-lg" : "py-xxl";

  return (
    <View className={`w-full ${py} ${className}`.trim()}>
      <View
        className={`mx-auto w-full max-w-wide px-lg ${
          centered ? "items-center" : ""
        }`.trim()}
      >
        {header}
        {children}
      </View>
    </View>
  );
}
