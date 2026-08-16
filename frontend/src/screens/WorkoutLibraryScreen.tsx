import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { api, ProgramSummary, WorkoutSummary } from "../api";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, typography } from "../theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "WorkoutLibrary">;

const MODALITIES = ["all", "bodyweight", "home_gym", "weighted", "yoga", "aerobics"] as const;
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
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label.replace(/_/g, " ")}</Text>
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
          api.recommendWorkouts({
            modality: params.modality,
            level: params.level,
            goal: params.goal,
          }).catch(() => [] as WorkoutSummary[]),
        ]).then(([w, r]) => {
          if (!active) return;
          setWorkouts(w);
          setRecommended(r);
          setError(null);
        });
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Could not load workouts");
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

  const suggestedIds = useMemo(() => new Set(recommended.map((item) => item.id)), [recommended]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xl }}>
      <Text style={styles.title}>Workouts</Text>
      <Text style={styles.muted}>Filter by modality, level, and goal. Equipment is applied from your profile on Recommend.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.section}>Modality</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
        {MODALITIES.map((item) => (
          <Chip key={item} label={item} active={modality === item} onPress={() => setModality(item)} />
        ))}
      </ScrollView>
      <Text style={styles.section}>Level</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
        {LEVELS.map((item) => (
          <Chip key={item} label={item} active={level === item} onPress={() => setLevel(item)} />
        ))}
      </ScrollView>
      <Text style={styles.section}>Goal</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
        {GOALS.map((item) => (
          <Chip key={item} label={item} active={goal === item} onPress={() => setGoal(item)} />
        ))}
      </ScrollView>

      {recommended.length ? (
        <>
          <Text style={styles.heading}>Recommended for you</Text>
          {recommended.slice(0, 5).map((workout) => (
            <Pressable
              key={`rec-${workout.id}`}
              style={styles.card}
              onPress={() => navigation.navigate("WorkoutDetail", { workoutId: workout.id })}
            >
              <Text style={styles.cardTitle}>{workout.name}</Text>
              <Text style={styles.muted}>
                {workout.modality.replace(/_/g, " ")} · {workout.level} · {workout.exercise_count} moves
              </Text>
            </Pressable>
          ))}
        </>
      ) : null}

      <Text style={styles.heading}>Programs</Text>
      {programs.map((program) => (
        <Pressable
          key={program.id}
          style={styles.card}
          onPress={() => navigation.navigate("ProgramDetail", { programId: program.id })}
        >
          <Text style={styles.cardTitle}>{program.name}</Text>
          <Text style={styles.muted}>
            {program.duration_weeks} weeks · {program.workout_count} sessions
          </Text>
        </Pressable>
      ))}

      <Text style={styles.heading}>Library</Text>
      {workouts.map((workout) => (
        <Pressable
          key={workout.id}
          style={[styles.card, suggestedIds.has(workout.id) && styles.cardSuggested]}
          onPress={() => navigation.navigate("WorkoutDetail", { workoutId: workout.id })}
        >
          <Text style={styles.cardTitle}>{workout.name}</Text>
          <Text style={styles.muted}>
            {workout.modality.replace(/_/g, " ")} · {workout.level} · {workout.goal_tags[0]?.replace(/_/g, " ")}
          </Text>
        </Pressable>
      ))}
      {!workouts.length ? <Text style={styles.muted}>No workouts match these filters.</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.xl },
  title: { ...typography.title, marginBottom: spacing.xs },
  muted: { ...typography.muted },
  error: { ...typography.muted, color: "#8B3A3A", marginTop: spacing.sm },
  section: { ...typography.muted, marginTop: spacing.md, marginBottom: spacing.xs },
  row: { marginBottom: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    marginRight: spacing.xs,
    borderRadius: 10,
  },
  chipActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  chipLabel: { ...typography.muted, textTransform: "capitalize" },
  chipLabelActive: { color: colors.accent, fontWeight: "600" },
  heading: { ...typography.heading, marginTop: spacing.lg, marginBottom: spacing.sm },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardSuggested: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  cardTitle: { ...typography.body, fontWeight: "600", marginBottom: 4 },
});
