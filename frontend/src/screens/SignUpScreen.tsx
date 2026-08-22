import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { Pressable, Text } from "react-native";

import { api, apiErrorMessage } from "../api";
import { completeAuthSession, validateAuthInput } from "../authFlow";
import { AuthShell } from "../components/auth/AuthShell";
import { AppText, Button, TextField } from "../components/ui";
import { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList, "SignUp">;

export default function SignUpScreen() {
  const navigation = useNavigation<Nav>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function createAccount() {
    setBusy(true);
    setError(null);
    const validation = validateAuthInput(email, password);
    if (validation) {
      setError(validation);
      setBusy(false);
      return;
    }
    try {
      const result = await api.register(email.trim(), password);
      await completeAuthSession(navigation, result.access_token);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join Innerarc to log meals, follow workouts, and see your progress over time."
      footer={
        <Pressable
          onPress={() => navigation.navigate("Login")}
          accessibilityRole="button"
        >
          <Text className="text-center text-body text-ink">
            Already have an account?{" "}
            <Text className="font-semibold text-accent">Sign in</Text>
          </Text>
        </Pressable>
      }
    >
      <TextField
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
      />
      <TextField
        label="Password"
        secureTextEntry
        autoComplete="new-password"
        placeholder="At least 8 characters"
        value={password}
        onChangeText={setPassword}
      />
      {error ? (
        <AppText variant="caption" className="mb-sm text-danger">
          {error}
        </AppText>
      ) : null}
      <Button
        label={busy ? "Creating account…" : "Create account"}
        onPress={createAccount}
        disabled={busy}
        busy={busy}
        className="mt-sm"
      />
    </AuthShell>
  );
}
