import { Text, View } from "react-native";
import { BarChart, PieChart } from "react-native-gifted-charts";

import { Dashboard } from "../api";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { useTheme } from "../ThemeProvider";
import { spacing } from "../theme";

export type ScaledMacros = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export function CalorieDonut({ data }: { data: Dashboard }) {
  const { colors, typography } = useTheme();
  const logged = Math.max(0, data.logged.calories);
  const remaining = Math.max(0, data.remaining.calories);
  const pieData =
    logged + remaining <= 0
      ? [{ value: 1, color: colors.surface }]
      : [
          { value: logged || 0.0001, color: colors.accent },
          ...(remaining > 0
            ? [{ value: remaining, color: colors.surface }]
            : []),
        ];

  return (
    <View style={{ alignItems: "center", marginTop: spacing.sm }}>
      <PieChart
        data={pieData}
        donut
        radius={72}
        innerRadius={50}
        innerCircleColor={colors.surface}
        innerCircleBorderWidth={0}
        showText={false}
        strokeWidth={0}
        backgroundColor={colors.background}
        centerLabelComponent={() => (
          <View style={{ alignItems: "center" }}>
            <Text style={typography.numeral}>
              {Math.round(data.logged.calories)}
            </Text>
            <Text style={typography.muted}>kcal</Text>
          </View>
        )}
      />
      <Text style={{ ...typography.muted, marginTop: spacing.xs }}>
        of {data.target.calories} kcal · accent is logged, grey is remaining
      </Text>
    </View>
  );
}

export function MacroBarChart({ data }: { data: Dashboard }) {
  const { colors, typography } = useTheme();
  const groups: { label: string; logged: number; target: number }[] = [
    {
      label: "P",
      logged: data.logged.protein_g,
      target: data.target.protein_g,
    },
    { label: "C", logged: data.logged.carbs_g, target: data.target.carbs_g },
    { label: "F", logged: data.logged.fat_g, target: data.target.fat_g },
  ];
  const barData = groups.flatMap((group) => [
    {
      value: group.logged,
      label: group.label,
      spacing: 2,
      labelWidth: 28,
      labelTextStyle: { color: colors.textMuted, fontSize: 11 },
      frontColor: colors.accent,
    },
    {
      value: group.target,
      frontColor: colors.neutral,
    },
  ]);
  const maxValue = Math.max(
    1,
    ...groups.flatMap((g) => [g.logged, g.target]),
  );

  return (
    <View style={{ marginTop: spacing.md }}>
      {groups.map((group) => (
        <View
          key={group.label}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 4,
          }}
        >
          <Text style={typography.body}>
            {group.label === "P"
              ? "Protein (g)"
              : group.label === "C"
                ? "Carbs (g)"
                : "Fat (g)"}
          </Text>
          <Text style={{ fontWeight: "700", color: colors.text }}>
            {Math.round(group.logged)} / {group.target}
          </Text>
        </View>
      ))}
      <BarChart
        data={barData}
        barWidth={14}
        spacing={12}
        hideRules
        xAxisThickness={1}
        yAxisThickness={1}
        xAxisColor={colors.border}
        yAxisColor={colors.border}
        yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
        noOfSections={3}
        maxValue={maxValue}
        isAnimated={false}
        height={140}
        backgroundColor={colors.background}
      />
      <Text style={{ ...typography.muted, marginTop: spacing.xs }}>
        Accent: logged · Neutral: target
      </Text>
    </View>
  );
}

export function MealCalorieDonut({ macros }: { macros: ScaledMacros }) {
  const { colors, typography } = useTheme();
  const kcal = Math.max(0, macros.calories);
  const pieData =
    kcal <= 0
      ? [{ value: 1, color: colors.surface }]
      : [{ value: kcal, color: colors.accent }];

  return (
    <View style={{ alignItems: "center", marginTop: spacing.sm }}>
      <PieChart
        data={pieData}
        donut
        radius={72}
        innerRadius={50}
        innerCircleColor={colors.surface}
        innerCircleBorderWidth={0}
        showText={false}
        strokeWidth={0}
        backgroundColor={colors.background}
        centerLabelComponent={() => (
          <View style={{ alignItems: "center" }}>
            <Text style={typography.numeral}>{Math.round(kcal)}</Text>
            <Text style={typography.muted}>kcal</Text>
          </View>
        )}
      />
      <Text style={{ ...typography.muted, marginTop: spacing.xs }}>
        Meal calories for this serving
      </Text>
    </View>
  );
}

export function MealMacroBarChart({ macros }: { macros: ScaledMacros }) {
  const { colors, typography } = useTheme();
  const groups = [
    { label: "P", value: macros.protein, name: "Protein (g)" },
    { label: "C", value: macros.carbs, name: "Carbs (g)" },
    { label: "F", value: macros.fat, name: "Fat (g)" },
  ];
  const barData = groups.map((group) => ({
    value: Math.max(0, group.value),
    label: group.label,
    spacing: 2,
    labelWidth: 28,
    labelTextStyle: { color: colors.textMuted, fontSize: 11 },
    frontColor: colors.accent,
  }));
  const maxValue = Math.max(1, ...groups.map((g) => g.value));

  return (
    <View style={{ marginTop: spacing.sm }}>
      {groups.map((group) => (
        <View
          key={group.label}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 4,
          }}
        >
          <Text style={typography.body}>{group.name}</Text>
          <Text style={{ fontWeight: "700", color: colors.text }}>
            {group.value.toFixed(1)} g
          </Text>
        </View>
      ))}
      <BarChart
        data={barData}
        barWidth={22}
        spacing={24}
        hideRules
        xAxisThickness={1}
        yAxisThickness={1}
        xAxisColor={colors.border}
        yAxisColor={colors.border}
        yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
        noOfSections={3}
        maxValue={maxValue}
        isAnimated={false}
        height={140}
        backgroundColor={colors.background}
      />
      <Text style={{ ...typography.muted, marginTop: spacing.xs }}>
        Macro grams for this serving
      </Text>
    </View>
  );
}

export function MealNutritionCharts({ macros }: { macros: ScaledMacros }) {
  const { isAtLeastMd } = useBreakpoint();

  return (
    <View
      className={
        isAtLeastMd
          ? "mb-md flex-row items-start gap-lg"
          : "mb-md flex-col gap-md"
      }
    >
      <View className={isAtLeastMd ? "flex-1 items-center" : "items-center"}>
        <MealCalorieDonut macros={macros} />
      </View>
      <View className={isAtLeastMd ? "flex-1" : undefined}>
        <MealMacroBarChart macros={macros} />
      </View>
    </View>
  );
}
