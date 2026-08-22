import { DrawerActions } from "@react-navigation/native";
import { CompositeNavigationProp, useNavigation } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { useMemo, useState } from "react";
import { LayoutChangeEvent, Pressable, View } from "react-native";
import { BarChart } from "react-native-gifted-charts";

import { CoachNudge, Dashboard, GamificationState, WearableReading } from "../api";
import { DesktopColumns, ResponsiveGrid } from "../components/layout";
import {
  FitnessListRow,
  FitnessScreenTitle,
  FitnessStatGrid,
} from "../components/fitness/FitnessMobileParts";
import { FitnessListSection } from "../components/fitness/FitnessListSection";
import { fitnessTokens } from "../components/fitness/fitnessLayout";
import {
  FitnessMoveRing,
  FitnessWeekStrip,
} from "../components/fitness/FitnessWeekStrip";
import { AppText, Card } from "../components/ui";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { useTheme } from "../ThemeProvider";
import { RecentActivityItem } from "../homePreviewSeed";
import { MainDrawerParamList, MainTabParamList } from "../navigation/types";
import { navigateWorkoutStack } from "../navigation/navHelpers";
import {
  dayCalorieReport,
  heartRateReport,
  HomeReport,
  macroReport,
  activityReport,
  stepsReport,
  streakReport,
} from "./homeReports";
import { mergeWearablePreview } from "../wearablePreviewSeed";

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "Home">,
  DrawerNavigationProp<MainDrawerParamList>
>;

const WEEK_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

type Props = {
  dashboard: Dashboard;
  gamification: GamificationState;
  nudge: CoachNudge | null;
  onDismissNudge: () => void;
  recentItems: RecentActivityItem[];
  readings: WearableReading[];
  onReport: (report: HomeReport) => void;
};

function activityIcon(item: RecentActivityItem) {
  if (item.icon === "restaurant") return "restaurant-outline" as const;
  if (item.icon === "barbell") return "barbell-outline" as const;
  if (item.icon === "camera") return "camera-outline" as const;
  if (item.icon === "walk") return "footsteps-outline" as const;
  return "moon-outline" as const;
}

function FitnessInlineBars({
  todayCalories,
  targetCalories,
  onDayPress,
  height = 72,
}: {
  todayCalories: number;
  targetCalories: number;
  onDayPress: (index: number, calories: number) => void;
  height?: number;
}) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const base = todayCalories || 1600;

  const values = WEEK_LABELS.map((_, i) => {
    const isToday = i === WEEK_LABELS.length - 1;
    const wobble = Math.sin(i * 1.1) * base * 0.08;
    return Math.round(isToday ? base : base * (0.78 + i * 0.035) + wobble);
  });

  const barCount = WEEK_LABELS.length;
  const spacing = width > 0 ? Math.max(4, Math.floor((width * 0.18) / (barCount - 1))) : 8;
  const barWidth =
    width > 0
      ? Math.max(10, Math.floor((width - spacing * (barCount - 1)) / barCount))
      : 14;

  const data = values.map((v, i) => ({
    value: v,
    frontColor: i === barCount - 1 ? colors.accentBright : `${colors.accentBright}55`,
    onPress: () => onDayPress(i, v),
  }));

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setWidth(w);
  };

  return (
    <View className="mb-lg w-full" onLayout={onLayout}>
      {width > 0 ? (
        <BarChart
          data={data}
          width={width}
          height={height}
          barWidth={barWidth}
          spacing={spacing}
          roundedTop
          roundedBottom
          hideRules
          hideYAxisText
          hideAxesAndRules
          maxValue={Math.max(targetCalories, ...values) * 1.1}
          barBorderRadius={4}
          disableScroll
          isAnimated={false}
        />
      ) : (
        <View style={{ height }} />
      )}
      <View className="mt-xs flex-row justify-between px-xxs">
        {WEEK_LABELS.map((label, i) => (
          <AppText
            key={`${label}-${i}`}
            variant="overline"
            muted
            style={{ width: barWidth, textAlign: "center", fontSize: 9 }}
          >
            {label}
          </AppText>
        ))}
      </View>
    </View>
  );
}

function NudgeCard({
  nudge,
  onDismiss,
}: {
  nudge: CoachNudge;
  onDismiss: () => void;
}) {
  return (
    <Card variant="accent" className="mb-md w-full">
      <View className="mb-xs flex-row items-center justify-between">
        <AppText variant="overline" accent>
          Coach
        </AppText>
        <Pressable onPress={onDismiss} hitSlop={12} accessibilityRole="button">
          <AppText variant="caption" className="font-semibold">
            Dismiss
          </AppText>
        </Pressable>
      </View>
      <AppText variant="body">{nudge.response}</AppText>
    </Card>
  );
}

