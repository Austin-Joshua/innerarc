import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { api, CoachMessage } from "../api";
import { RootStackParamList } from "../navigation/types";
import { colors, spacing, typography } from "../theme";

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
        if (active) setError(err instanceof Error ? err.message : "Could not load chat");
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
    setBubbles((prev) => [...prev, { key: `local-${Date.now()}`, role: "user", text: message }]);
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={88}
    >
      <Text style={styles.title}>Coach</Text>
      <Text style={styles.muted}>
        Answers use your last 7 days of logged meals, workouts, and targets — not generic advice.
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={bubbles}
        keyExtractor={(item) => item.key}
        style={styles.list}
        contentContainerStyle={{ paddingVertical: spacing.sm }}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === "user" ? styles.userBubble : styles.coachBubble]}>
            <Text style={styles.role}>{item.role === "user" ? "You" : "Coach"}</Text>
            <Text style={styles.body}>{item.text}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.muted}>Ask about your logged week to start.</Text>}
      />
      <View style={styles.composer}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Ask your coach…"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          editable={!busy}
          multiline
        />
        <Pressable onPress={send} disabled={busy || !draft.trim()} style={styles.send}>
          <Text style={styles.sendLabel}>{busy ? "…" : "Send"}</Text>
        </Pressable>
      </View>
      <Pressable onPress={() => navigation.navigate("Home")} style={styles.home}>
        <Text style={styles.homeLabel}>Back to Home</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.xl },
  title: { ...typography.title, marginBottom: spacing.xs },
  muted: { ...typography.muted, marginBottom: spacing.sm },
  error: { ...typography.muted, color: "#8B3A3A", marginBottom: spacing.sm },
  list: { flex: 1 },
  bubble: {
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  userBubble: { backgroundColor: colors.accentSoft, borderColor: colors.accent, alignSelf: "flex-end" },
  coachBubble: { backgroundColor: colors.white, borderColor: colors.border, alignSelf: "flex-start" },
  role: { ...typography.muted, marginBottom: 4 },
  body: { ...typography.body },
  composer: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-end", marginTop: spacing.sm },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    color: colors.text,
  },
  send: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
    justifyContent: "center",
  },
  sendLabel: { color: colors.white, fontWeight: "600" },
  home: { marginTop: spacing.sm, alignItems: "center", padding: spacing.sm },
  homeLabel: { ...typography.muted },
});
