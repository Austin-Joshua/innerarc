import ShellFocusPlaceholder from "./ShellFocusPlaceholder";

export function FoodCapturePlaceholder() {
  return (
    <ShellFocusPlaceholder
      flow="Log meal"
      step="Capture"
      nextRoute="FoodResult"
    />
  );
}

export function FoodResultPlaceholder() {
  return (
    <ShellFocusPlaceholder
      flow="Log meal"
      step="Confirm result"
      nextRoute="FoodEdit"
    />
  );
}

export function FoodEditPlaceholder() {
  return (
    <ShellFocusPlaceholder
      flow="Log meal"
      step="Edit dish"
      nextRoute="FoodNutrition"
    />
  );
}

export function FoodNutritionPlaceholder() {
  return (
    <ShellFocusPlaceholder
      flow="Log meal"
      step="Nutrition summary"
    />
  );
}

export function ProgressCapturePlaceholder() {
  return (
    <ShellFocusPlaceholder
      flow="Progress"
      step="Capture"
      nextRoute="ProgressCompare"
    />
  );
}

export function ProgressComparePlaceholder() {
  return (
    <ShellFocusPlaceholder flow="Progress" step="Compare check-ins" />
  );
}

export function WorkoutSessionPlaceholder() {
  return (
    <ShellFocusPlaceholder
      flow="Workout session"
      step="Active session player"
    />
  );
}
