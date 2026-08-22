import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { api, CoachMessage } from "../api";
import { FitnessScreenTitle } from "../components/fitness/FitnessMobileParts";
import { ActionStack } from "../components/layout/ActionStack";
import { DesktopColumns, PageShell } from "../components/layout";
import { AppText, Card, PageTitle, Screen } from "../components/ui";
import {
  isCoachPreview,
  PREVIEW_COACH_BUBBLES,
  previewCoachReply,
} from "../coachPreviewSeed";
import { INTERACTIVE_NAV, INTERACTIVE_PRIMARY } from "../components/ui/interactiveStyles";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { useTheme } from "../ThemeProvider";

type Bubble = {
  key: string;
  role: "user" | "coach";
  text: string;
};

const PROMPTS = [
  "Protein this week?",
  "What to eat today?",
  "On track for my goal?",
  "Best recovery after workouts?",
];

type InsightRow = { label: string; value: string; detail: string };

const FALLBACK_INSIGHTS: InsightRow[] = [
  { label: "Protein", value: "—", detail: "Log meals to see trends" },
  { label: "Calories", value: "—", detail: "Connect your account" },
  { label: "Streak", value: "—", detail: "Activity streak" },
  { label: "Meals", value: "—", detail: "Logged today" },
];

export default function CoachChatScreen() {
  const { colors } = useTheme();
  const { isDesktop, tier } = useBreakpoint();
  const [insights, setInsights] = useState<InsightRow[]>(FALLBACK_INSIGHTS);
  const [bubbles, setBubbles] = useState<Bubble[]>(() =>
    isCoachPreview() ? PREVIEW_COACH_BUBBLES : [],
  );
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(() => {
    if (isCoachPreview()) return () => {};
    let active = true;
    Promise.all([api.dashboardToday(), api.gamificationStatus()])
      .then(([dash, game]) => {
        if (!active || !dash || !game) return;
        const proteinPct =
          dash.target.protein_g > 0
            ? Math.round((dash.logged.protein_g / dash.target.protein_g) * 100)
            : 0;
        const caloriePct =
          dash.target.calories > 0
            ? Math.round((dash.logged.calories / dash.target.calories) * 100)
            : 0;
        setInsights([
          {
            label: "Protein",
            value: `${Math.round(dash.logged.protein_g)} g`,
            detail: `${proteinPct}% of target today`,
          },
          {
            label: "Calories",
            value: `${Math.round(dash.logged.calories)} kcal`,
            detail: `${caloriePct}% of target · ${Math.round(dash.remaining.calories)} left`,
          },
          {
            label: "Streak",
            value: `${game.streak_count} days`,
            detail: `${game.points.toLocaleString()} pts`,
          },
          {
            label: "Meals",
            value: String(dash.entries.length),
            detail: "Logged today",
          },
        ]);
      })
      .catch(() => {
        /* keep fallback insights */
      });
    api
      .coachHistory()
      .then((rows: CoachMessage[]) => {
        if (!active) return;
        const next: Bubble[] = [];
        for (const row of [...rows].reverse()) {
          if (row.message) {
            next.push({ key: `${row.id}-u`, role: "user", text: row.message });
          }
          next.push({ key: `${row.id}-c`, role: "coach", text: row.response });
        }
        setBubbles(next);
      })
      .catch((err) => {
        if (active)
          setError(err instanceof Error ? err.message : "Could not load chat");
      });
    return () => {
      active = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      return loadHistory();
    }, [loadHistory]),
  );

  async function sendMessage(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    setBusy(true);
    setError(null);
    setDraft("");
    setBubbles((prev) => [
      ...prev,
      { key: `local-${Date.now()}`, role: "user", text: message },
    ]);
    try {
      if (isCoachPreview()) {
        const reply = previewCoachReply(message);
        setBubbles((prev) => [
          ...prev,
          { key: `${reply.id}-c`, role: "coach", text: reply.response },
        ]);
        return;
      }
      const reply = await api.coachChat(message);
      setBubbles((prev) => [
        ...prev,
        { key: `${reply.id}-c`, role: "coach", text: reply.response },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Coach unavailable");
    } finally {
      setBusy(false);
    }
  }

  const sidebar = (
    <View className="w-full">
      <PageTitle className={isDesktop ? "mb-md text-left" : "mb-md"}>
        Coach
      </PageTitle>
      <Card variant="elevated" className="mb-md p-md">
        <AppText variant="subhead" className="mb-sm font-bold">
          Your week
        </AppText>
        {insights.map((item) => (
          <View
            key={item.label}
            className="mb-sm flex-row items-center justify-between border-b border-border pb-sm last:mb-0 last:border-0 last:pb-0"
          >
            <View>
              <AppText variant="overline" muted>
                {item.label}
              </AppText>
              <AppText variant="bodyStrong">{item.value}</AppText>
            </View>
            <AppText variant="caption" muted>
              {item.detail}
            </AppText>
          </View>
        ))}
      </Card>
      <AppText variant="overline" muted className="mb-xs">
        Suggested prompts
      </AppText>
      {PROMPTS.map((p) => (
        <Pressable
          key={p}
          onPress={() => sendMessage(p)}
          className={`mb-xs rounded-lg border border-border bg-elevated px-md py-sm ${INTERACTIVE_NAV}`}
        >
          <AppText variant="caption">{p}</AppText>
        </Pressable>
      ))}
    </View>
  );

  const chat = (
    <View className="w-full flex-1">
      {!isDesktop ? null : (
        <AppText variant="subhead" className="mb-md font-bold">
          Conversation
        </AppText>
      )}

      {error ? (
        <AppText variant="caption" className="mb-sm text-danger">
          {error}
        </AppText>
      ) : null}

      {!bubbles.length && !isDesktop ? (
        <View className="mb-md flex-row flex-wrap justify-center gap-xs">
          {PROMPTS.slice(0, 3).map((p) => (
            <Pressable
              key={p}
              onPress={() => sendMessage(p)}
              className={`rounded-full border border-border bg-elevated px-md py-xs ${INTERACTIVE_NAV}`}
            >
              <AppText variant="caption">{p}</AppText>
            </Pressable>
          ))}
        </View>
      ) : null}

      <FlatList
        data={bubbles}
        keyExtractor={(item) => item.key}
        className="flex-1"
        contentContainerClassName="py-sm"
        renderItem={({ item }) => (
          <View
            className={`mb-sm max-w-[92%] ${item.role === "user" ? "self-end" : "self-start"}`}
          >
            <Card
              variant="elevated"
              className={`shadow-sm ${
                item.role === "user"
                  ? "border-accent/40"
                  : "fine-hover:shadow-md"
              }`}
            >
              <AppText variant="overline" muted className="mb-xxs">
                {item.role === "user" ? "You" : "Coach"}
              </AppText>
              <AppText variant="body">{item.text}</AppText>
            </Card>
          </View>
        )}
      />

      <ActionStack align={isDesktop ? "start" : "center"} className="mt-sm pb-md">
        <View className="flex-row items-end gap-xs">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Ask your coach…"
            placeholderTextColor={colors.textMuted}
            className={`min-h-[44px] flex-1 rounded-full border border-border bg-elevated px-md py-sm text-ink ${INTERACTIVE_NAV}`}
            editable={!busy}
            multiline
          />
          <Pressable
            onPress={() => sendMessage(draft)}
            disabled={busy || !draft.trim()}
            accessibilityRole="button"
            accessibilityLabel="Send message"
            className={`h-11 w-11 items-center justify-center rounded-full bg-accent ${INTERACTIVE_PRIMARY} ${
              busy || !draft.trim() ? "opacity-50" : ""
            }`}
          >
            <Ionicons name="arrow-up" size={20} color={colors.white} />
          </Pressable>
        </View>
      </ActionStack>
    </View>
  );

  return (
    <Screen scroll={false}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={88}
      >
        <PageShell className="flex-1" centeredMobile={false}>
          {isDesktop ? (
            <DesktopColumns
              left={sidebar}
              right={chat}
              leftFlex={2}
              rightFlex={3}
              className="flex-1"
            />
          ) : (
            <View className="flex-1">
              <FitnessScreenTitle title="Coach" tier={tier} />
              {chat}
            </View>
          )}
        </PageShell>
      </KeyboardAvoidingView>
    </Screen>
  );
}
