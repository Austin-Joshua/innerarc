import { PropsWithChildren } from "react";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

type AnimatedSectionProps = PropsWithChildren<{
  delay?: number;
  direction?: "up" | "down";
  className?: string;
}>;

export function AnimatedSection({
  children,
  delay = 0,
  direction = "up",
  className = "",
}: AnimatedSectionProps) {
  const entering =
    direction === "down"
      ? FadeInDown.delay(delay).duration(520).springify()
      : FadeInUp.delay(delay).duration(520).springify();

  return (
    <Animated.View entering={entering} className={className}>
      {children}
    </Animated.View>
  );
}
