import { ClassifyResult, Dish, GamificationState } from "./api";
import { getFoodDraft, setFoodDraft } from "./foodDraft";

export const PREVIEW_DISH: Dish = {
  id: "preview-pizza",
  class_name: "pizza",
  name: "Margherita pizza",
  cuisine: "italian",
  nutrition_source: "usda",
  nutrition_confidence: "high",
  match_coverage_pct: 92,
  default_serving_g: 220,
  nutrition_per_100g: {
    calories: 266,
    protein: 11,
    carbs: 33,
    fat: 10,
  },
  ingredients: [
    { name: "Mozzarella", typical_quantity: "80 g" },
    { name: "Tomato sauce", typical_quantity: "60 g" },
    { name: "Basil", typical_quantity: "5 g" },
  ],
};

export const PREVIEW_DISHES: Dish[] = [
  PREVIEW_DISH,
  {
    ...PREVIEW_DISH,
    id: "preview-gulab",
    class_name: "gulab_jamun",
    name: "Gulab jamun",
    cuisine: "indian",
    nutrition_source: "ifct_2017",
    nutrition_confidence: "low",
    default_serving_g: 120,
    nutrition_per_100g: {
      calories: 387,
      protein: 5,
      carbs: 58,
      fat: 15,
    },
  },
  {
    ...PREVIEW_DISH,
    id: "preview-dal",
    name: "Dal tadka",
    cuisine: "indian",
    nutrition_source: "ifct_2017",
    nutrition_confidence: "medium",
    default_serving_g: 180,
    nutrition_per_100g: {
      calories: 104,
      protein: 7,
      carbs: 16,
      fat: 2,
    },
  },
  {
    ...PREVIEW_DISH,
    id: "preview-idli",
    name: "Idli",
    cuisine: "indian",
    nutrition_source: "ifct_2017",
    nutrition_confidence: "high",
    default_serving_g: 150,
    nutrition_per_100g: {
      calories: 156,
      protein: 4,
      carbs: 32,
      fat: 1,
    },
  },
  {
    ...PREVIEW_DISH,
    id: "preview-salad",
    name: "Garden salad",
    cuisine: "western",
    nutrition_source: "usda",
    nutrition_confidence: "high",
    default_serving_g: 200,
    nutrition_per_100g: {
      calories: 45,
      protein: 2,
      carbs: 8,
      fat: 1,
    },
  },
  {
    ...PREVIEW_DISH,
    id: "preview-curry",
    name: "Chicken curry",
    cuisine: "indian",
    nutrition_source: "ifct_2017",
    nutrition_confidence: "medium",
    default_serving_g: 250,
    nutrition_per_100g: {
      calories: 180,
      protein: 14,
      carbs: 6,
      fat: 11,
    },
  },
];

export function isFoodPreview() {
  return process.env.EXPO_PUBLIC_FOOD_PREVIEW === "1";
}

/** In-memory draft for layout screenshots — no API calls. */
export function seedFoodPreviewDraft() {
  if (!isFoodPreview() || getFoodDraft()) return;
  setFoodDraft({
    mode: "single",
    dish: PREVIEW_DISH,
    confidence_score: 0.87,
    image_url: "",
    local_uri: "",
  });
}

export function previewClassifyResult(_localUri: string): ClassifyResult {
  return {
    ...PREVIEW_DISH,
    confidence_score: 0.87,
    image_url: "/preview/meal.jpg",
  };
}

export function previewLogMealGamification(): GamificationState {
  return {
    streak_count: 5,
    points: 420,
    badges_earned: [],
    last_activity_date: new Date().toISOString(),
    new_badges: [],
  };
}
