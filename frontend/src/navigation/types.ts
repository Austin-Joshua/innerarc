export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Onboarding: undefined;
  Home: undefined;
  FoodCapture: undefined;
  FoodResult: undefined;
  FoodEdit: undefined;
  FoodNutrition: undefined;
  WorkoutLibrary: undefined;
  WorkoutDetail: { workoutId: string };
  ProgramDetail: { programId: string };
  WorkoutSession: { workoutId: string };
  ProgressCapture: undefined;
  ProgressCompare: undefined;
  CoachChat: undefined;
};
