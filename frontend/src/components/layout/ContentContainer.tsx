import { PropsWithChildren } from "react";
import { View } from "react-native";

type ContentWidth = "full" | "content" | "prose" | "wide";

type ContentContainerProps = PropsWithChildren<{
  /** full = no max width; content = 720px; prose = 560px (centered on md+). */
  width?: ContentWidth;
  /** Center children horizontally within the container. */
  align?: "start" | "center";
  className?: string;
}>;

const WIDTH_CLASS: Record<Exclude<ContentWidth, "full">, string> = {
  content: "max-w-content",
  prose: "max-w-prose",
  wide: "max-w-wide",
};

export function ContentContainer({
  children,
  width = "content",
  align = "center",
  className = "",
}: ContentContainerProps) {
  const maxClass = width === "full" ? "" : WIDTH_CLASS[width];
  const alignClass = align === "center" ? "items-center" : "";

  return (
    <View className={`w-full self-center ${maxClass} ${alignClass} ${className}`.trim()}>
      {children}
    </View>
  );
}
