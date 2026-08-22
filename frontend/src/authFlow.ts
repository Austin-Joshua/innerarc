import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { api, setToken } from "./api";
import { RootStackParamList } from "./navigation/types";
import { storeToken } from "./storage";

export function validateAuthInput(
  email: string,
  password: string,
): string | null {
  const trimmed = email.trim();
  if (!trimmed.includes("@") || !trimmed.includes(".")) {
    return "Enter a valid email address.";
  }
  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  return null;
}

type AuthNavigation = Pick<
  NativeStackNavigationProp<RootStackParamList>,
  "replace"
>;

export async function completeAuthSession(
  navigation: AuthNavigation,
  accessToken: string,
) {
  setToken(accessToken);
  await storeToken(accessToken);
  const user = await api.me();
  navigation.replace(user.profile ? "Main" : "Onboarding");
}

export async function signOut(navigation: AuthNavigation) {
  setToken(null);
  await storeToken(null);
  navigation.replace("Login");
}
