import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { api, WorkoutDetail } from "../api";
import { ActionStack } from "../components/layout/ActionStack";
import { DetailColumn, PageShell } from "../components/layout";
import {
  AppText,
  Badge,
  Button,
  Card,
  PageTitle,
  Screen,
  SectionHeader,
} from "../components/ui";
import { navigateRootFocus } from "../navigation/navHelpers";
import { WorkoutStackParamList } from "../navigation/types";
import {
  isWorkoutPreview,
  PREVIEW_WORKOUT_DETAIL,
  PREVIEW_WORKOUT_ID,
} from "../workoutPreviewSeed";

type Nav = NativeStackNavigationProp<WorkoutStackParamList, "WorkoutDetail">;
type R = RouteProp<WorkoutStackParamList, "WorkoutDetail">;

export default function WorkoutDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<R>();
  const [workout, setWorkout] = useState<WorkoutDetail | null>(() =>
    isWorkoutPreview() && params.workoutId === PREVIEW_WORKOUT_ID
      ? PREVIEW_WORKOUT_DETAIL
      : null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isWorkoutPreview() && params.workoutId === PREVIEW_WORKOUT_ID) return;
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
        <AppText variant="caption" muted>
          {error}
        </AppText>
      </Screen>
    );
  }
  if (!workout) {
    return (
      <Screen>
        <AppText variant="caption" muted>
          Loading…
        </AppText>
      </Screen>
    );
  }

  const meta = [
    workout.modality.replace(/_/g, " "),
    workout.level,
    workout.goal_tags[0]?.replace(/_/g, " "),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Screen>
      <PageShell centeredMobile={false}>
      <DetailColumn>
        <PageTitle variant="title" className="mb-lg">
          {workout.name}
        </PageTitle>
        <AppText variant="caption" className="mb-lg w-full text-center">
          {meta}
        </AppText>

        <SectionHeader title="Exercises" className="mt-0 w-full" />
        {workout.exercises.map((item) => (
          <Card
            key={`${item.exercise_id}-${item.order_index}`}
            variant="elevated"
            interactive
            className="mb-sm w-full shadow-sm"
          >
            <View className="mb-xs flex-row items-center gap-sm">
              <View className="h-8 w-8 items-center justify-center rounded-full border border-accent">
                <AppText variant="caption" accent className="font-bold">
                  {item.order_index + 1}
                </AppText>
              </View>
              <View className="flex-1">
                <AppText variant="bodyStrong">{item.name}</AppText>
                {item.description ? (
                  <AppText variant="caption" className="mt-xxs text-muted">
                    {item.description}
                  </AppText>
                ) : null}
              </View>
            </View>
            <View className="mt-sm flex-row flex-wrap gap-xs">
              <Badge label={`${item.sets} sets`} tone="neutral" />
              {item.reps != null ? (
                <Badge label={`${item.reps} reps`} tone="neutral" />
              ) : null}
              {item.duration_seconds != null ? (
                <Badge label={`${item.duration_seconds}s`} tone="neutral" />
              ) : null}
              <Badge label={`${item.rest_seconds}s rest`} tone="neutral" />
            </View>
          </Card>
        ))}

        <ActionStack align="center" className="mt-lg w-full">
          <Button
            label="Start session"
            className="w-full"
            onPress={() => {
              api.logEvent({
                event_type: "task_started",
                task: "workout_session",
                screen: "WorkoutDetail",
              });
              navigateRootFocus(navigation, "WorkoutSession", {
                workoutId: workout.id,
              });
            }}
          />
        </ActionStack>
      </DetailColumn>
      </PageShell>
    </Screen>
  );
}
