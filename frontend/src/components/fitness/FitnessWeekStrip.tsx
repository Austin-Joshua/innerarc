import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

import { AppText } from "../ui/AppText";
import { useTheme } from "../../ThemeProvider";
import { FITNESS_MOBILE, WEEK_DAYS } from "./fitnessMobileTheme";

type Props = {
  /** 0 = Mon … 6 = Sun */
  selectedIndex?: number;
  dayProgress?: number[];
  onSelectDay?: (index: number) => void;
};

function MiniRing({
  progress,
  size,
  stroke,
  fill,
  track,
  selected,
}: {
  progress: number;
  size: number;
  stroke: number;
  fill: string;
  track: string;
  selected: boolean;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(1, progress));

  return (
    <Svg width={size} height={size}>
      <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={track}
          strokeWidth={stroke}
          fill="none"
          opacity={0.4}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={fill}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </G>
      {selected ? (
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 1}
          stroke="#FFFFFF"
          strokeWidth={1.5}
          fill="none"
        />
      ) : null}
    </Svg>
  );
}

export function FitnessWeekStrip({
  selectedIndex = 6,
  dayProgress = [0.7, 0.8, 0.65, 0.9, 0.75, 0.85, 0.84],
  onSelectDay,
}: Props) {
  const { colors } = useTheme();
  const ringSize = 28;

  return (
    <View className="mb-lg flex-row justify-between px-xs">
      {WEEK_DAYS.map((label, i) => {
        const selected = i === selectedIndex;
        return (
          <Pressable
            key={`${label}-${i}`}
            onPress={() => onSelectDay?.(i)}
            accessibilityRole="button"
            className="items-center"
            style={{ width: `${100 / 7}%` }}
          >
            <AppText
              variant="caption"
              className={`mb-xs font-semibold ${selected ? "text-ink" : "text-muted"}`}
            >
              {label}
            </AppText>
            <MiniRing
              progress={dayProgress[i] ?? 0}
              size={ringSize}
              stroke={3}
              fill={colors.accentBright}
              track={colors.ringTrack}
              selected={selected}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

type MoveRingProps = {
  progress: number;
  centerValue: string;
  centerUnit?: string;
  size?: number;
  stroke?: number;
};

export function FitnessMoveRing({
  progress,
  centerValue,
  centerUnit = "CAL",
  size = FITNESS_MOBILE.ringSize,
  stroke = FITNESS_MOBILE.ringStroke,
}: MoveRingProps) {
  const { colors } = useTheme();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(1, progress));

  return (
    <View className="my-md items-center">
      <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
        <Svg width={size} height={size}>
          <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={colors.ringTrack}
              strokeWidth={stroke}
              fill="none"
              opacity={0.35}
            />
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={colors.accentBright}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${c} ${c}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          </G>
        </Svg>
        <View className="absolute items-center">
          <Ionicons
            name="arrow-up"
            size={14}
            color={colors.accentBright}
            style={{ marginBottom: 4, transform: [{ rotate: "45deg" }] }}
          />
        </View>
      </View>
      <AppText variant="overline" muted className="mt-sm">
        Move
      </AppText>
      <AppText
        variant="display"
        className="font-extrabold"
        style={{ color: colors.accentBright, fontSize: 28 }}
      >
        {centerValue}
      </AppText>
      <AppText variant="caption" muted>
        {centerUnit}
      </AppText>
    </View>
  );
}
