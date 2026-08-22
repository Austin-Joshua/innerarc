import { DrawerActions } from "@react-navigation/native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
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
import { isCoachPreview, PREVIEW_COACH_BUBBLES } from "../coachPreviewSeed";
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

const INSIGHTS = [
  { label: "Protein", value: "4 / 7 days", detail: "Logged at lunch" },
  { label: "Workouts", value: "3 sessions", detail: "This week" },
  { label: "Calories", value: "74% of target", detail: "On track today" },
];

export default function CoachChatScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { isDesktop, tier } = useBreakpoint();
  const [bubbles, setBubbles] = useState<Bubble[]>(() =>
    isCoachPreview() ? PREVIEW_COACH_BUBBLES : [],
  );
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(() => {
    if (isCoachPreview()) return () => {};
    let active = true;
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
        {INSIGHTS.map((item) => (
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
              {!isDesktop ? (
                <FitnessScreenTitle
                  title="Coach"
                  tier={tier}
                  onMenu={() => navigation.dispatch(DrawerActions.openDrawer())}
                />
              ) : (
                <PageTitle className="mb-md">Coach</PageTitle>
              )}
              {chat}
            </View>
          )}
        </PageShell>
      </KeyboardAvoidingView>
    </Screen>
  );
}
