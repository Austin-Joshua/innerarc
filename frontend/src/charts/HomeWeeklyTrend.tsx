import { useMemo, useState } from "react";
import { LayoutChangeEvent, View } from "react-native";
import { BarChart } from "react-native-gifted-charts";

import { AppText, Card } from "../components/ui";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { useTheme } from "../ThemeProvider";
import { dayCalorieReport, HomeReport } from "./homeReports";

const WEEK_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const BAR_COUNT = WEEK_LABELS.length;

type Props = {
  todayCalories: number;
  targetCalories: number;
  onReport?: (report: HomeReport) => void;
};

function fitChartMetrics(containerWidth: number, isDesktop: boolean) {
  if (containerWidth <= 0) {
    return { chartWidth: 280, barWidth: 24, spacing: 12 };
  }

  if (isDesktop) {
    const chartWidth = Math.min(containerWidth, 560);
    return { chartWidth, barWidth: 36, spacing: 28 };
  }

  const chartWidth = containerWidth;
  const gapTotal = chartWidth * 0.22;
  const spacing = Math.max(6, Math.floor(gapTotal / (BAR_COUNT - 1)));
  const barWidth = Math.max(
    14,
    Math.floor((chartWidth - spacing * (BAR_COUNT - 1)) / BAR_COUNT),
  );

  return { chartWidth, barWidth, spacing };
}

export function HomeWeeklyTrend({
  todayCalories,
  targetCalories,
  onReport,
}: Props) {
  const { colors } = useTheme();
  const { isDesktop } = useBreakpoint();
  const [containerWidth, setContainerWidth] = useState(0);

  const base = todayCalories || 1600;

  const values = WEEK_LABELS.map((label, i) => {
    const isToday = i === WEEK_LABELS.length - 1;
    const wobble = Math.sin(i * 1.1) * base * 0.08;
    return Math.round(isToday ? base : base * (0.78 + i * 0.035) + wobble);
  });

  const data = WEEK_LABELS.map((label, i) => ({
    value: values[i],
    label,
    labelTextStyle: { color: colors.textMuted, fontSize: 10 },
    frontColor:
      i === WEEK_LABELS.length - 1
        ? colors.accentBright
        : `${colors.accentBright}99`,
  }));

  const maxVal = Math.max(targetCalories, ...values) * 1.1;

  const { chartWidth, barWidth, spacing } = useMemo(
    () => fitChartMetrics(containerWidth, isDesktop),
    [containerWidth, isDesktop],
  );

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - containerWidth) > 1) {
      setContainerWidth(w);
    }
  };

  return (
    <Card variant="elevated" className="mt-md w-full overflow-hidden p-md">
      <AppText variant="subhead" className="mb-xs font-bold">
        Weekly calories
      </AppText>
      <AppText variant="caption" muted className="mb-md">
        Tap a day · target {targetCalories.toLocaleString()} kcal
      </AppText>

      <View className="w-full overflow-hidden" onLayout={onLayout}>
        {containerWidth > 0 ? (
          <BarChart
            data={data}
            barWidth={barWidth}
            spacing={spacing}
            roundedTop
            roundedBottom
            hideRules
            hideYAxisText
            yAxisThickness={0}
            xAxisThickness={0}
            maxValue={maxVal}
            height={isDesktop ? 160 : 132}
            width={chartWidth}
            isAnimated={false}
            backgroundColor="transparent"
            initialSpacing={0}
            endSpacing={0}
            disableScroll
            showReferenceLine1
            referenceLine1Position={targetCalories}
            referenceLine1Config={{
              color: colors.ringStreak,
              dashWidth: 4,
              dashGap: 4,
              labelText: "Target",
              labelTextStyle: { color: colors.textMuted, fontSize: 9 },
            }}
            onPress={
              onReport
                ? (_item: unknown, index: number) => {
                    const day = WEEK_LABELS[index];
                    const kcal = values[index] ?? 0;
                    onReport(dayCalorieReport(day, kcal, targetCalories));
                  }
                : undefined
            }
          />
        ) : (
          <View style={{ height: isDesktop ? 160 : 132 }} />
        )}
      </View>
    </Card>
  );
}
