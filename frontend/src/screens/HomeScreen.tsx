import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { api, Dashboard, GamificationState, WearableReading } from "../api";
import { healthConnect } from "../healthConnect";
import { RootStackParamList } from "../navigation/types";
import { LAST_SYNC_KEY } from "./WearableConnectScreen";
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

function formatMetric(reading: WearableReading | undefined, unit: string): string {
  if (!reading) return "—";
  const v = reading.metric_type === "sleep" ? reading.value.toFixed(1) : Math.round(reading.value);
  return `${v} ${unit}`;
}

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const [data, setData] = useState<Dashboard | null>(null);
  const [game, setGame] = useState<GamificationState | null>(null);
  const [wearable, setWearable] = useState<WearableReading[]>([]);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    let active = true;
    Promise.all([
      api.dashboardToday(),
      api.gamificationStatus().catch(() => null),
      api.wearableRecent().catch(() => null),
      AsyncStorage.getItem(LAST_SYNC_KEY),
    ])
      .then(([dash, g, w, synced]) => {
        if (!active) return;
        setData(dash);
        setGame(g);
        setWearable(w?.readings ?? []);
        setLastSynced(synced);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load dashboard"));
    return () => {
      active = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      return refresh();
    }, [refresh]),
  );

  const byType = (t: string) => wearable.find((r) => r.metric_type === t);

  const onSyncNow = async () => {
    if (Platform.OS !== "android") {
      setSyncMsg("Health Connect is Android-only in this pass.");
      return;
    }
    setSyncBusy(true);
    setSyncMsg(null);
    try {
      const ok = await healthConnect.initialize();
      if (!ok) {
        navigation.navigate("WearableConnect");
        return;
      }
      const granted = await healthConnect.requestPermissions(__DEV__);
      if (!granted) {
        navigation.navigate("WearableConnect");
        return;
      }
      let readings = await healthConnect.readRecent();
      if (readings.length === 0 && __DEV__) {
        await healthConnect.seedVerificationData();
        readings = await healthConnect.readRecent();
      }
      if (readings.length === 0) {
        setSyncMsg("No recent Health Connect data found.");
        return;
      }
      const result = await api.wearableSync(readings);
      const iso = new Date().toISOString();
      await AsyncStorage.setItem(LAST_SYNC_KEY, iso);
      setLastSynced(iso);
      setSyncMsg(`Synced ${result.total} · ${result.inserted} new, ${result.updated} updated`);
      const recent = await api.wearableRecent();
      setWearable(recent.readings);
    } catch (err) {
      setSyncMsg(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncBusy(false);
    }
  };

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

      <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>Wearables</Text>
      <Text style={styles.muted}>
        Steps today · latest heart rate · latest sleep
        {lastSynced ? ` · last sync ${new Date(lastSynced).toLocaleString()}` : ""}
      </Text>
      <View style={styles.wearableRow}>
        <Text style={styles.wearableItem}>Steps {formatMetric(byType("steps"), "")}</Text>
        <Text style={styles.wearableItem}>HR {formatMetric(byType("heart_rate"), "bpm")}</Text>
        <Text style={styles.wearableItem}>Sleep {formatMetric(byType("sleep"), "h")}</Text>
      </View>
      {syncMsg ? <Text style={styles.muted}>{syncMsg}</Text> : null}
      <Pressable
        onPress={onSyncNow}
        style={[styles.secondary, { marginTop: spacing.sm }]}
        disabled={syncBusy}
      >
        {syncBusy ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <>
            <Text style={styles.actionLabel}>Sync Now</Text>
            <Text style={styles.muted}>Pull from Health Connect (manual)</Text>
          </>
        )}
      </Pressable>
      <Pressable
        onPress={() => navigation.navigate("WearableConnect")}
        style={[styles.secondary, { marginTop: spacing.sm }]}
      >
        <Text style={styles.actionLabel}>Connections</Text>
        <Text style={styles.muted}>Explain permissions before first grant</Text>
      </Pressable>

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
  sectionLabel: { ...typography.heading, fontSize: 16, marginBottom: spacing.xs },
  wearableRow: { marginTop: spacing.sm, marginBottom: spacing.sm, gap: 4 },
  wearableItem: { ...typography.body },
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
