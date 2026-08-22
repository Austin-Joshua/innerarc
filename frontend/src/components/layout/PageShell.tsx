import { PropsWithChildren, ReactNode } from "react";
import { View } from "react-native";

import { useBreakpoint } from "../../hooks/useBreakpoint";
import { ContentContainer } from "./ContentContainer";

type PageShellProps = PropsWithChildren<{
  className?: string;
  centeredMobile?: boolean;
}>;

/** Responsive page wrapper — wide on desktop/tablet, content width on mobile. */
export function PageShell({
  children,
  className = "",
  centeredMobile = true,
}: PageShellProps) {
  const { isDesktop, isTablet } = useBreakpoint();
  const width = isDesktop ? "full" : isTablet ? "wide" : "content";
  const align = isDesktop ? "start" : centeredMobile ? "center" : "start";

  return (
    <ContentContainer width={width} align={align} className={className}>
      {children}
    </ContentContainer>
  );
}

type DesktopColumnsProps = {
  left: ReactNode;
  right: ReactNode;
  className?: string;
  gapClassName?: string;
  /** Flex ratio for left column on desktop (default 1). */
  leftFlex?: number;
  rightFlex?: number;
};

/** Side-by-side columns on desktop; stacked on mobile/tablet. */
export function DesktopColumns({
  left,
  right,
  className = "",
  gapClassName = "gap-lg",
  leftFlex = 1,
  rightFlex = 1,
}: DesktopColumnsProps) {
  const { isDesktop, isTablet } = useBreakpoint();
  const sideBySide = isDesktop || isTablet;

  if (!sideBySide) {
    return (
      <View className={`w-full ${className}`.trim()}>
        {left}
        {right}
      </View>
    );
  }

  return (
    <View
      className={`w-full flex-row ${gapClassName} ${className}`.trim()}
    >
      <View style={{ flex: leftFlex }} className="min-w-0">
        {left}
      </View>
      <View style={{ flex: rightFlex }} className="min-w-0">
        {right}
      </View>
    </View>
  );
}
