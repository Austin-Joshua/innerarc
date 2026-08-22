import { Ionicons } from "@expo/vector-icons";
import { CompositeNavigationProp } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { Pressable, View } from "react-native";

import { CoachNudge, Dashboard, GamificationState } from "../api";
import { AppText, Badge, Card } from "../components/ui";
import { ResponsiveGrid } from "../components/layout";
import { INTERACTIVE_CARD_PRESSABLE } from "../components/ui/interactiveStyles";
import {
  navigateLogMeal,
  navigateMainTab,
  navigateProgress,
  navigateWorkoutStack,
} from "../navigation/navHelpers";
import { MainDrawerParamList, MainTabParamList } from "../navigation/types";
import { useTheme } from "../ThemeProvider";

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "Home">,
  DrawerNavigationProp<MainDrawerParamList>
>;

type Props = {
  navigation: Nav;
  dashboard: Dashboard;
  gamification: GamificationState;
  nudge: CoachNudge | null;
};

type FeatureCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  stat: string;
  detail: string;
  badge?: string;
  onPress: () => void;
};

function FeatureCard({
  icon,
  title,
  stat,
  detail,
  badge,
  onPress,
}: FeatureCardProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className={INTERACTIVE_CARD_PRESSABLE}
    >
      <Card variant="elevated" interactive className="min-h-[120px] justify-between p-md">
        <View className="mb-sm flex-row items-start justify-between">
          <View
            className="rounded-md border border-border p-sm"
            style={{ backgroundColor: `${colors.accent}12` }}
          >
            <Ionicons name={icon} size={20} color={colors.accent} />
          </View>
          {badge ? <Badge label={badge} tone="accent" /> : null}
        </View>
        <AppText variant="subhead" className="mb-xxs font-bold">
          {title}
        </AppText>
        <AppText variant="bodyStrong" className="text-accent">
          {stat}
        </AppText>
        <AppText variant="caption" muted className="mt-xxs">
          {detail}
        </AppText>
      </Card>
    </Pressable>
  );
}

export function HomeFeatureCards({
  navigation,
  dashboard,
  gamification,
  nudge,
}: Props) {
  const mealCount = dashboard.entries.length;
  const calLogged = Math.round(dashboard.logged.calories);
  const calLeft = Math.round(dashboard.remaining.calories);
  const proteinLogged = Math.round(dashboard.logged.protein_g);

  const coachStat = nudge
    ? "New insight ready"
    : `${gamification.streak_count}-day streak context`;
  const coachDetail = nudge
    ? nudge.response.slice(0, 72) + (nudge.response.length > 72 ? "…" : "")
    : "Ask about protein, meals, or your goal";

  return (
    <ResponsiveGrid className="mb-md mt-sm w-full" desktopCols={4}>
      <FeatureCard
        icon="restaurant-outline"
        title="Log meal"
        stat={`${calLogged} kcal logged`}
        detail={
          mealCount
            ? `${mealCount} meals · ${proteinLogged} g protein · ${calLeft} kcal left`
            : "Snap a photo to log calories and macros"
        }
        badge={mealCount ? `${mealCount} today` : undefined}
        onPress={() => navigateLogMeal(navigation)}
      />
      <FeatureCard
        icon="barbell-outline"
        title="Workouts"
        stat="Full-body strength"
        detail="42 min · 380 kcal · 6 sessions in library"
        badge="Recommended"
        onPress={() => navigateWorkoutStack(navigation, "WorkoutLibrary")}
      />
      <FeatureCard
        icon="camera-outline"
        title="Progress"
        stat={`${gamification.streak_count}-day streak`}
        detail="Last check-in yesterday · compare photos over time"
        onPress={() => navigateProgress(navigation)}
      />
      <FeatureCard
        icon="chatbubble-ellipses-outline"
        title="Coach"
        stat={coachStat}
        detail={coachDetail}
        badge={nudge ? "New" : undefined}
        onPress={() => navigateMainTab(navigation, "Coach")}
      />
    </ResponsiveGrid>
  );
}
