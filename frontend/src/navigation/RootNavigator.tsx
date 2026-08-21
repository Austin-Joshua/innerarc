import { DarkTheme, DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useTheme } from "../ThemeProvider";
import AuthScreen from "../screens/AuthScreen";
import CoachChatScreen from "../screens/CoachChatScreen";
import FoodCaptureScreen from "../screens/FoodCaptureScreen";
import FoodEditScreen from "../screens/FoodEditScreen";
import FoodNutritionScreen from "../screens/FoodNutritionScreen";
import FoodResultScreen from "../screens/FoodResultScreen";
import HomeScreen from "../screens/HomeScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import ProgramDetailScreen from "../screens/ProgramDetailScreen";
import ProgressCaptureScreen from "../screens/ProgressCaptureScreen";
import ProgressCompareScreen from "../screens/ProgressCompareScreen";
import SplashScreen from "../screens/SplashScreen";
import WorkoutDetailScreen from "../screens/WorkoutDetailScreen";
import WorkoutLibraryScreen from "../screens/WorkoutLibraryScreen";
import WearableConnectScreen from "../screens/WearableConnectScreen";
import WorkoutSessionScreen from "../screens/WorkoutSessionScreen";
import { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { colors, isDark } = useTheme();
  const base = isDark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.border,
      primary: colors.accent,
    },
  };

  return (
    <NavigationContainer
      theme={navTheme}
      linking={
        __DEV__
          ? {
              prefixes: [
                "http://localhost:8094",
                "http://localhost:8093",
                "http://localhost:8092",
                "http://localhost:8091",
                "http://localhost:8090",
                "http://localhost:8089",
                "http://localhost:8088",
                "http://localhost:8087",
                "http://localhost:8086",
                "http://localhost:8085",
                "http://localhost:8084",
                "http://localhost:8083",
                "http://localhost:8082",
                "http://localhost:8081",
                "http://127.0.0.1:8094",
                "http://127.0.0.1:8093",
                "http://127.0.0.1:8092",
                "http://127.0.0.1:8091",
                "http://127.0.0.1:8090",
                "http://127.0.0.1:8087",
                "http://127.0.0.1:8086",
                "http://127.0.0.1:8085",
                "http://127.0.0.1:8084",
                "http://127.0.0.1:8083",
                "http://127.0.0.1:8082",
                "http://127.0.0.1:8081",
              ],
              config: {
                screens: {
                  Splash: "",
                  Home: "home",
                  Auth: "auth",
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
                },
              },
            }
          : undefined
      }
    >
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{ title: "Sign in" }}
        />
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ title: "About you" }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="FoodCapture"
          component={FoodCaptureScreen}
          options={{ title: "Log meal" }}
        />
        <Stack.Screen
          name="FoodResult"
          component={FoodResultScreen}
          options={{ title: "Is this right?" }}
        />
        <Stack.Screen
          name="FoodEdit"
          component={FoodEditScreen}
          options={{ title: "Edit dish" }}
        />
        <Stack.Screen
          name="FoodNutrition"
          component={FoodNutritionScreen}
          options={{ title: "Nutrition" }}
        />
        <Stack.Screen
          name="WorkoutLibrary"
          component={WorkoutLibraryScreen}
          options={{ title: "Workouts" }}
        />
        <Stack.Screen
          name="WorkoutDetail"
          component={WorkoutDetailScreen}
          options={{ title: "Workout" }}
        />
        <Stack.Screen
          name="ProgramDetail"
          component={ProgramDetailScreen}
          options={{ title: "Program" }}
        />
        <Stack.Screen
          name="WorkoutSession"
          component={WorkoutSessionScreen}
          options={{ title: "Session" }}
        />
        <Stack.Screen
          name="ProgressCapture"
          component={ProgressCaptureScreen}
          options={{ title: "Progress" }}
        />
        <Stack.Screen
          name="ProgressCompare"
          component={ProgressCompareScreen}
          options={{ title: "Compare" }}
        />
        <Stack.Screen
          name="CoachChat"
          component={CoachChatScreen}
          options={{ title: "Coach" }}
        />
        <Stack.Screen
          name="WearableConnect"
          component={WearableConnectScreen}
          options={{ title: "Health Connect" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
