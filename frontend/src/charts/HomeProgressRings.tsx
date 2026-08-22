import { Pressable, useWindowDimensions, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

import { Dashboard } from "../api";
import { AppText, Card } from "../components/ui";
import { INTERACTIVE_CARD_PRESSABLE } from "../components/ui/interactiveStyles";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { useTheme } from "../ThemeProvider";

type Props = {
  data: Dashboard;
  streakCount: number;
  wide?: boolean;
  /** Mobile hero — fills width, rings scale to screen. */
  mobileHero?: boolean;
  onPress?: () => void;
};

function ringLayout(wide: boolean, mobileHero: boolean, maxWidth: number) {
  if (mobileHero) {
    const size = Math.min(maxWidth - 24, 260);
    const center = size / 2;
    const stroke = 12;
    const gap = 10;
    const outer = size * 0.42;
    const radii = [
      outer,
      outer - (stroke + gap),
      outer - 2 * (stroke + gap),
    ] as const;
    return { size, center, stroke, radii };
  }

  const size = wide ? 272 : Math.min(maxWidth - 24, 220);
  const center = size / 2;
  const stroke = wide ? 14 : 10;
  const gap = wide ? 13 : 9;
  const outer = wide ? 118 : size * 0.4;
  const radii = [
    outer,
    outer - (stroke + gap),
    outer - 2 * (stroke + gap),
  ] as const;
  return { size, center, stroke, radii };
}

function clampProgress(logged: number, target: number) {
  if (target <= 0) return 0;
  return Math.min(1, Math.max(0, logged / target));
}

function RingArc({
  radius,
  progress,
  fill,
  track,
  center,
  stroke,
}: {
  radius: number;
  progress: number;
  fill: string;
  track: string;
  center: number;
  stroke: number;
}) {
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <G transform={`rotate(-90 ${center} ${center})`}>
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke={track}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        opacity={0.35}
      />
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke={fill}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={strokeDashoffset}
      />
    </G>
  );
}

function RingLegend({
  color,
  label,
  value,
  compact,
}: {
  color: string;
  label: string;
  value: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <View className="min-w-0 flex-1 items-center px-xxs">
        <View
          className="mb-xxs h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <AppText variant="overline" muted numberOfLines={1}>
          {label}
        </AppText>
        <AppText variant="caption" className="text-center font-semibold" numberOfLines={1}>
          {value}
        </AppText>
      </View>
    );
  }

  return (
    <View className="mb-xs mr-md min-w-[88px] flex-row items-center">
      <View
        className="mr-xs h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <View>
        <AppText variant="overline" muted>
          {label}
        </AppText>
        <AppText variant="caption" className="font-semibold text-ink">
          {value}
        </AppText>
      </View>
    </View>
  );
}

export function HomeProgressRings({
  data,
  streakCount,
  wide = false,
  mobileHero = false,
  onPress,
}: Props) {
  const { colors } = useTheme();
  const { width: screenW } = useWindowDimensions();
  const { isMobile } = useBreakpoint();

  const contentW = screenW - (isMobile ? 64 : 48);
  const { size, center, stroke, radii } = ringLayout(wide, mobileHero, contentW);
  const calLogged = Math.max(0, data.logged.calories);
  const calTarget = Math.max(0, data.target.calories);
  const proteinLogged = Math.max(0, data.logged.protein_g);
  const proteinTarget = Math.max(0, data.target.protein_g);
  const streakTarget = 7;

  const calProgress = clampProgress(calLogged, calTarget);
  const proteinProgress = clampProgress(proteinLogged, proteinTarget);
  const streakProgress = clampProgress(streakCount, streakTarget);

  const innerDiameter = radii[2] * 2;
  const centerNumSize = mobileHero ? 28 : wide ? 26 : 20;

  const body = (
    <View className={`w-full items-center ${mobileHero ? "py-sm" : ""}`}>
      <View
        style={{
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Svg width={size} height={size}>
          <RingArc
            radius={radii[0]}
            progress={calProgress}
            fill={colors.accentBright}
            track={colors.ringTrack}
            center={center}
            stroke={stroke}
          />
          <RingArc
            radius={radii[1]}
            progress={proteinProgress}
            fill={colors.ringSecondary}
            track={colors.ringTrack}
            center={center}
            stroke={stroke}
          />
          <RingArc
            radius={radii[2]}
            progress={streakProgress}
            fill={colors.ringStreak}
            track={colors.ringTrack}
            center={center}
            stroke={stroke}
          />
        </Svg>
        <View
          style={{
            position: "absolute",
            alignItems: "center",
            justifyContent: "center",
            maxWidth: innerDiameter - stroke * 2,
            paddingHorizontal: 4,
          }}
        >
          <AppText
            variant="numeral"
            style={{
              fontSize: centerNumSize,
              lineHeight: centerNumSize + 4,
              color: colors.accentBright,
              textAlign: "center",
            }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {Math.round(calLogged)}
          </AppText>
          <AppText variant="overline" muted className="text-center">
            kcal today
          </AppText>
        </View>
      </View>

      <View
        className={`mt-md w-full ${
          mobileHero ? "flex-row px-xs" : "flex-row flex-wrap justify-center px-sm"
        }`}
      >
        <RingLegend
          compact={mobileHero}
          color={colors.accentBright}
          label="Calories"
          value={`${Math.round(calProgress * 100)}%`}
        />
        <RingLegend
          compact={mobileHero}
          color={colors.ringSecondary}
          label="Protein"
          value={`${Math.round(proteinLogged)}g`}
        />
        <RingLegend
          compact={mobileHero}
          color={colors.ringStreak}
          label="Streak"
          value={`${streakCount}d`}
        />
      </View>

      {mobileHero ? (
        <AppText variant="caption" muted className="mt-sm text-center">
          Tap for today&apos;s nutrition report
        </AppText>
      ) : null}
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className={`w-full ${INTERACTIVE_CARD_PRESSABLE}`}
    >
      <Card interactive variant="elevated" className="w-full overflow-hidden p-md">
        {mobileHero ? (
          <AppText variant="overline" muted className="mb-sm">
            Today&apos;s progress
          </AppText>
        ) : null}
        {body}
      </Card>
    </Pressable>
  );
}
