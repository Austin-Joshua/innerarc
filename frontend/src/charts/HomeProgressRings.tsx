import { Text, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

import { Dashboard } from "../api";
import { useTheme } from "../ThemeProvider";
import { spacing } from "../theme";

type Props = {
  data: Dashboard;
  streakCount: number;
};

const SIZE = 200;
const CENTER = SIZE / 2;
const STROKE = 12;
const GAP = 10;

/** Outer → middle → inner radii (centerline of each stroke). */
const RADII = [88, 88 - (STROKE + GAP), 88 - 2 * (STROKE + GAP)] as const;

function clampProgress(logged: number, target: number) {
  if (target <= 0) return 0;
  return Math.min(1, Math.max(0, logged / target));
}

function RingArc({
  radius,
  progress,
  fill,
  track,
}: {
  radius: number;
  progress: number;
  fill: string;
  track: string;
}) {
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <G transform={`rotate(-90 ${CENTER} ${CENTER})`}>
      <Circle
        cx={CENTER}
        cy={CENTER}
        r={radius}
        stroke={track}
        strokeWidth={STROKE}
        fill="none"
        strokeLinecap="round"
      />
      <Circle
        cx={CENTER}
        cy={CENTER}
        r={radius}
        stroke={fill}
        strokeWidth={STROKE}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={strokeDashoffset}
      />
    </G>
  );
}

export function HomeProgressRings({ data, streakCount }: Props) {
  const { colors, typography } = useTheme();
  const calLogged = Math.max(0, data.logged.calories);
  const calTarget = Math.max(0, data.target.calories);
  const proteinLogged = Math.max(0, data.logged.protein_g);
  const proteinTarget = Math.max(0, data.target.protein_g);
  const streakTarget = 7;

  const calProgress = clampProgress(calLogged, calTarget);
  const proteinProgress = clampProgress(proteinLogged, proteinTarget);
  const streakProgress = clampProgress(streakCount, streakTarget);

  return (
    <View style={{ alignItems: "center", marginTop: spacing.sm }}>
      <View
        style={{
          width: SIZE,
          height: SIZE,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Svg width={SIZE} height={SIZE}>
          <RingArc
            radius={RADII[0]}
            progress={calProgress}
            fill={colors.accent}
            track={colors.surface}
          />
          <RingArc
            radius={RADII[1]}
            progress={proteinProgress}
            fill={colors.success}
            track={colors.successMuted}
          />
          <RingArc
            radius={RADII[2]}
            progress={streakProgress}
            fill={colors.neutral}
            track={colors.border}
          />
        </Svg>
        <View
          style={{
            position: "absolute",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={typography.numeral}>{Math.round(calLogged)}</Text>
          <Text style={typography.muted}>kcal</Text>
        </View>
      </View>

      <Text
        style={{
          ...typography.body,
          marginTop: spacing.md,
          fontWeight: "700",
          color: colors.text,
        }}
      >
        {Math.round(calLogged)} / {calTarget} kcal
      </Text>
      <Text style={{ ...typography.muted, marginTop: spacing.xxs }}>
        Protein {Math.round(proteinLogged)} / {proteinTarget} g
      </Text>
      <Text style={{ ...typography.muted, marginTop: spacing.xxs }}>
        {streakCount} day streak · of {streakTarget}-day week
      </Text>
      <Text
        style={{
          ...typography.muted,
          marginTop: spacing.sm,
          textAlign: "center",
        }}
      >
        Outer accent: calories · Middle muted green: protein · Inner grey:
        streak
      </Text>
    </View>
  );
}
