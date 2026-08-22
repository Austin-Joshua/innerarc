import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Pressable, View } from "react-native";

import {
  api,
  CoachNudge,
  Dashboard,
  GamificationState,
  WearableReading,
} from "../api";
import { HomeProgressRings } from "../charts/HomeProgressRings";
import {
  AppText,
  Badge,
  Button,
  Card,
  NavCard,
  Screen,
  SectionHeader,
  StatCard,
} from "../components/ui";
import { healthConnect } from "../healthConnect";
import { RootStackParamList } from "../navigation/types";
import { isAndroid, isWeb } from "../platform";
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
    if (isWeb) {
      setSyncMsg(
        "Wearable sync is available in the Android app. On the web, you can still log meals, follow workouts, and track progress.",
      );
      return;
    }
    if (!isAndroid) {
      setSyncMsg("Wearable sync requires the Android app with Health Connect.");
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
      <AppText variant="display" className="mb-xs">
        Today
      </AppText>
      <AppText variant="caption">
        Intake compared with your daily target
        {data ? ` (${data.target.source})` : ""}.
      </AppText>
      {game ? (
        <AppText variant="caption" className="mb-sm mt-xs">
          {game.streak_count}-day streak · {game.points} points
        </AppText>
      ) : null}
      {error ? (
        <AppText variant="caption" className="text-danger">
          {error}
        </AppText>
      ) : null}

      {nudge ? (
        <Card variant="accent" className="mb-md mt-sm">
          <View className="mb-xs flex-row items-center justify-between">
            <Badge label="Coach note" tone="accent" />
            <Pressable
              onPress={onDismissNudge}
              hitSlop={12}
              accessibilityRole="button"
            >
              <AppText variant="caption" className="font-semibold">
                Dismiss
              </AppText>
            </Pressable>
          </View>
          <AppText variant="body">{nudge.response}</AppText>
        </Card>
      ) : null}

      <Card variant="surface" className="mb-lg mt-sm">
        {data ? (
          <HomeProgressRings
            data={data}
            streakCount={game?.streak_count ?? 0}
          />
        ) : (
          <>
            <AppText variant="numeral" className="mb-xs">
              —
            </AppText>
            <AppText variant="caption">of — kcal</AppText>
          </>
        )}
      </Card>

      <SectionHeader
        title="Wearables"
        caption={`Steps today, latest heart rate, and sleep${
          lastSynced
            ? ` · Last synced ${new Date(lastSynced).toLocaleString()}`
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
          label="Heart rate"
          className="flex-1"
        />
        <StatCard
          value={formatMetric(byType("sleep"), "h")}
          label="Sleep"
          className="flex-1"
        />
      </View>
      {syncMsg ? (
        <AppText variant="caption">{syncMsg}</AppText>
      ) : null}
      <Button
        label="Sync now"
        variant="secondary"
        onPress={onSyncNow}
        disabled={syncBusy}
        busy={syncBusy}
        className="mt-sm"
      />
      <AppText variant="caption" className="mb-sm mt-xxs text-center">
        Manually sync data from Health Connect
      </AppText>
      <NavCard
        title="Profile & settings"
        caption="Edit your goals, body stats, and equipment"
        onPress={() => navigation.navigate("ProfileSettings")}
      />
      <NavCard
        title="Connections"
        caption="Manage Health Connect permissions"
        onPress={() => navigation.navigate("WearableConnect")}
      />

      <Button
        label="Log meal"
        onPress={() => navigation.navigate("FoodCapture")}
        className="mb-sm mt-md"
      />
      <NavCard
        title="Workouts"
        caption="Browse programs and start a session"
        onPress={() => navigation.navigate("WorkoutLibrary")}
      />
      <NavCard
        title="Progress"
        caption="Capture photos and compare check-ins"
        onPress={() => navigation.navigate("ProgressCapture")}
      />
      <NavCard
        title="Coach"
        caption="Ask questions about your recent activity"
        onPress={() => navigation.navigate("CoachChat")}
      />
    </Screen>
  );
}
