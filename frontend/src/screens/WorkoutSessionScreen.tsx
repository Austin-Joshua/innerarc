import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { api, BadgeEarned, WorkoutDetail } from "../api";
import BadgeBanner from "../components/BadgeBanner";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, typography } from "../theme";

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
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load session"));
  }, [params.workoutId]);

  useEffect(() => {
    if (!workout || doneMessage) return;
    if (secondsLeft > 0) {
      const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
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
    if (current.rest_seconds > 0 && (setIndex + 1 < current.sets || exerciseIndex + 1 < (workout?.exercises.length ?? 0))) {
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
      <View style={styles.container}>
        <Text style={styles.muted}>{error}</Text>
      </View>
    );
  }
  if (!workout || !current) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>Loading session…</Text>
      </View>
    );
  }

  if (doneMessage) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Session complete</Text>
        <Text style={styles.heading}>{workout.name}</Text>
        <Text style={styles.muted}>{doneMessage}</Text>
        <BadgeBanner badges={badges} />
        {error ? <Text style={styles.muted}>{error}</Text> : null}
        <Pressable style={styles.button} onPress={() => navigation.navigate("Home")}>
          <Text style={styles.buttonLabel}>Back to Home</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.muted}>{progressLabel}</Text>
      <Text style={styles.title}>{current.name}</Text>
      <Text style={styles.body}>{current.description}</Text>
      <Text style={styles.meta}>
        {current.reps != null ? `${current.reps} reps` : `${current.duration_seconds ?? 45}s hold`}
      </Text>

      <View style={styles.timerBlock}>
        <Text style={styles.phase}>{phase === "work" ? "Work" : "Rest"}</Text>
        <Text style={styles.timer}>{secondsLeft}s</Text>
      </View>

      {next ? (
        <Text style={styles.muted}>Up next: {next.name}</Text>
      ) : (
        <Text style={styles.muted}>Final exercise</Text>
      )}

      {phase === "work" ? (
        <Pressable style={styles.button} onPress={markSetComplete}>
          <Text style={styles.buttonLabel}>Complete set</Text>
        </Pressable>
      ) : (
        <Pressable style={styles.button} onPress={skipRest}>
          <Text style={styles.buttonLabel}>Skip rest / next</Text>
        </Pressable>
      )}
      {logging ? <Text style={styles.muted}>Saving log…</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.xl },
  title: { ...typography.title, marginTop: spacing.sm, marginBottom: spacing.sm },
  heading: { ...typography.heading, marginBottom: spacing.sm },
  body: { ...typography.body, marginBottom: spacing.sm },
  muted: { ...typography.muted },
  meta: { ...typography.heading, marginBottom: spacing.lg },
  timerBlock: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: spacing.xl,
    alignItems: "center",
    marginVertical: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  phase: { ...typography.muted, marginBottom: spacing.xs, textTransform: "uppercase" },
  timer: { fontSize: 56, fontWeight: "700", color: colors.text },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  buttonLabel: { color: colors.white, fontWeight: "600", fontSize: 16 },
});
