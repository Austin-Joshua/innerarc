import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { api, ProgramDetail } from "../api";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, typography } from "../theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "ProgramDetail">;
type R = RouteProp<RootStackParamList, "ProgramDetail">;

export default function ProgramDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<R>();
  const [program, setProgram] = useState<ProgramDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .program(params.programId)
      .then(setProgram)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load program"));
  }, [params.programId]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>{error}</Text>
      </View>
    );
  }
  if (!program) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xl }}>
      <Text style={styles.title}>{program.name}</Text>
      <Text style={styles.muted}>
        {program.duration_weeks} weeks · {program.workout_count} sessions
      </Text>
      <Text style={styles.heading}>Schedule</Text>
      {program.schedule.map((slot) => (
        <Pressable
          key={`${slot.week_number}-${slot.day_number}-${slot.workout.id}`}
          style={styles.card}
          onPress={() => navigation.navigate("WorkoutDetail", { workoutId: slot.workout.id })}
        >
          <Text style={styles.meta}>
            Week {slot.week_number} · Day {slot.day_number}
          </Text>
          <Text style={styles.cardTitle}>{slot.workout.name}</Text>
          <Text style={styles.muted}>
            {slot.workout.modality.replace(/_/g, " ")} · {slot.workout.level}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.xl },
  title: { ...typography.title, marginBottom: spacing.xs },
  muted: { ...typography.muted },
  heading: { ...typography.heading, marginTop: spacing.lg, marginBottom: spacing.sm },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  meta: { ...typography.muted, marginBottom: 4 },
  cardTitle: { ...typography.body, fontWeight: "600", marginBottom: 4 },
});
