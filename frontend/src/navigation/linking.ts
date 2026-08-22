import { LinkingOptions } from "@react-navigation/native";
import { Platform } from "react-native";

import { RootStackParamList } from "./types";

const screens: LinkingOptions<RootStackParamList>["config"] = {
  screens: {
    Splash: "",
    Home: "home",
    Login: "login",
    SignUp: "signup",
    Onboarding: "onboarding",
    FoodCapture: "food-capture",
    FoodResult: "food-result",
    FoodEdit: "food-edit",
    FoodNutrition: "food-nutrition",
    WorkoutLibrary: "workouts",
    WorkoutDetail: "workout/:workoutId",
    ProgramDetail: "program/:programId",
    WorkoutSession: "session/:workoutId",
    ProgressCapture: "progress",
    ProgressCompare: "compare",
    CoachChat: "coach",
    WearableConnect: "connections",
    ProfileSettings: "settings",
  },
};

export function getLinkingPrefixes(): string[] {
  const prefixes = new Set<string>(["innerarc://"]);

  if (Platform.OS === "web" && typeof window !== "undefined") {
    prefixes.add(window.location.origin);
  }

  const siteUrl = process.env.EXPO_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (siteUrl) {
    prefixes.add(siteUrl);
  }

  if (__DEV__) {
    for (let port = 8081; port <= 8095; port++) {
      prefixes.add(`http://localhost:${port}`);
      prefixes.add(`http://127.0.0.1:${port}`);
    }
  }

  return [...prefixes];
}

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: getLinkingPrefixes(),
  config: screens,
};
