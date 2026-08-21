import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, Text } from "react-native";

import { api, ProgramSummary, WorkoutSummary } from "../api";
import { Card, Screen, SectionHeader } from "../components/ui";
import { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList, "WorkoutLibrary">;

const MODALITIES = [
  "all",
  "bodyweight",
  "home_gym",
  "weighted",
  "yoga",
  "aerobics",
] as const;
const LEVELS = ["all", "beginner", "intermediate", "advanced"] as const;
const GOALS = [
  "all",
  "fat_loss",
  "muscle_gain",
  "recomposition",
  "endurance",
  "general_fitness",
] as const;

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={
        active
          ? "mr-xs rounded-full border border-accent bg-accent-soft px-sm py-xs"
          : "mr-xs rounded-full border border-border bg-elevated px-sm py-xs"
      }
    >
      <Text
        className={
          active
            ? "text-caption font-semibold capitalize text-accent"
            : "text-caption capitalize text-muted"
        }
      >
        {label.replace(/_/g, " ")}
      </Text>
    </Pressable>
  );
}

export default function WorkoutLibraryScreen() {
  const navigation = useNavigation<Nav>();
  const [workouts, setWorkouts] = useState<WorkoutSummary[]>([]);
  const [programs, setPrograms] = useState<ProgramSummary[]>([]);
  const [modality, setModality] = useState<(typeof MODALITIES)[number]>("all");
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("all");
  const [goal, setGoal] = useState<(typeof GOALS)[number]>("all");
  const [error, setError] = useState<string | null>(null);
  const [recommended, setRecommended] = useState<WorkoutSummary[]>([]);

  const load = useCallback(() => {
    let active = true;
    Promise.all([api.me().catch(() => null), api.programs()])
      .then(([user, p]) => {
        if (!active) return;
        setPrograms(p);
        const equipment = user?.profile?.equipment_access;
        const params = {
          modality: modality === "all" ? undefined : modality,
          level: level === "all" ? undefined : level,
          goal: goal === "all" ? undefined : goal,
          equipment_access: equipment,
        };
        return Promise.all([
          api.workouts(params),
          api
            .recommendWorkouts({
              modality: params.modality,
              level: params.level,
              goal: params.goal,
            })
            .catch(() => [] as WorkoutSummary[]),
        ]).then(([w, r]) => {
          if (!active) return;
          setWorkouts(w);
          setRecommended(r);
          setError(null);
        });
      })
      .catch((err) => {
        if (active)
          setError(
            err instanceof Error ? err.message : "Could not load workouts",
          );
      });
    return () => {
      active = false;
    };
  }, [modality, level, goal]);

  useFocusEffect(
    useCallback(() => {
      return load();
    }, [load]),
  );

  const suggestedIds = useMemo(
    () => new Set(recommended.map((item) => item.id)),
    [recommended],
  );

  return (
    <Screen>
      <Text className="text-title text-ink">Workouts</Text>
      <Text className="mt-xs text-caption text-muted">
        Filter by modality, level, and goal. Equipment is applied from your
        profile on Recommend.
      </Text>
      {error ? (
        <Text className="mt-sm text-caption text-danger">{error}</Text>
      ) : null}

      <Text className="mb-xs mt-md text-caption text-muted">Modality</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-sm"
      >
        {MODALITIES.map((item) => (
          <Chip
            key={item}
            label={item}
            active={modality === item}
            onPress={() => setModality(item)}
          />
        ))}
      </ScrollView>
      <Text className="mb-xs mt-md text-caption text-muted">Level</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-sm"
      >
        {LEVELS.map((item) => (
          <Chip
            key={item}
            label={item}
            active={level === item}
            onPress={() => setLevel(item)}
          />
        ))}
      </ScrollView>
      <Text className="mb-xs mt-md text-caption text-muted">Goal</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-sm"
      >
        {GOALS.map((item) => (
          <Chip
            key={item}
            label={item}
            active={goal === item}
            onPress={() => setGoal(item)}
          />
        ))}
      </ScrollView>

      {recommended.length ? (
        <>
          <SectionHeader title="Recommended for you" />
          {recommended.slice(0, 5).map((workout) => (
            <Pressable
              key={`rec-${workout.id}`}
              onPress={() =>
                navigation.navigate("WorkoutDetail", { workoutId: workout.id })
              }
            >
              <Card className="mb-sm">
                <Text className="mb-xxs text-body font-semibold text-ink">
                  {workout.name}
                </Text>
                <Text className="text-caption text-muted">
                  {workout.modality.replace(/_/g, " ")} · {workout.level} ·{" "}
                  {workout.exercise_count} moves
                </Text>
              </Card>
            </Pressable>
          ))}
        </>
      ) : null}

      <SectionHeader title="Programs" />
      {programs.map((program) => (
        <Pressable
          key={program.id}
          onPress={() =>
            navigation.navigate("ProgramDetail", { programId: program.id })
          }
        >
          <Card className="mb-sm">
            <Text className="mb-xxs text-body font-semibold text-ink">
              {program.name}
            </Text>
            <Text className="text-caption text-muted">
              {program.duration_weeks} weeks · {program.workout_count} sessions
            </Text>
          </Card>
        </Pressable>
      ))}

      <SectionHeader title="Library" />
      {workouts.map((workout) => (
        <Pressable
          key={workout.id}
          onPress={() =>
            navigation.navigate("WorkoutDetail", { workoutId: workout.id })
          }
        >
          <Card
            className={
              suggestedIds.has(workout.id)
                ? "mb-sm border-accent bg-accent-soft"
                : "mb-sm"
            }
          >
            <Text className="mb-xxs text-body font-semibold text-ink">
              {workout.name}
            </Text>
            <Text className="text-caption text-muted">
              {workout.modality.replace(/_/g, " ")} · {workout.level} ·{" "}
              {workout.goal_tags[0]?.replace(/_/g, " ")}
            </Text>
          </Card>
        </Pressable>
      ))}
      {!workouts.length ? (
        <Text className="text-caption text-muted">
          No workouts match these filters.
        </Text>
      ) : null}
    </Screen>
  );
}
