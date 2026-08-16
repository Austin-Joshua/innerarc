import { ClassifyResult, Dish } from "./api";

export type FoodDraft = {
  dish: Dish;
  confidence_score: number;
  image_url: string;
  local_uri: string;
};

let draft: FoodDraft | null = null;

export function setFoodDraft(value: FoodDraft | null) {
  draft = value;
}

export function getFoodDraft() {
  return draft;
}
