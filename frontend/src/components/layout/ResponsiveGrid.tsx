import { Children, PropsWithChildren, ReactElement } from "react";
import { View } from "react-native";

import { useBreakpoint } from "../../hooks/useBreakpoint";

type ResponsiveGridProps = PropsWithChildren<{
  className?: string;
  gapClassName?: string;
  desktopCols?: 2 | 3 | 4 | 5;
  /** Stretch items to fill each row evenly (better in nested columns). */
  equalWidth?: boolean;
}>;

const DESKTOP_BASIS: Record<2 | 3 | 4 | 5, string> = {
  2: "w-[48%]",
  3: "w-[31.5%]",
  4: "w-[23.5%]",
  5: "w-[18.4%]",
};

/** 1 col mobile · 2 col tablet · 3–5 col desktop. */
export function ResponsiveGrid({
  children,
  className = "",
  gapClassName = "gap-sm",
  desktopCols = 3,
  equalWidth = false,
}: ResponsiveGridProps) {
  const { isMobile, isTablet } = useBreakpoint();
  const cols = isMobile ? 1 : isTablet ? 2 : desktopCols;
  const basis =
    cols === 1 ? "w-full" : cols === 2 ? "w-[48%]" : DESKTOP_BASIS[desktopCols];

  const childCount = Children.count(children);
  const flexMin =
    cols === 5 ? "18%" : cols === 4 ? "23%" : cols === 3 ? "30%" : "48%";

  return (
    <View className={`flex-row flex-wrap ${gapClassName} ${className}`.trim()}>
      {Children.map(children, (child, index) => (
        <View
          key={index}
          className={equalWidth && cols > 1 ? undefined : basis}
          style={
            equalWidth && cols > 1
              ? {
                  flexGrow: 1,
                  flexShrink: 0,
                  flexBasis: flexMin,
                  maxWidth:
                    childCount <= cols
                      ? `${Math.floor(100 / childCount) - 2}%`
                      : flexMin,
                }
              : undefined
          }
        >
          {child as ReactElement}
        </View>
      ))}
    </View>
  );
}
