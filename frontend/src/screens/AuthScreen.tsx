import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { Text, TextInput } from "react-native";

import { api, setToken } from "../api";
import { Button, Screen } from "../components/ui";
import { RootStackParamList } from "../navigation/types";
import { storeToken } from "../storage";
import { useTheme } from "../ThemeProvider";

type AuthNav = NativeStackNavigationProp<RootStackParamList, "Auth">;

export default function AuthScreen() {
  const navigation = useNavigation<AuthNav>();
  const { colors } = useTheme();
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
    <Screen scroll={false} className="justify-center">
      <Text className="mb-sm text-display font-semibold text-ink">Welcome</Text>
      <Text className="mb-lg text-body text-muted">
        Create an account or sign in to log meals.
      </Text>
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
        placeholderTextColor={colors.textMuted}
        className="mb-sm rounded-md border border-border bg-elevated p-md text-ink"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        secureTextEntry
        placeholder="Password (8+ characters)"
        placeholderTextColor={colors.textMuted}
        className="mb-sm rounded-md border border-border bg-elevated p-md text-ink"
        value={password}
        onChangeText={setPassword}
      />
      {error ? (
        <Text className="mb-sm text-caption text-danger">{error}</Text>
      ) : null}
      <Button
        label={busy ? "Working…" : "Create account"}
        onPress={() => submit("register")}
        disabled={busy}
        busy={busy}
        className="mt-sm"
      />
      <Button
        label="Sign in"
        variant="secondary"
        onPress={() => submit("login")}
        disabled={busy}
        className="mt-sm"
      />
    </Screen>
  );
}
