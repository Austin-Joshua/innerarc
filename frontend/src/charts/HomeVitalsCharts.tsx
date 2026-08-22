import { Ionicons } from "@expo/vector-icons";
import { type ReactNode } from "react";
import { Pressable, View } from "react-native";

import { WearableReading } from "../api";
import { AppText, Card } from "../components/ui";
import { ResponsiveGrid } from "../components/layout";
import { INTERACTIVE_CARD_PRESSABLE } from "../components/ui/interactiveStyles";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { useTheme } from "../ThemeProvider";
import {
  mergeWearablePreview,
  PREVIEW_BLOOD_PRESSURE,
  PREVIEW_HEARTBEAT,
} from "../wearablePreviewSeed";
import {
  bloodPressureReport,
  heartRateReport,
  HomeReport,
  restingHrReport,
  sleepReport,
  stepsReport,
} from "./homeReports";
import {
  BpGauge,
  EcgWaveform,
  MiniProgressRing,
  SleepArc,
} from "./vitalsChartParts";

const STEPS_GOAL = 10_000;
const SLEEP_GOAL = 8;

function readingValue(
  readings: WearableReading[],
  type: WearableReading["metric_type"],
): number | undefined {
  return readings.find((r) => r.metric_type === type)?.value;
}

type Props = {
  readings: WearableReading[];
  onReport?: (report: HomeReport) => void;
};

export function HomeVitalsCharts({ readings, onReport }: Props) {
  const { colors } = useTheme();
  const { isDesktop } = useBreakpoint();
  const merged = mergeWearablePreview(readings);

  const steps = readingValue(merged, "steps") ?? 0;
  const heartRate = readingValue(merged, "heart_rate") ?? 0;
  const sleep = readingValue(merged, "sleep") ?? 0;
  const { systolic, diastolic } = PREVIEW_BLOOD_PRESSURE;
  const restingHr = PREVIEW_HEARTBEAT;

  const ecgW = isDesktop ? 220 : 160;
  const ecgH = isDesktop ? 56 : 44;
  const ringSize = isDesktop ? 64 : 52;

  const wrap = (report: HomeReport, node: ReactNode) =>
    onReport ? (
      <Pressable
        onPress={() => onReport(report)}
        accessibilityRole="button"
        className={INTERACTIVE_CARD_PRESSABLE}
      >
        {node}
      </Pressable>
    ) : (
      node
    );

  return (
    <ResponsiveGrid
      className="mb-md mt-sm w-full"
      desktopCols={isDesktop ? 5 : 3}
      equalWidth={isDesktop}
    >
      {wrap(
        stepsReport(steps, STEPS_GOAL),
        <Card interactive variant="elevated" className="h-full overflow-hidden p-md">
          <View className="mb-sm flex-row items-center gap-xs">
            <Ionicons name="footsteps-outline" size={18} color={colors.accentBright} />
            <AppText variant="overline" muted>Steps</AppText>
          </View>
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <AppText variant="numeral">
                {steps > 0 ? Math.round(steps).toLocaleString() : "—"}
              </AppText>
              <AppText variant="caption" muted className="mt-xxs">
                {Math.round((steps / STEPS_GOAL) * 100)}% of goal
              </AppText>
            </View>
            <MiniProgressRing
              progress={steps / STEPS_GOAL}
              fill={colors.accentBright}
              track={colors.ringTrack}
              size={ringSize}
            />
          </View>
        </Card>,
      )}

      {wrap(
        heartRateReport(heartRate),
        <Card interactive variant="elevated" className="h-full overflow-hidden p-md">
          <View className="mb-sm flex-row items-center gap-xs">
            <Ionicons name="heart-outline" size={18} color={colors.ringSecondary} />
            <AppText variant="overline" muted>Heart rate</AppText>
          </View>
          <AppText variant="numeral">
            {heartRate > 0 ? `${Math.round(heartRate)}` : "—"}
          </AppText>
          <AppText variant="caption" muted className="mb-xs mt-xxs">
            bpm · live rhythm
          </AppText>
          <View className="items-center">
            <EcgWaveform color={colors.ringSecondary} width={ecgW} height={ecgH} beats={isDesktop ? 4 : 3} />
          </View>
        </Card>,
      )}

      {wrap(
        restingHrReport(restingHr),
        <Card interactive variant="elevated" className="h-full overflow-hidden p-md">
          <View className="mb-sm flex-row items-center gap-xs">
            <Ionicons name="pulse-outline" size={18} color={colors.accentBright} />
            <AppText variant="overline" muted>Resting HR</AppText>
          </View>
          <AppText variant="numeral">{restingHr}</AppText>
          <AppText variant="caption" muted className="mb-xs mt-xxs">
            bpm · overnight avg
          </AppText>
          <View className="items-center">
            <EcgWaveform color={colors.accentBright} width={ecgW} height={ecgH - 4} beats={isDesktop ? 3 : 2} />
          </View>
        </Card>,
      )}

      {wrap(
        bloodPressureReport(systolic, diastolic),
        <Card interactive variant="elevated" className="h-full overflow-hidden p-md">
          <View className="mb-sm flex-row items-center gap-xs">
            <Ionicons name="fitness-outline" size={18} color={colors.ringStreak} />
            <AppText variant="overline" muted>Blood pressure</AppText>
          </View>
          <AppText variant="numeral">{systolic}/{diastolic}</AppText>
          <AppText variant="caption" muted className="mb-sm mt-xxs">
            mmHg · normal range
          </AppText>
          <BpGauge
            systolic={systolic}
            diastolic={diastolic}
            fill={colors.ringStreak}
            track={colors.ringTrack}
            width={isDesktop ? 160 : 120}
          />
        </Card>,
      )}

      {wrap(
        sleepReport(sleep, SLEEP_GOAL),
        <Card interactive variant="elevated" className="h-full overflow-hidden p-md">
          <View className="mb-sm flex-row items-center gap-xs">
            <Ionicons name="moon-outline" size={18} color={colors.textMuted} />
            <AppText variant="overline" muted>Sleep</AppText>
          </View>
          <View className="flex-row items-end justify-between">
            <View>
              <AppText variant="numeral">
                {sleep > 0 ? sleep.toFixed(1) : "—"}
              </AppText>
              <AppText variant="caption" muted className="mt-xxs">
                hours · goal {SLEEP_GOAL} h
              </AppText>
            </View>
            <SleepArc
              hours={sleep || 0}
              goal={SLEEP_GOAL}
              fill={colors.ringSecondary}
              track={colors.ringTrack}
            />
          </View>
        </Card>,
      )}
    </ResponsiveGrid>
  );
}
