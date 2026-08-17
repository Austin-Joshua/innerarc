import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { api } from "../api";
import { colors, spacing, typography } from "../theme";

export default function FeedbackPrompt({ screen }: { screen: string }) {
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "sent" | "skipped">("idle");

  if (status !== "idle") {
    return (
      <Text style={styles.thanks}>
        {status === "sent" ? "Thanks for the feedback." : "Feedback skipped."}
      </Text>
    );
  }

  async function rate(value: number) {
    setStatus("sent");
    try {
      await api.submitFeedback({
        rating: value,
        comment: comment.trim() || undefined,
        screen,
      });
    } catch {
      /* best-effort, non-blocking */
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.prompt}>How did that go?</Text>
      <TextInput
        placeholder="Optional note"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        value={comment}
        onChangeText={setComment}
      />
      <View style={styles.row}>
        {[1, 2, 3, 4, 5].map((value) => (
          <Pressable
            key={value}
            onPress={() => rate(value)}
            style={styles.star}
          >
            <Text style={styles.starLabel}>{value}</Text>
          </Pressable>
        ))}
        <Pressable onPress={() => setStatus("skipped")} style={styles.skip}>
          <Text style={styles.skipLabel}>Skip</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  prompt: { ...typography.muted, fontWeight: "600", marginBottom: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    color: colors.text,
    fontSize: 14,
  },
  row: { flexDirection: "row", alignItems: "center" },
  star: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.xs,
  },
  starLabel: { color: colors.accent, fontWeight: "600" },
  skip: { marginLeft: spacing.xs },
  skipLabel: { ...typography.muted, textDecorationLine: "underline" },
  thanks: { ...typography.muted, marginBottom: spacing.md },
});
