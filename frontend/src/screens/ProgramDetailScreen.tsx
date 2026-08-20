import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { Pressable, Text } from "react-native";

import { api, ProgramDetail } from "../api";
import { Card, Screen, SectionHeader } from "../components/ui";
import { RootStackParamList } from "../navigation/types";

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
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load program"),
      );
  }, [params.programId]);

  if (error) {
    return (
      <Screen>
        <Text className="text-caption text-muted">{error}</Text>
      </Screen>
    );
  }
  if (!program) {
    return (
      <Screen>
        <Text className="text-caption text-muted">Loading…</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text className="text-title text-ink">{program.name}</Text>
      <Text className="mt-xs text-caption text-muted">
        {program.duration_weeks} weeks · {program.workout_count} sessions
      </Text>
      <SectionHeader title="Schedule" />
      {program.schedule.map((slot) => (
        <Pressable
          key={`${slot.week_number}-${slot.day_number}-${slot.workout.id}`}
          onPress={() =>
            navigation.navigate("WorkoutDetail", { workoutId: slot.workout.id })
          }
        >
          <Card className="mb-sm">
            <Text className="mb-xxs text-caption text-muted">
              Week {slot.week_number} · Day {slot.day_number}
            </Text>
            <Text className="mb-xxs text-body font-semibold text-ink">
              {slot.workout.name}
            </Text>
            <Text className="text-caption text-muted">
              {slot.workout.modality.replace(/_/g, " ")} · {slot.workout.level}
            </Text>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}
