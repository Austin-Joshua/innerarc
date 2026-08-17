import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { api, WorkoutDetail } from "../api";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, typography } from "../theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "WorkoutDetail">;
type R = RouteProp<RootStackParamList, "WorkoutDetail">;

export default function WorkoutDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<R>();
  const [workout, setWorkout] = useState<WorkoutDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .workout(params.workoutId)
      .then(setWorkout)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load workout"),
      );
  }, [params.workoutId]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>{error}</Text>
      </View>
    );
  }
  if (!workout) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: spacing.xl }}
    >
      <Text style={styles.title}>{workout.name}</Text>
      <Text style={styles.muted}>
        {workout.modality.replace(/_/g, " ")} · {workout.level} · needs{" "}
        {workout.equipment_needed.join(", ").replace(/_/g, " ")}
      </Text>
      <Text style={styles.goals}>
        {workout.goal_tags.map((g) => g.replace(/_/g, " ")).join(" · ")}
      </Text>

      <Text style={styles.heading}>Exercises</Text>
      {workout.exercises.map((item) => (
        <View
          key={`${item.exercise_id}-${item.order_index}`}
          style={styles.card}
        >
          <Text style={styles.cardTitle}>
            {item.order_index + 1}. {item.name}
          </Text>
          <Text style={styles.muted}>{item.description}</Text>
          <Text style={styles.meta}>
            {item.sets} sets
            {item.reps != null ? ` · ${item.reps} reps` : ""}
            {item.duration_seconds != null
              ? ` · ${item.duration_seconds}s`
              : ""}
            {` · ${item.rest_seconds}s rest`}
          </Text>
        </View>
      ))}

      <Pressable
        style={styles.button}
        onPress={() => {
          api.logEvent({
            event_type: "task_started",
            task: "workout_session",
            screen: "WorkoutDetail",
          });
          navigation.navigate("WorkoutSession", { workoutId: workout.id });
        }}
      >
        <Text style={styles.buttonLabel}>Start session</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  title: { ...typography.title, marginBottom: spacing.xs },
  muted: { ...typography.muted },
  goals: {
    ...typography.body,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  heading: { ...typography.heading, marginBottom: spacing.sm },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardTitle: { ...typography.body, fontWeight: "600", marginBottom: 4 },
  meta: { ...typography.muted, marginTop: spacing.xs },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  buttonLabel: { color: colors.white, fontWeight: "600", fontSize: 16 },
});
