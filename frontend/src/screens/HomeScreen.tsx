import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { api, Dashboard, GamificationState } from "../api";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, typography } from "../theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "Home">;

function MacroRow({
  label,
  logged,
  target,
}: {
  label: string;
  logged: number;
  target: number;
}) {
  const ratio = target > 0 ? Math.min(1, logged / target) : 0;
  return (
    <View style={styles.macro}>
      <View style={styles.macroHeader}>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={styles.numeralSmall}>
          {Math.round(logged)} / {target}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const [data, setData] = useState<Dashboard | null>(null);
  const [game, setGame] = useState<GamificationState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([api.dashboardToday(), api.gamificationStatus().catch(() => null)])
        .then(([dash, g]) => {
          if (!active) return;
          setData(dash);
          setGame(g);
        })
        .catch((err) => setError(err instanceof Error ? err.message : "Could not load dashboard"));
      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xl }}>
      <Text style={styles.title}>Today</Text>
      <Text style={styles.muted}>
        Logged vs your calculated target{data ? ` (${data.target.source})` : ""}.
      </Text>
      {game ? (
        <Text style={styles.streakLine}>
          {game.streak_count} day streak · {game.points} pts
        </Text>
      ) : null}
      {error ? <Text style={styles.muted}>{error}</Text> : null}
      <View style={styles.card}>
        <Text style={styles.numeral}>{data ? Math.round(data.logged.calories) : "—"}</Text>
        <Text style={styles.muted}>
          of {data ? data.target.calories : "—"} kcal
        </Text>
      </View>
      {data ? (
        <>
          <MacroRow label="Protein (g)" logged={data.logged.protein_g} target={data.target.protein_g} />
          <MacroRow label="Carbs (g)" logged={data.logged.carbs_g} target={data.target.carbs_g} />
          <MacroRow label="Fat (g)" logged={data.logged.fat_g} target={data.target.fat_g} />
        </>
      ) : null}
      <Pressable onPress={() => navigation.navigate("FoodCapture")} style={styles.button}>
        <Text style={styles.buttonLabel}>Log meal</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate("WorkoutLibrary")} style={styles.secondary}>
        <Text style={styles.actionLabel}>Workouts</Text>
        <Text style={styles.muted}>Library, programs, and session player</Text>
      </Pressable>
      <Pressable
        onPress={() => navigation.navigate("ProgressCapture")}
        style={[styles.secondary, { marginTop: spacing.sm }]}
      >
        <Text style={styles.actionLabel}>Progress</Text>
        <Text style={styles.muted}>Pose ratios and side-by-side check-in</Text>
      </Pressable>
      <Pressable
        onPress={() => navigation.navigate("CoachChat")}
        style={[styles.secondary, { marginTop: spacing.sm }]}
      >
        <Text style={styles.actionLabel}>Coach</Text>
        <Text style={styles.muted}>Ask about your logged week</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.xl },
  title: { ...typography.title, marginBottom: spacing.xs },
  muted: { ...typography.muted },
  streakLine: { ...typography.muted, marginTop: spacing.xs, marginBottom: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  numeral: { ...typography.numeral, marginBottom: spacing.xs },
  numeralSmall: { fontWeight: "700", color: colors.text },
  macro: { marginBottom: spacing.md },
  macroHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  macroLabel: { ...typography.body },
  track: {
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: 8,
    overflow: "hidden",
  },
  fill: { height: 8, backgroundColor: colors.accent, borderRadius: 8 },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  buttonLabel: { color: colors.white, fontWeight: "600", fontSize: 16 },
  secondary: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionLabel: { ...typography.heading, fontSize: 16, marginBottom: 2 },
});
