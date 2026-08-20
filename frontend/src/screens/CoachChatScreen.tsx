import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { api, CoachMessage } from "../api";
import { Screen } from "../components/ui";
import { RootStackParamList } from "../navigation/types";
import { colors } from "../theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "CoachChat">;

type Bubble = {
  key: string;
  role: "user" | "coach";
  text: string;
};

export default function CoachChatScreen() {
  const navigation = useNavigation<Nav>();
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(() => {
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

  async function send() {
    const message = draft.trim();
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

  return (
    <Screen scroll={false}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={88}
      >
        <Text className="mb-xs text-title text-ink">Coach</Text>
        <Text className="mb-sm text-caption text-muted">
          Answers use your last 7 days of logged meals, workouts, and targets —
          not generic advice.
        </Text>
        {error ? (
          <Text className="mb-sm text-caption text-danger">{error}</Text>
        ) : null}
        <FlatList
          data={bubbles}
          keyExtractor={(item) => item.key}
          className="flex-1"
          contentContainerClassName="py-sm"
          renderItem={({ item }) => (
            <View
              className={
                item.role === "user"
                  ? "mb-sm self-end rounded-md border border-accent bg-accent-soft p-md"
                  : "mb-sm self-start rounded-md border border-border bg-white p-md"
              }
            >
              <Text className="mb-xxs text-caption text-muted">
                {item.role === "user" ? "You" : "Coach"}
              </Text>
              <Text className="text-body text-ink">{item.text}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text className="text-caption text-muted">
              Ask about your logged week to start.
            </Text>
          }
        />
        <View className="mt-sm flex-row items-end gap-sm">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Ask your coach…"
            placeholderTextColor={colors.textMuted}
            className="max-h-[120px] min-h-[44px] flex-1 rounded-md border border-border bg-white px-md py-sm text-ink"
            editable={!busy}
            multiline
          />
          <Pressable
            onPress={send}
            disabled={busy || !draft.trim()}
            className={`min-h-[44px] justify-center rounded-md bg-accent px-md py-sm ${
              busy || !draft.trim() ? "opacity-50" : ""
            }`}
          >
            <Text className="font-semibold text-white">
              {busy ? "…" : "Send"}
            </Text>
          </Pressable>
        </View>
        <Pressable
          onPress={() => navigation.navigate("Home")}
          className="mt-sm items-center p-sm"
        >
          <Text className="text-caption text-muted">Back to Home</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </Screen>
  );
}
