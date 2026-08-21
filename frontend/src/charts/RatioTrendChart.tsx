import { Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";

import { ProgressPhoto } from "../api";
import { useTheme } from "../ThemeProvider";
import { spacing } from "../theme";

export function RatioTrendChart({ photos }: { photos: ProgressPhoto[] }) {
  const { colors, typography } = useTheme();

  if (!photos.length) {
    return (
      <Text style={typography.muted}>
        Trend appears after your first successful check-in.
      </Text>
    );
  }

  const waistToHip = photos.map((photo, index) => ({
    value: photo.ratios.waist_to_hip,
    label: String(index + 1),
  }));
  const shoulderToWaist = photos.map((photo) => ({
    value: photo.ratios.shoulder_to_waist,
  }));
  const values = [
    ...photos.map((p) => p.ratios.waist_to_hip),
    ...photos.map((p) => p.ratios.shoulder_to_waist),
  ];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max((max - min) * 0.2, 0.02);
  const yAxisOffset = Math.max(0, min - pad);
  const maxValue = Math.max(max + pad - yAxisOffset, 0.05);

  return (
    <View>
      <Text
        style={{
          ...typography.muted,
          marginBottom: spacing.xs,
          marginTop: spacing.sm,
        }}
      >
        Ratio trend (pose estimates)
      </Text>
      <LineChart
        data={waistToHip}
        data2={shoulderToWaist}
        color={colors.accent}
        color2={colors.text}
        thickness={2}
        thickness2={2}
        hideRules
        hideDataPoints={false}
        dataPointsColor={colors.accent}
        dataPointsColor2={colors.text}
        dataPointsRadius={4}
        yAxisColor={colors.border}
        xAxisColor={colors.border}
        yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10 }}
        yAxisOffset={yAxisOffset}
        maxValue={maxValue}
        noOfSections={3}
        formatYLabel={(label) => Number(label).toFixed(2)}
        curved
        isAnimated={false}
        height={160}
        spacing={Math.max(36, Math.min(56, 240 / Math.max(photos.length, 1)))}
        backgroundColor={colors.background}
      />
      <Text style={typography.muted}>
        Accent: waist-to-hip · Ink: shoulder-to-waist
      </Text>
    </View>
  );
}
