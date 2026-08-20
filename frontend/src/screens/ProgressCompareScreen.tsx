import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { Image, Text, View } from "react-native";

import { api } from "../api";
import { RatioTrendChart } from "../charts/RatioTrendChart";
import BadgeBanner from "../components/BadgeBanner";
import { Button, Card, Screen } from "../components/ui";
import { getProgressDraft } from "../progressDraft";
import { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList, "ProgressCompare">;

const photoStyle = { width: "100%" as const, height: 180 };

export default function ProgressCompareScreen() {
  const navigation = useNavigation<Nav>();
  const draft = getProgressDraft();
  const [prevUri, setPrevUri] = useState<string | null>(null);
  const [currUri, setCurrUri] = useState<string | null>(
    draft?.local_uri ?? null,
  );

  useEffect(() => {
    let active = true;
    async function load() {
      if (!draft) return;
      if (draft.previous) {
        try {
          const uri = await api.progressPhotoImageUri(draft.previous.id);
          if (active) setPrevUri(uri);
        } catch {
          if (active) setPrevUri(null);
        }
      }
      if (!draft.local_uri) {
        try {
          const uri = await api.progressPhotoImageUri(draft.current.id);
          if (active) setCurrUri(uri);
        } catch {
          if (active) setCurrUri(null);
        }
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [draft]);

  if (!draft) {
    return (
      <Screen>
        <Text className="text-caption text-muted">
          No progress result yet. Capture a photo first.
        </Text>
        <Button
          label="Capture"
          className="mt-lg"
          onPress={() => navigation.navigate("ProgressCapture")}
        />
      </Screen>
    );
  }

  const { current, previous, consistency, milestone, trend } = draft;

  return (
    <Screen>
      <Text className="mb-xs text-title text-ink">
        {previous ? "Compare" : "Baseline"}
      </Text>
      <BadgeBanner badges={draft.gamification?.new_badges ?? []} />
      <Text className="text-caption text-muted">
        Relative pose ratios only — not body-fat percentage or a clinical
        measure.
      </Text>
      {milestone.streak_count > 0 ? (
        <Text className="mt-xs text-caption text-muted">
          Current streak: {milestone.streak_count} days
        </Text>
      ) : null}

      <View className="mt-md flex-row gap-sm">
        <View className="flex-1">
          <Text className="mb-xs mt-sm text-caption text-muted">Previous</Text>
          {previous && prevUri ? (
            <Image
              source={{ uri: prevUri }}
              style={photoStyle}
              className="rounded-md border border-border bg-surface"
              accessibilityLabel="Previous progress photo"
            />
          ) : (
            <View
              style={photoStyle}
              className="items-center justify-center rounded-md border border-border bg-surface p-sm"
            >
              <Text className="text-center text-caption text-muted">
                {previous
                  ? "Loading…"
                  : "Baseline — next photo unlocks compare"}
              </Text>
            </View>
          )}
        </View>
        <View className="flex-1">
          <Text className="mb-xs mt-sm text-caption text-muted">Current</Text>
          {currUri ? (
            <Image
              source={{ uri: currUri }}
              style={photoStyle}
              className="rounded-md border border-border bg-surface"
              accessibilityLabel="Current progress photo"
            />
          ) : (
            <View
              style={photoStyle}
              className="items-center justify-center rounded-md border border-border bg-surface p-sm"
            >
              <Text className="text-caption text-muted">Loading…</Text>
            </View>
          )}
        </View>
      </View>

      <Card className="mt-lg">
        <Text className="mb-xs text-caption text-muted">Current ratios</Text>
        <Text className="mb-xxs text-body text-ink">
          Waist-to-hip{" "}
          <Text className="font-bold text-ink">
            {current.ratios.waist_to_hip.toFixed(3)}
          </Text>
        </Text>
        <Text className="mb-xxs text-body text-ink">
          Shoulder-to-waist{" "}
          <Text className="font-bold text-ink">
            {current.ratios.shoulder_to_waist.toFixed(3)}
          </Text>
        </Text>
        {current.mean_visibility != null ? (
          <Text className="text-caption text-muted">
            Landmark confidence {Math.round(current.mean_visibility * 100)}%
          </Text>
        ) : null}
      </Card>

      <RatioTrendChart photos={trend} />

      <Card className="mt-lg">
        <Text className="mb-xs text-caption text-muted">
          Consistency (same period)
        </Text>
        <Text className="mb-xxs text-body text-ink">
          Workouts logged{" "}
          <Text className="font-bold text-ink">
            {consistency.workouts_logged}
          </Text>
        </Text>
        <Text className="mb-xxs text-body text-ink">
          Days active{" "}
          <Text className="font-bold text-ink">{consistency.days_active}</Text>
        </Text>
        <Text className="text-caption text-muted">
          Visual change is never the only signal — meals and sessions count too.
        </Text>
      </Card>

      {milestone.message ? (
        <Card className="mt-lg border-accent bg-accent-soft">
          <Text className="mb-xs text-caption text-muted">Milestone</Text>
          <Text className="mt-xs text-body text-ink">{milestone.message}</Text>
          <Text className="mt-xs text-caption text-muted">
            Streak data (when available): {milestone.streak_count}
          </Text>
        </Card>
      ) : null}

      <Button
        label="Back to Home"
        className="mt-lg"
        onPress={() => navigation.navigate("Home")}
      />
      <Button
        label="New check-in"
        variant="secondary"
        className="mt-sm"
        onPress={() => navigation.navigate("ProgressCapture")}
      />
    </Screen>
  );
}
