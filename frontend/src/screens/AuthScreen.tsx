import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { api, setToken } from "../api";
import { RootStackParamList } from "../navigation/types";
import { storeToken } from "../storage";
import { colors, spacing, typography } from "../theme";

type AuthNav = NativeStackNavigationProp<RootStackParamList, "Auth">;

export default function AuthScreen() {
  const navigation = useNavigation<AuthNav>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(mode: "login" | "register") {
    setBusy(true);
    setError(null);
    try {
      const result =
        mode === "register"
          ? await api.register(email.trim(), password)
          : await api.login(email.trim(), password);
      setToken(result.access_token);
      await storeToken(result.access_token);
      const user = await api.me();
      navigation.replace(user.profile ? "Home" : "Onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome</Text>
      <Text style={styles.body}>
        Create an account or sign in to log meals.
      </Text>
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        secureTextEntry
        placeholder="Password (8+ characters)"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable
        disabled={busy}
        onPress={() => submit("register")}
        style={styles.button}
      >
        <Text style={styles.buttonLabel}>
          {busy ? "Working…" : "Create account"}
        </Text>
      </Pressable>
      <Pressable
        disabled={busy}
        onPress={() => submit("login")}
        style={styles.secondary}
      >
        <Text style={styles.secondaryLabel}>Sign in</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    justifyContent: "center",
  },
  title: { ...typography.title, marginBottom: spacing.sm },
  body: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    color: colors.text,
  },
  error: { color: colors.text, marginBottom: spacing.sm },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  buttonLabel: { color: colors.white, fontWeight: "600", fontSize: 16 },
  secondary: { paddingVertical: spacing.md, alignItems: "center" },
  secondaryLabel: { color: colors.accent, fontWeight: "600" },
});
