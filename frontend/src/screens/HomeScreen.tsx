import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";

import {
  api,
  CoachNudge,
  Dashboard,
  GamificationState,
  WearableReading,
} from "../api";
import { HomeProgressRings } from "../charts/HomeProgressRings";
import { Badge, Button, Card, Screen, SectionHeader, StatCard } from "../components/ui";
import { healthConnect } from "../healthConnect";
import { RootStackParamList } from "../navigation/types";
import { LAST_SYNC_KEY } from "./WearableConnectScreen";

type Nav = NativeStackNavigationProp<RootStackParamList, "Home">;

const nudgeDismissKey = (nudgeId: string, day: string) =>
  `coach_nudge_dismissed:${day}:${nudgeId}`;

function formatMetric(
  reading: WearableReading | undefined,
  unit: string,
): string {
  if (!reading) return "—";
  const v =
    reading.metric_type === "sleep"
      ? reading.value.toFixed(1)
      : Math.round(reading.value);
  return `${v} ${unit}`;
}

function NavCard({
  title,
  caption,
  onPress,
}: {
  title: string;
  caption: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="mt-sm">
      <Card>
        <Text className="text-heading font-semibold text-ink">{title}</Text>
        <Text className="mt-xxs text-caption text-muted">{caption}</Text>
      </Card>
    </Pressable>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const [data, setData] = useState<Dashboard | null>(null);
  const [game, setGame] = useState<GamificationState | null>(null);
  const [wearable, setWearable] = useState<WearableReading[]>([]);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [nudge, setNudge] = useState<CoachNudge | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    let active = true;
    const utcDay = new Date().toISOString().slice(0, 10);
    Promise.all([
      api.dashboardToday(),
      api.gamificationStatus().catch(() => null),
      api.wearableRecent().catch(() => null),
      api.coachNudge().catch(() => ({ nudge: null })),
      AsyncStorage.getItem(LAST_SYNC_KEY),
    ])
      .then(async ([dash, g, w, nudgeRes, synced]) => {
        if (!active) return;
        setData(dash);
        setGame(g);
        setWearable(w?.readings ?? []);
        setLastSynced(synced);
        const next = nudgeRes?.nudge ?? null;
        if (!next) {
          setNudge(null);
          return;
        }
        const dismissed = await AsyncStorage.getItem(
          nudgeDismissKey(next.id, utcDay),
        );
        if (!active) return;
        setNudge(dismissed ? null : next);
      })
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Could not load dashboard",
        ),
      );
    return () => {
      active = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      return refresh();
    }, [refresh]),
  );

  const onDismissNudge = async () => {
    if (!nudge) return;
    const utcDay = new Date().toISOString().slice(0, 10);
    const id = nudge.id;
    setNudge(null);
    try {
      await AsyncStorage.setItem(nudgeDismissKey(id, utcDay), "1");
    } catch {
      /* local dismiss only — never block navigation */
    }
  };

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
      setSyncMsg(
        `Synced ${result.total} · ${result.inserted} new, ${result.updated} updated`,
      );
      const recent = await api.wearableRecent();
      setWearable(recent.readings);
    } catch (err) {
      setSyncMsg(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncBusy(false);
    }
  };

  return (
    <Screen>
      <Text className="mb-xs text-display font-semibold text-ink">Today</Text>
      <Text className="text-caption text-muted">
        Logged vs your calculated target{data ? ` (${data.target.source})` : ""}
        .
      </Text>
      {game ? (
        <Text className="mb-sm mt-xs text-caption text-muted">
          {game.streak_count} day streak · {game.points} pts
        </Text>
      ) : null}
      {error ? (
        <Text className="text-caption text-danger">{error}</Text>
      ) : null}

      {nudge ? (
        <Card className="mb-md mt-sm border-2 border-accent bg-accent-soft">
          <View className="mb-xs flex-row items-center justify-between">
            <Badge label="Coach note" tone="accent" />
            <Pressable
              onPress={onDismissNudge}
              hitSlop={12}
              accessibilityRole="button"
            >
              <Text className="text-caption font-semibold text-muted">
                Dismiss
              </Text>
            </Pressable>
          </View>
          <Text className="text-body text-ink">{nudge.response}</Text>
        </Card>
      ) : null}

      <Card className="mb-lg mt-sm bg-surface">
        {data ? (
          <HomeProgressRings
            data={data}
            streakCount={game?.streak_count ?? 0}
          />
        ) : (
          <>
            <Text className="mb-xs text-numeral font-bold text-ink">—</Text>
            <Text className="text-caption text-muted">of — kcal</Text>
          </>
        )}
      </Card>

      <SectionHeader
        title="Wearables"
        caption={`Steps today · latest heart rate · latest sleep${
          lastSynced
            ? ` · last sync ${new Date(lastSynced).toLocaleString()}`
            : ""
        }`}
      />
      <View className="mb-sm mt-sm flex-row gap-sm">
        <StatCard
          value={formatMetric(byType("steps"), "")}
          label="Steps"
          className="flex-1"
        />
        <StatCard
          value={formatMetric(byType("heart_rate"), "bpm")}
          label="HR"
          className="flex-1"
        />
        <StatCard
          value={formatMetric(byType("sleep"), "h")}
          label="Sleep"
          className="flex-1"
        />
      </View>
      {syncMsg ? (
        <Text className="text-caption text-muted">{syncMsg}</Text>
      ) : null}
      <Button
        label="Sync Now"
        variant="secondary"
        onPress={onSyncNow}
        disabled={syncBusy}
        busy={syncBusy}
        className="mt-sm"
      />
      <Text className="mb-sm mt-xxs text-center text-caption text-muted">
        Pull from Health Connect (manual)
      </Text>
      <NavCard
        title="Connections"
        caption="Explain permissions before first grant"
        onPress={() => navigation.navigate("WearableConnect")}
      />

      <Button
        label="Log meal"
        onPress={() => navigation.navigate("FoodCapture")}
        className="mb-sm mt-md"
      />
      <NavCard
        title="Workouts"
        caption="Library, programs, and session player"
        onPress={() => navigation.navigate("WorkoutLibrary")}
      />
      <NavCard
        title="Progress"
        caption="Pose ratios and side-by-side check-in"
        onPress={() => navigation.navigate("ProgressCapture")}
      />
      <NavCard
        title="Coach"
        caption="Ask about your logged week"
        onPress={() => navigation.navigate("CoachChat")}
      />
    </Screen>
  );
}
