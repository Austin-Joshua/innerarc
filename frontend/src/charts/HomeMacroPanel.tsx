import { Pressable, View } from "react-native";

import { AppText, Card } from "../components/ui";
import { INTERACTIVE_CARD_PRESSABLE } from "../components/ui/interactiveStyles";
import { useTheme } from "../ThemeProvider";
import { Dashboard } from "../api";
import { HomeReport, macroReport } from "./homeReports";

type MacroRowProps = {
  label: string;
  logged: number;
  target: number;
  unit: string;
  color: string;
};

function MacroRow({ label, logged, target, unit, color }: MacroRowProps) {
  const pct = target > 0 ? Math.min(100, (logged / target) * 100) : 0;

  return (
    <View className="mb-md">
      <View className="mb-xs flex-row items-baseline justify-between">
        <AppText variant="bodyStrong">{label}</AppText>
        <AppText variant="caption" muted>
          {Math.round(logged)} / {Math.round(target)} {unit}
        </AppText>
      </View>
      <View className="h-2 overflow-hidden rounded-full bg-surface">
        <View
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </View>
      <AppText variant="overline" muted className="mt-xxs">
        {Math.round(pct)}% of daily target
      </AppText>
    </View>
  );
}

type Props = {
  data: Dashboard;
  onReport?: (report: HomeReport) => void;
};

export function HomeMacroPanel({ data, onReport }: Props) {
  const { colors } = useTheme();

  const report: HomeReport = macroReport({
    logged: data.logged.calories,
    target: data.target.calories,
    remaining: data.remaining.calories,
    meals: data.entries.length,
    protein: data.logged.protein_g,
    proteinTarget: data.target.protein_g,
  });

  const body = (
    <Card variant="elevated" className="mt-md w-full p-md">
      <AppText variant="subhead" className="mb-md font-bold">
        Nutrition today
      </AppText>
      <MacroRow
        label="Calories"
        logged={data.logged.calories}
        target={data.target.calories}
        unit="kcal"
        color={colors.accentBright}
      />
      <MacroRow
        label="Protein"
        logged={data.logged.protein_g}
        target={data.target.protein_g}
        unit="g"
        color={colors.ringSecondary}
      />
      <MacroRow
        label="Carbs"
        logged={data.logged.carbs_g}
        target={data.target.carbs_g}
        unit="g"
        color={colors.ringStreak}
      />
      <MacroRow
        label="Fat"
        logged={data.logged.fat_g}
        target={data.target.fat_g}
        unit="g"
        color={colors.textMuted}
      />
      <View className="mt-sm flex-row flex-wrap gap-md border-t border-border pt-md">
        <View>
          <AppText variant="overline" muted>
            Remaining
          </AppText>
          <AppText variant="bodyStrong" className="text-accent">
            {Math.round(data.remaining.calories)} kcal
          </AppText>
        </View>
        <View>
          <AppText variant="overline" muted>
            Meals logged
          </AppText>
          <AppText variant="bodyStrong">{data.entries.length}</AppText>
        </View>
      </View>
    </Card>
  );

  if (!onReport) return body;

  return (
    <Pressable
      onPress={() => onReport(report)}
      accessibilityRole="button"
      className={INTERACTIVE_CARD_PRESSABLE}
    >
      {body}
    </Pressable>
  );
}
