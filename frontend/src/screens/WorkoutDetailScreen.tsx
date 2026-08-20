import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { Text } from "react-native";

import { api, WorkoutDetail } from "../api";
import { Button, Card, Screen, SectionHeader } from "../components/ui";
import { RootStackParamList } from "../navigation/types";

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
      <Screen>
        <Text className="text-caption text-muted">{error}</Text>
      </Screen>
    );
  }
  if (!workout) {
    return (
      <Screen>
        <Text className="text-caption text-muted">Loading…</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text className="text-title text-ink">{workout.name}</Text>
      <Text className="mt-xs text-caption text-muted">
        {workout.modality.replace(/_/g, " ")} · {workout.level} · needs{" "}
        {workout.equipment_needed.join(", ").replace(/_/g, " ")}
      </Text>
      <Text className="mb-lg mt-sm text-body text-ink">
        {workout.goal_tags.map((g) => g.replace(/_/g, " ")).join(" · ")}
      </Text>

      <SectionHeader title="Exercises" className="mt-0" />
      {workout.exercises.map((item) => (
        <Card
          key={`${item.exercise_id}-${item.order_index}`}
          className="mb-sm"
        >
          <Text className="mb-xxs text-body font-semibold text-ink">
            {item.order_index + 1}. {item.name}
          </Text>
          <Text className="text-caption text-muted">{item.description}</Text>
          <Text className="mt-xs text-caption text-muted">
            {item.sets} sets
            {item.reps != null ? ` · ${item.reps} reps` : ""}
            {item.duration_seconds != null
              ? ` · ${item.duration_seconds}s`
              : ""}
            {` · ${item.rest_seconds}s rest`}
          </Text>
        </Card>
      ))}

      <Button
        label="Start session"
        className="mt-lg"
        onPress={() => {
          api.logEvent({
            event_type: "task_started",
            task: "workout_session",
            screen: "WorkoutDetail",
          });
          navigation.navigate("WorkoutSession", { workoutId: workout.id });
        }}
      />
    </Screen>
  );
}
