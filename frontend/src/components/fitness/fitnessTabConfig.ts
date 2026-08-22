import { Ionicons } from "@expo/vector-icons";

import { MainTabParamList } from "../../navigation/types";

export const FITNESS_TAB_LABELS: Record<keyof MainTabParamList, string> = {
  Home: "Summary",
  LogMeal: "Nutrition",
  Workouts: "Workout",
  Progress: "Progress",
  Coach: "Coach",
};

export const FITNESS_TAB_ICONS: Record<
  keyof MainTabParamList,
  { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }
> = {
  Home: { active: "radio-button-on", inactive: "radio-button-off-outline" },
  LogMeal: { active: "restaurant", inactive: "restaurant-outline" },
  Workouts: { active: "barbell", inactive: "barbell-outline" },
  Progress: { active: "camera", inactive: "camera-outline" },
  Coach: { active: "chatbubble-ellipses", inactive: "chatbubble-ellipses-outline" },
};
