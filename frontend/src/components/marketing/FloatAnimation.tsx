import { PropsWithChildren, useEffect } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

type FloatAnimationProps = PropsWithChildren<{
  amplitude?: number;
  duration?: number;
  className?: string;
}>;

/** Gentle floating motion for hero mockups — Nexora-style product showcase. */
export function FloatAnimation({
  children,
  amplitude = 10,
  duration = 2800,
  className = "",
}: FloatAnimationProps) {
  const offset = useSharedValue(0);

  useEffect(() => {
    offset.value = withRepeat(
      withTiming(-amplitude, {
        duration,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
  }, [amplitude, duration, offset]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  return (
    <Animated.View style={style} className={className}>
      {children}
    </Animated.View>
  );
}