function HistorySection({
  items,
  onReport,
  onShowMore,
  maxItems,
}: {
  items: RecentActivityItem[];
  onReport: (r: HomeReport) => void;
  onShowMore: () => void;
  maxItems: number;
}) {
  return (
    <FitnessListSection title="History">
      {items.slice(0, maxItems).map((item) => (
        <FitnessListRow
          key={item.id}
          icon={activityIcon(item)}
          label={item.title}
          value={item.stat}
          onPress={() => onReport(activityReport(item))}
        />
      ))}
      <FitnessListRow icon="ellipsis-horizontal" label="Show More" onPress={onShowMore} />
    </FitnessListSection>
  );
}

function TrendsSection({
  dashboard,
  onReport,
}: {
  dashboard: Dashboard;
  onReport: (r: HomeReport) => void;
}) {
  return (
    <FitnessListSection title="Trends">
      <FitnessListRow
        icon="stats-chart-outline"
        label="Weekly calories"
        onPress={() =>
          onReport(
            dayCalorieReport(
              "This week",
              dashboard.logged.calories,
              dashboard.target.calories,
            ),
          )
        }
      />
      <FitnessListRow
        icon="nutrition-outline"
        label="Macros"
        onPress={() =>
          onReport(
            macroReport({
              logged: dashboard.logged.calories,
              target: dashboard.target.calories,
              remaining: dashboard.remaining.calories,
              meals: dashboard.entries.length,
              protein: dashboard.logged.protein_g,
              proteinTarget: dashboard.target.protein_g,
            }),
          )
        }
      />
    </FitnessListSection>
  );
}

function AwardsSection({
  gamification,
  onReport,
}: {
  gamification: GamificationState;
  onReport: (r: HomeReport) => void;
}) {
  const { colors } = useTheme();
  return (
    <FitnessListSection
      title="Awards"
      caption="Keep your streaks going and earn new awards."
    >
      <Pressable
        onPress={() => onReport(streakReport(gamification))}
        accessibilityRole="button"
        className="flex-row items-center gap-md py-md"
      >
        <View
          className="h-14 w-14 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${colors.accentBright}18` }}
        >
          <AppText variant="title" style={{ color: colors.accentBright }}>
            {gamification.streak_count}
          </AppText>
        </View>
        <View className="flex-1">
          <AppText variant="bodyStrong" style={{ color: colors.accentBright }}>
            Weekly streak
          </AppText>
          <AppText variant="caption" muted>
            Current streak · {gamification.streak_count} days · {gamification.points} pts
          </AppText>
        </View>
      </Pressable>
    </FitnessListSection>
  );
}

