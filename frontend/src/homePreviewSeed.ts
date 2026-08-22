import { Dashboard, GamificationState } from "./api";

export function isHomePreview() {
  return process.env.EXPO_PUBLIC_SHELL_PREVIEW === "1";
}

export const PREVIEW_DASHBOARD: Dashboard = {
  date: new Date().toISOString().slice(0, 10),
  target: {
    calories: 2200,
    protein_g: 150,
    carbs_g: 220,
    fat_g: 70,
    source: "profile targets",
  },
  logged: {
    calories: 1640,
    protein_g: 118,
    carbs_g: 165,
    fat_g: 52,
  },
  remaining: {
    calories: 560,
    protein_g: 32,
    carbs_g: 55,
    fat_g: 18,
  },
  entries: [
    {
      id: "meal-1",
      dish_name: "Greek yogurt bowl",
      nutrition_source: "recipe",
      serving_size_g: 320,
      confidence_score: 0.92,
      calories: 420,
      protein: 28,
      carbs: 45,
      fat: 12,
    },
    {
      id: "meal-2",
      dish_name: "Grilled chicken salad",
      nutrition_source: "recipe",
      serving_size_g: 410,
      confidence_score: 0.88,
      calories: 520,
      protein: 42,
      carbs: 28,
      fat: 18,
    },
    {
      id: "meal-3",
      dish_name: "Overnight oats",
      nutrition_source: "recipe",
      serving_size_g: 280,
      confidence_score: 0.95,
      calories: 380,
      protein: 14,
      carbs: 58,
      fat: 9,
    },
    {
      id: "meal-4",
      dish_name: "Protein shake",
      nutrition_source: "manual",
      serving_size_g: 350,
      confidence_score: 1,
      calories: 320,
      protein: 34,
      carbs: 34,
      fat: 13,
    },
  ],
};

export const PREVIEW_GAMIFICATION: GamificationState = {
  streak_count: 5,
  points: 1240,
  badges_earned: ["streak_5", "first_meal", "week_warrior"],
  last_activity_date: new Date().toISOString().slice(0, 10),
  new_badges: [],
};

export type RecentActivityItem = {
  id: string;
  icon: "restaurant" | "barbell" | "camera" | "walk" | "moon";
  title: string;
  stat: string;
  time: string;
};

export const PREVIEW_RECENT_ACTIVITY: RecentActivityItem[] = [
  {
    id: "a1",
    icon: "barbell",
    title: "Full-body strength",
    stat: "42 min · 380 kcal",
    time: "Today",
  },
  {
    id: "a2",
    icon: "restaurant",
    title: "Chicken salad",
    stat: "520 kcal · 42 g protein",
    time: "Today",
  },
  {
    id: "a3",
    icon: "walk",
    title: "Walk",
    stat: "8,420 steps",
    time: "Today",
  },
  {
    id: "a4",
    icon: "moon",
    title: "Sleep",
    stat: "7.2 h",
    time: "Last night",
  },
  {
    id: "a5",
    icon: "camera",
    title: "Progress photo",
    stat: "Check-in saved",
    time: "Yesterday",
  },
];

export function mergeDashboardPreview(data: Dashboard | null): Dashboard {
  if (data && data.logged.calories > 0) return data;
  return PREVIEW_DASHBOARD;
}

export function mergeGamificationPreview(
  game: GamificationState | null,
): GamificationState {
  if (game && game.streak_count > 0) return game;
  return PREVIEW_GAMIFICATION;
}
