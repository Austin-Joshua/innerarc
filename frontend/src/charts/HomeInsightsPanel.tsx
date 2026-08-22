import { Pressable } from "react-native";

import { GamificationState } from "../api";
import { AppText, Card } from "../components/ui";
import { ResponsiveGrid } from "../components/layout";
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

export function HomeInsightsPanel({
  gamification,
  mealCount,
  workoutsLogged = 1,
  onReport,
}: Props) {
  const { colors } = useTheme();

  const tiles = [
    {
      label: "Streak",
      value: `${gamification.streak_count} days`,
      detail: "Keep logging daily",
      color: colors.ringStreak,
      report: streakReport(gamification),
    },
    {
      label: "Points",
      value: gamification.points.toLocaleString(),
      detail: `${gamification.badges_earned.length} badges earned`,
      color: colors.accentBright,
      report: pointsReport(gamification),
    },
    {
      label: "Meals",
      value: `${mealCount}`,
      detail: "Logged today",
      color: colors.ringSecondary,
      report: mealsInsightReport(mealCount),
    },
    {
      label: "Workouts",
      value: `${workoutsLogged}`,
      detail: "This week",
      color: colors.accent,
      report: workoutsInsightReport(workoutsLogged),
    },
  ];

  return (
    <ResponsiveGrid desktopCols={2} equalWidth className="mb-md w-full">
      {tiles.map((tile) => (
        <Pressable
          key={tile.label}
          onPress={() => onReport(tile.report)}
          accessibilityRole="button"
          className={INTERACTIVE_CARD_PRESSABLE}
        >
          <Card interactive variant="elevated" className="h-full p-md">
            <AppText variant="overline" muted>
              {tile.label}
            </AppText>
            <AppText variant="numeral" className="mt-xs" style={{ color: tile.color }}>
              {tile.value}
            </AppText>
            <AppText variant="caption" muted className="mt-xxs">
              {tile.detail}
            </AppText>
          </Card>
        </Pressable>
      ))}
    </ResponsiveGrid>
  );
}
