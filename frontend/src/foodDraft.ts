import { ClassifyResult, Dish, PlateItem } from "./api";

export type FoodDraftSingle = {
  mode: "single";
  dish: Dish;
  confidence_score: number;
  image_url: string;
  local_uri: string;
};

export type FoodDraftMulti = {
  mode: "multi";
  items: PlateItem[];
  editingItemIndex: number | null;
  image_url: string;
  local_uri: string;
};

export type FoodDraft = FoodDraftSingle | FoodDraftMulti;

let draft: FoodDraft | null = null;

export function setFoodDraft(value: FoodDraft | null) {
  draft = value;
}

export function getFoodDraft() {
  return draft;
}

export function singleFromClassify(classified: ClassifyResult, localUri: string): FoodDraftSingle {
  return {
    mode: "single",
    dish: classified,
    confidence_score: classified.confidence_score,
    image_url: classified.image_url,
    local_uri: localUri,
  };
}
