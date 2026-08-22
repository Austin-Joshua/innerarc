import { PropsWithChildren } from "react";
import { View, ViewStyle } from "react-native";

import { useBreakpoint } from "../../hooks/useBreakpoint";

export function useActionMaxWidth(): number {
  const { width, tier } = useBreakpoint();
  if (tier === "desktop") return 340;
  if (tier === "tablet") return 300;
  return Math.min(280, width - 48);
}

type ActionStackProps = PropsWithChildren<{
  className?: string;
  align?: "center" | "start";
}>;

/** Responsive max-width column for buttons and form actions. */
export function ActionStack({
  children,
  className = "",
  align = "center",
}: ActionStackProps) {
  const maxWidth = useActionMaxWidth();
  const style: ViewStyle = {
    width: "100%",
    maxWidth,
    alignSelf: align === "center" ? "center" : "flex-start",
  };

  return (
    <View style={style} className={className}>
      {children}
    </View>
  );
}
