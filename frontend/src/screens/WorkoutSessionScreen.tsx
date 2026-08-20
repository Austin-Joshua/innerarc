import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useMemo, useRef, useState } from "react";
import { Text } from "react-native";

import { api, BadgeEarned, WorkoutDetail } from "../api";
import BadgeBanner from "../components/BadgeBanner";
import FeedbackPrompt from "../components/FeedbackPrompt";
import { Button, Card, Screen } from "../components/ui";
import { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList, "WorkoutSession">;
type R = RouteProp<RootStackParamList, "WorkoutSession">;

type Phase = "work" | "rest";

export default function WorkoutSessionScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<R>();
  const [workout, setWorkout] = useState<WorkoutDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [setIndex, setSetIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("work");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [logging, setLogging] = useState(false);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);
  const [badges, setBadges] = useState<BadgeEarned[]>([]);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    api
      .workout(params.workoutId)
      .then((value) => {
        setWorkout(value);
        const first = value.exercises[0];
        setSecondsLeft(first?.duration_seconds ?? 45);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load session"),
      );
  }, [params.workoutId]);

  useEffect(() => {
    if (!workout || doneMessage) return;
    if (secondsLeft > 0) {
      const timer = setTimeout(
        () => setSecondsLeft((value) => value - 1),
        1000,
      );
      return () => clearTimeout(timer);
    }
    if (phase === "rest") {
      advanceAfterSet();
    }
  }, [secondsLeft, workout, doneMessage, phase]);

  const current = workout?.exercises[exerciseIndex] ?? null;
  const next = workout?.exercises[exerciseIndex + 1] ?? null;
  const progressLabel = useMemo(() => {
    if (!workout || !current) return "";
    return `Exercise ${exerciseIndex + 1}/${workout.exercises.length} · Set ${setIndex + 1}/${current.sets}`;
  }, [workout, current, exerciseIndex, setIndex]);

  async function completeSession() {
    if (!workout || logging) return;
    setLogging(true);
    const durationMin = Math.max(1, (Date.now() - startedAt.current) / 60000);
    try {
      const log = await api.logWorkout({
        workout_id: workout.id,
        duration_min: Math.round(durationMin * 10) / 10,
      });
      setBadges(log.gamification?.new_badges ?? []);
      setDoneMessage(`Logged · ${log.calories_burned_est} kcal est.`);
      api.logEvent({
        event_type: "task_completed",
        task: "workout_session",
        screen: "WorkoutSession",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log workout");
      setLogging(false);
    }
  }

  function advanceAfterSet() {
    if (!workout || !current) return;
    if (setIndex + 1 < current.sets) {
      setSetIndex((value) => value + 1);
      setPhase("work");
      setSecondsLeft(current.duration_seconds ?? 45);
      return;
    }
    if (exerciseIndex + 1 < workout.exercises.length) {
      const upcoming = workout.exercises[exerciseIndex + 1];
      setExerciseIndex((value) => value + 1);
      setSetIndex(0);
      setPhase("work");
      setSecondsLeft(upcoming.duration_seconds ?? 45);
      return;
    }
    void completeSession();
  }

  function markSetComplete() {
    if (!current) return;
    if (
      current.rest_seconds > 0 &&
      (setIndex + 1 < current.sets ||
        exerciseIndex + 1 < (workout?.exercises.length ?? 0))
    ) {
      setPhase("rest");
      setSecondsLeft(current.rest_seconds);
      return;
    }
    advanceAfterSet();
  }

  function skipRest() {
    advanceAfterSet();
  }

  if (error && !workout) {
    return (
      <Screen scroll={false} confirmLeaveHome={false}>
        <Text className="text-caption text-muted">{error}</Text>
      </Screen>
    );
  }
  if (!workout || !current) {
    return (
      <Screen scroll={false} confirmLeaveHome={false}>
        <Text className="text-caption text-muted">Loading session…</Text>
      </Screen>
    );
  }

  if (doneMessage) {
    return (
      <Screen scroll={false} confirmLeaveHome={false}>
        <Text className="text-title text-ink">Session complete</Text>
        <Text className="mb-sm mt-xs text-heading text-ink">{workout.name}</Text>
        <Text className="text-caption text-muted">{doneMessage}</Text>
        <BadgeBanner badges={badges} />
        <FeedbackPrompt screen="WorkoutSession" />
        {error ? (
          <Text className="mt-sm text-caption text-muted">{error}</Text>
        ) : null}
        <Button
          label="Back to Home"
          className="mt-lg"
          onPress={() => navigation.navigate("Home")}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <Text className="text-caption text-muted">{progressLabel}</Text>
      <Text className="mb-sm mt-sm text-title text-ink">{current.name}</Text>
      <Text className="mb-sm text-body text-ink">{current.description}</Text>
      <Text className="mb-lg text-heading text-ink">
        {current.reps != null
          ? `${current.reps} reps`
          : `${current.duration_seconds ?? 45}s hold`}
      </Text>

      <Card className="my-lg items-center py-xl">
        <Text className="mb-xs text-caption uppercase text-muted">
          {phase === "work" ? "Work" : "Rest"}
        </Text>
        <Text className="text-[56px] font-bold text-ink">{secondsLeft}s</Text>
      </Card>

      {next ? (
        <Text className="text-caption text-muted">Up next: {next.name}</Text>
      ) : (
        <Text className="text-caption text-muted">Final exercise</Text>
      )}

      {phase === "work" ? (
        <Button
          label="Complete set"
          className="mt-lg"
          onPress={markSetComplete}
        />
      ) : (
        <Button
          label="Skip rest / next"
          className="mt-lg"
          onPress={skipRest}
        />
      )}
      {logging ? (
        <Text className="mt-sm text-caption text-muted">Saving log…</Text>
      ) : null}
    </Screen>
  );
}
