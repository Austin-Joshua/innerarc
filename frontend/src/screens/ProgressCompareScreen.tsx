import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { api, ProgressPhoto } from "../api";
import BadgeBanner from "../components/BadgeBanner";
import { getProgressDraft } from "../progressDraft";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, typography } from "../theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "ProgressCompare">;

function RatioTrend({ photos }: { photos: ProgressPhoto[] }) {
  if (!photos.length) {
    return (
      <Text style={styles.muted}>
        Trend appears after your first successful check-in.
      </Text>
    );
  }
  const wh = photos.map((p) => p.ratios.waist_to_hip);
  const sw = photos.map((p) => p.ratios.shoulder_to_waist);
  const max = Math.max(...wh, ...sw, 0.01);
  const min = Math.min(...wh, ...sw);
  const span = Math.max(max - min, 0.05);

  return (
    <View>
      <Text style={styles.sectionLabel}>Ratio trend (pose estimates)</Text>
      <View style={styles.chart}>
        {photos.map((photo, index) => {
          const whH = ((photo.ratios.waist_to_hip - min) / span) * 72 + 8;
          const swH = ((photo.ratios.shoulder_to_waist - min) / span) * 72 + 8;
          return (
            <View key={photo.id} style={styles.barCol}>
              <View style={styles.barPair}>
                <View style={[styles.bar, styles.barWh, { height: whH }]} />
                <View style={[styles.bar, styles.barSw, { height: swH }]} />
              </View>
              <Text style={styles.barLabel}>{index + 1}</Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.muted}>
        Teal: waist-to-hip · Dark: shoulder-to-waist
      </Text>
    </View>
  );
}

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
      <View style={styles.container}>
        <Text style={styles.muted}>
          No progress result yet. Capture a photo first.
        </Text>
        <Pressable
          style={styles.button}
          onPress={() => navigation.navigate("ProgressCapture")}
        >
          <Text style={styles.buttonLabel}>Capture</Text>
        </Pressable>
      </View>
    );
  }

  const { current, previous, consistency, milestone, trend } = draft;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: spacing.xl }}
    >
      <Text style={styles.title}>{previous ? "Compare" : "Baseline"}</Text>
      <BadgeBanner badges={draft.gamification?.new_badges ?? []} />
      <Text style={styles.muted}>
        Relative pose ratios only — not body-fat percentage or a clinical
        measure.
      </Text>
      {milestone.streak_count > 0 ? (
        <Text style={styles.muted}>
          Current streak: {milestone.streak_count} days
        </Text>
      ) : null}

      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.sectionLabel}>
            {previous ? "Previous" : "Previous"}
          </Text>
          {previous && prevUri ? (
            <Image
              source={{ uri: prevUri }}
              style={styles.photo}
              accessibilityLabel="Previous progress photo"
            />
          ) : (
            <View style={[styles.photo, styles.placeholder]}>
              <Text style={styles.muted}>
                {previous
                  ? "Loading…"
                  : "Baseline — next photo unlocks compare"}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.half}>
          <Text style={styles.sectionLabel}>Current</Text>
          {currUri ? (
            <Image
              source={{ uri: currUri }}
              style={styles.photo}
              accessibilityLabel="Current progress photo"
            />
          ) : (
            <View style={[styles.photo, styles.placeholder]}>
              <Text style={styles.muted}>Loading…</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Current ratios</Text>
        <Text style={styles.ratioLine}>
          Waist-to-hip{" "}
          <Text style={styles.numeral}>
            {current.ratios.waist_to_hip.toFixed(3)}
          </Text>
        </Text>
        <Text style={styles.ratioLine}>
          Shoulder-to-waist{" "}
          <Text style={styles.numeral}>
            {current.ratios.shoulder_to_waist.toFixed(3)}
          </Text>
        </Text>
        {current.mean_visibility != null ? (
          <Text style={styles.muted}>
            Landmark confidence {Math.round(current.mean_visibility * 100)}%
          </Text>
        ) : null}
      </View>

      <RatioTrend photos={trend} />

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Consistency (same period)</Text>
        <Text style={styles.ratioLine}>
          Workouts logged{" "}
          <Text style={styles.numeral}>{consistency.workouts_logged}</Text>
        </Text>
        <Text style={styles.ratioLine}>
          Days active{" "}
          <Text style={styles.numeral}>{consistency.days_active}</Text>
        </Text>
        <Text style={styles.muted}>
          Visual change is never the only signal — meals and sessions count too.
        </Text>
      </View>

      {milestone.message ? (
        <View style={styles.milestone}>
          <Text style={styles.sectionLabel}>Milestone</Text>
          <Text style={styles.body}>{milestone.message}</Text>
          <Text style={styles.muted}>
            Streak data (when available): {milestone.streak_count}
          </Text>
        </View>
      ) : null}

      <Pressable
        style={styles.button}
        onPress={() => navigation.navigate("Home")}
      >
        <Text style={styles.buttonLabel}>Back to Home</Text>
      </Pressable>
      <Pressable
        style={styles.secondary}
        onPress={() => navigation.navigate("ProgressCapture")}
      >
        <Text style={styles.secondaryLabel}>New check-in</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  title: { ...typography.title, marginBottom: spacing.xs },
  muted: { ...typography.muted },
  body: { ...typography.body, marginTop: spacing.xs },
  sectionLabel: {
    ...typography.muted,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  row: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  half: { flex: 1 },
  photo: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.sm,
  },
  card: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ratioLine: { ...typography.body, marginBottom: 4 },
  numeral: { fontWeight: "700", color: colors.text },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 100,
    gap: 8,
    marginVertical: spacing.sm,
  },
  barCol: { alignItems: "center", flex: 1 },
  barPair: { flexDirection: "row", alignItems: "flex-end", gap: 3, height: 88 },
  bar: { width: 10, borderRadius: 4 },
  barWh: { backgroundColor: colors.accent },
  barSw: { backgroundColor: colors.text },
  barLabel: { ...typography.muted, fontSize: 12, marginTop: 4 },
  milestone: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  buttonLabel: { color: colors.white, fontWeight: "600", fontSize: 16 },
  secondary: {
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryLabel: { color: colors.text, fontWeight: "600", fontSize: 16 },
});
