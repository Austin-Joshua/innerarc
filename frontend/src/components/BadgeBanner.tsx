import { StyleSheet, Text, View } from "react-native";

import { BadgeEarned } from "../api";
import { colors, spacing, typography } from "../theme";

export default function BadgeBanner({ badges }: { badges: BadgeEarned[] }) {
  if (!badges.length) return null;
  return (
    <View style={styles.wrap}>
      {badges.map((badge) => (
        <Text key={badge.id} style={styles.text}>
          Badge: {badge.label}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  text: { ...typography.body, fontWeight: "600", color: colors.accent },
});