export function HomeFitnessSummary(props: Props) {
  const { tier, isDesktop } = useBreakpoint();
  const navigation = useNavigation<Nav>();
  const tokens = fitnessTokens(tier);
  const {
    dashboard,
    gamification,
    nudge,
    onDismissNudge,
    recentItems,
    readings,
    onReport,
  } = props;

  const calorieProgress =
    dashboard.target.calories > 0
      ? dashboard.logged.calories / dashboard.target.calories
      : 0;

  const dayProgress = useMemo(() => {
    const base = dashboard.logged.calories || 1600;
    return WEEK_LABELS.map((_, i) => {
      const isToday = i === WEEK_LABELS.length - 1;
      const wobble = Math.sin(i * 1.1) * 0.08;
      const val = isToday ? base : base * (0.78 + i * 0.035) + wobble;
      return Math.min(1, val / dashboard.target.calories);
    });
  }, [dashboard.logged.calories, dashboard.target.calories]);

  const merged = mergeWearablePreview(readings);
  const steps =
    merged.find((r) => r.metric_type === "steps")?.value ??
    Math.round(gamification.points * 42);
  const heartRate = merged.find((r) => r.metric_type === "heart_rate")?.value;

  const openDrawer = () => navigation.dispatch(DrawerActions.openDrawer());
  const showMenu = !isDesktop;

  const statItems = [
    { label: "Steps", value: steps.toLocaleString() },
    { label: "Protein", value: `${Math.round(dashboard.logged.protein_g)} g` },
    { label: "Streak", value: `${gamification.streak_count} days` },
    { label: "Meals", value: String(dashboard.entries.length) },
  ];

  const onDayPress = (i: number, calories: number) =>
    onReport(
      dayCalorieReport(
        ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
        calories,
        dashboard.target.calories,
      ),
    );

  const ringBlock = (
    <Pressable
      onPress={() =>
        onReport(
          macroReport({
            logged: dashboard.logged.calories,
            target: dashboard.target.calories,
            remaining: dashboard.remaining.calories,
            meals: dashboard.entries.length,
            protein: dashboard.logged.protein_g,
            proteinTarget: dashboard.target.protein_g,
          }),
        )
      }
      accessibilityRole="button"
    >
      <FitnessMoveRing
        progress={calorieProgress}
        centerValue={`${dashboard.logged.calories}/${dashboard.target.calories}`}
        centerUnit="CAL"
        size={tokens.ringSize}
        stroke={tokens.ringStroke}
      />
    </Pressable>
  );

  const healthBlock =
    merged.length > 0 ? (
      <FitnessListSection title="Health">
        <FitnessListRow
          icon="footsteps-outline"
          label="Steps"
          value={steps.toLocaleString()}
          onPress={() => onReport(stepsReport(steps))}
        />
        {heartRate ? (
          <FitnessListRow
            icon="heart-outline"
            label="Heart rate"
            value={`${Math.round(heartRate)} bpm`}
            onPress={() => onReport(heartRateReport(heartRate))}
          />
        ) : null}
      </FitnessListSection>
    ) : null;

  return (
    <View className="w-full">
      <FitnessScreenTitle
        title="Summary"
        tier={tier}
        onMenu={showMenu ? openDrawer : undefined}
      />

      {nudge ? <NudgeCard nudge={nudge} onDismiss={onDismissNudge} /> : null}

      <FitnessWeekStrip selectedIndex={6} dayProgress={dayProgress} />

      {tier === "mobile" ? (
        <>
          {ringBlock}
          <FitnessInlineBars
            todayCalories={dashboard.logged.calories}
            targetCalories={dashboard.target.calories}
            onDayPress={onDayPress}
          />
          <FitnessStatGrid items={statItems} />
          <HistorySection
            items={recentItems}
            onReport={onReport}
            onShowMore={() => navigateWorkoutStack(navigation, "WorkoutLibrary")}
            maxItems={4}
          />
          <TrendsSection dashboard={dashboard} onReport={onReport} />
          {healthBlock}
        </>
      ) : null}

      {tier === "tablet" ? (
        <>
          <DesktopColumns
            left={ringBlock}
            right={
              <View>
                <FitnessStatGrid items={statItems} />
                <FitnessInlineBars
                  todayCalories={dashboard.logged.calories}
                  targetCalories={dashboard.target.calories}
                  onDayPress={onDayPress}
                  height={96}
                />
              </View>
            }
            leftFlex={1}
            rightFlex={1}
            className="mb-lg"
          />
          <AwardsSection gamification={gamification} onReport={onReport} />
          <DesktopColumns
            left={
              <HistorySection
                items={recentItems}
                onReport={onReport}
                onShowMore={() => navigateWorkoutStack(navigation, "WorkoutLibrary")}
                maxItems={5}
              />
            }
            right={<TrendsSection dashboard={dashboard} onReport={onReport} />}
            leftFlex={1}
            rightFlex={1}
            className="mb-lg"
          />
          {healthBlock}
        </>
      ) : null}

      {tier === "desktop" ? (
        <>
          <DesktopColumns
            left={ringBlock}
            right={
              <View>
                <FitnessStatGrid items={statItems} />
                <FitnessInlineBars
                  todayCalories={dashboard.logged.calories}
                  targetCalories={dashboard.target.calories}
                  onDayPress={onDayPress}
                  height={120}
                />
              </View>
            }
            leftFlex={1}
            rightFlex={1}
            className="mb-xl"
          />
          <AwardsSection gamification={gamification} onReport={onReport} />
          <ResponsiveGrid desktopCols={2} className="mb-xl w-full gap-lg">
            <HistorySection
              items={recentItems}
              onReport={onReport}
              onShowMore={() => navigateWorkoutStack(navigation, "WorkoutLibrary")}
              maxItems={6}
            />
            <View>
              <TrendsSection dashboard={dashboard} onReport={onReport} />
              {healthBlock}
            </View>
          </ResponsiveGrid>
        </>
      ) : null}
    </View>
  );
}

/** @deprecated use HomeFitnessSummary */
export const HomeMobileSummary = HomeFitnessSummary;
