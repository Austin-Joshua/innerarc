import type { NavigatorScreenParams } from "@react-navigation/native";

export type WorkoutStackParamList = {
  WorkoutLibrary: undefined;
  WorkoutDetail: { workoutId: string };
  ProgramDetail: { programId: string };
};

export type LogMealStackParamList = {
  FoodCapture: undefined;
  FoodResult: undefined;
  FoodEdit: undefined;
  FoodNutrition: undefined;
};

export type ProgressStackParamList = {
  ProgressCapture: undefined;
  ProgressCompare: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  LogMeal: NavigatorScreenParams<LogMealStackParamList> | undefined;
  Workouts: NavigatorScreenParams<WorkoutStackParamList> | undefined;
  Progress: NavigatorScreenParams<ProgressStackParamList> | undefined;
  Coach: undefined;
};

export type MainDrawerParamList = {
  Tabs: NavigatorScreenParams<MainTabParamList>;
  WearableConnect: undefined;
  Profile: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Landing: undefined;
  Login: undefined;
  SignUp: undefined;
  Onboarding: undefined;
  Main: NavigatorScreenParams<MainDrawerParamList> | undefined;
  WorkoutSession: { workoutId: string };
};
