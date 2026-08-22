import { Pressable, View } from "react-native";

import { GamificationState } from "../api";
import { AppText } from "../components/ui";
import { INTERACTIVE_CARD_PRESSABLE } from "../components/ui/interactiveStyles";
import { useTheme } from "../ThemeProvider";
import {
  HomeReport,
  mealsInsightReport,
  pointsReport,
  streakReport,
  workoutsInsightReport,
} from "./homeReports";

type Props = {
  gamification: GamificationState;
  mealCount: number;
  workoutsLogged?: number;
  onReport: (report: HomeReport) => void;
};

/** One-row mobile stats — compact, no stacked full-width cards. */
export function HomeMobileInsightStrip({
  gamification,
  mealCount,
  workoutsLogged = 1,
  onReport,
}: Props) {
  const { colors } = useTheme();

  const items = [
    {
      label: "Streak",
      value: `${gamification.streak_count}d`,
      color: colors.ringStreak,
      report: streakReport(gamification),
    },
    {
      label: "Points",
      value: gamification.points.toLocaleString(),
      color: colors.accentBright,
      report: pointsReport(gamification),
    },
    {
      label: "Meals",
      value: `${mealCount}`,
      color: colors.ringSecondary,
      report: mealsInsightReport(mealCount),
    },
    {
      label: "Workouts",
      value: `${workoutsLogged}`,
      color: colors.accent,
      report: workoutsInsightReport(workoutsLogged),
    },
  ];

  return (
    <View className="mb-md w-full flex-row gap-xs">
      {items.map((item) => (
        <Pressable
          key={item.label}
          onPress={() => onReport(item.report)}
          accessibilityRole="button"
          className={`min-w-0 flex-1 ${INTERACTIVE_CARD_PRESSABLE}`}
        >
          <View className="items-center rounded-lg border border-border bg-elevated px-xs py-sm">
            <AppText variant="overline" muted numberOfLines={1}>
              {item.label}
            </AppText>
            <AppText
              variant="caption"
              className="mt-xxs font-bold"
              style={{ color: item.color }}
              numberOfLines={1}
            >
              {item.value}
            </AppText>
          </View>
        </Pressable>
      ))}
    </View>
  );
}
