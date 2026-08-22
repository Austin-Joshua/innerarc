import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { ScrollView, View } from "react-native";

import { api, ProgramSummary, WorkoutSummary } from "../api";
import { PageShell, ResponsiveGrid } from "../components/layout";
import {
  FitnessHeroWorkoutCard,
  FitnessListRow,
  FitnessScreenTitle,
} from "../components/fitness/FitnessMobileParts";
import { FitnessListSection } from "../components/fitness/FitnessListSection";
import { fitnessTokens } from "../components/fitness/fitnessLayout";
import { AppText, Screen } from "../components/ui";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { WorkoutStackParamList } from "../navigation/types";
import {
  isWorkoutPreview,
  PREVIEW_PROGRAMS,
  PREVIEW_RECOMMENDED,
  PREVIEW_WORKOUTS,
} from "../workoutPreviewSeed";

type Nav = NativeStackNavigationProp<WorkoutStackParamList, "WorkoutLibrary">;

const MODALITY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  bodyweight: "body-outline",
  home_gym: "home-outline",
  weighted: "barbell-outline",
  yoga: "leaf-outline",
  aerobics: "pulse-outline",
  all: "grid-outline",
};

const HERO_GRADIENTS: [string, string][] = [
  ["#0a1f12", "#000000"],
  ["#142818", "#000000"],
  ["#1a3020", "#050505"],
  ["#102818", "#030303"],
];

const ACTIVITY_TYPES = ["bodyweight", "home_gym", "weighted", "yoga", "aerobics"] as const;

export default function WorkoutLibraryScreen() {
  const navigation = useNavigation<Nav>();
  const { tier } = useBreakpoint();
  const tokens = fitnessTokens(tier);

  const [workouts, setWorkouts] = useState<WorkoutSummary[]>(() =>
    isWorkoutPreview() ? PREVIEW_WORKOUTS : [],
  );
  const [programs, setPrograms] = useState<ProgramSummary[]>(() =>
    isWorkoutPreview() ? PREVIEW_PROGRAMS : [],
  );
  const [error, setError] = useState<string | null>(null);
  const [modalityFilter, setModalityFilter] = useState<string | null>(null);
  const [recommended, setRecommended] = useState<WorkoutSummary[]>(() =>
    isWorkoutPreview() ? PREVIEW_RECOMMENDED : [],
  );

  const load = useCallback(() => {
    if (isWorkoutPreview()) return () => undefined;
    let active = true;
    Promise.all([api.me().catch(() => null), api.programs(), api.workouts({}), api.recommendWorkouts({}).catch(() => [])])
      .then(([, p, w, r]) => {
        if (!active) return;
        setPrograms(p);
        setWorkouts(w);
        setRecommended(r);
        setError(null);
      })
      .catch((err) => {
        if (active)
          setError(err instanceof Error ? err.message : "Could not load workouts");
      });
    return () => {
      active = false;
    };
  }, []);

  useFocusEffect(useCallback(() => load(), [load]));

  const openWorkout = (workoutId: string) => {
    navigation.navigate("WorkoutDetail", { workoutId });
  };

  const visibleWorkouts = modalityFilter
    ? workouts.filter((w) => w.modality === modalityFilter)
    : workouts;
  const heroCount = tier === "mobile" ? 3 : 1;
  const featured = recommended.slice(0, heroCount);

  return (
    <Screen>
      <PageShell centeredMobile={false}>
        <FitnessScreenTitle title="Workout" tier={tier} />

        {error ? (
          <AppText variant="caption" className="mb-sm text-danger">
            {error}
          </AppText>
        ) : null}

        {featured.map((workout, i) => (
          <FitnessHeroWorkoutCard
            key={`hero-${workout.id}`}
            title={workout.name}
            subtitle={
              tier === "mobile"
                ? `${workout.exercise_count} exercises · ${workout.level}`
                : `FOR TODAY · ${workout.modality.replace(/_/g, " ")} · ${workout.level}`
            }
            icon={MODALITY_ICONS[workout.modality] ?? "fitness-outline"}
            gradient={HERO_GRADIENTS[i % HERO_GRADIENTS.length]}
            onPress={() => openWorkout(workout.id)}
          />
        ))}

        <FitnessListSection title="Activity types" caption="Browse by modality">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-md">
            {ACTIVITY_TYPES.map((m) => (
              <View key={m} className="mr-sm" style={{ width: tier === "mobile" ? 112 : 140 }}>
                <FitnessHeroWorkoutCard
                  title={m.replace(/_/g, " ")}
                  icon={MODALITY_ICONS[m] ?? "fitness-outline"}
                  gradient={["#1a1a1a", "#0a0a0a"]}
                  onPress={() => setModalityFilter(m)}
                  actionIcon="chevron-forward"
                />
              </View>
            ))}
          </ScrollView>
        </FitnessListSection>

        <FitnessListSection title="Programs">
          {programs.map((program) => (
            <FitnessListRow
              key={program.id}
              icon="calendar-outline"
              label={program.name}
              value={`${program.duration_weeks} wk`}
              onPress={() =>
                navigation.navigate("ProgramDetail", { programId: program.id })
              }
            />
          ))}
        </FitnessListSection>

        <AppText variant="title" className="mb-md font-bold">
          Library
        </AppText>
        <ResponsiveGrid desktopCols={tokens.gridCols} className="mb-xl w-full">
          {visibleWorkouts.map((workout, i) => (
            <FitnessHeroWorkoutCard
              key={workout.id}
              title={workout.name}
              subtitle={`${workout.exercise_count} ex · ${workout.modality.replace(/_/g, " ")}`}
              icon={MODALITY_ICONS[workout.modality] ?? "fitness-outline"}
              gradient={HERO_GRADIENTS[i % HERO_GRADIENTS.length]}
              onPress={() => openWorkout(workout.id)}
            />
          ))}
        </ResponsiveGrid>
        {!visibleWorkouts.length ? (
          <AppText variant="caption" className="text-muted">
            No workouts available.
          </AppText>
        ) : null}
      </PageShell>
    </Screen>
  );
}
