import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

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
import { colors } from "../theme";
import { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.background,
    text: colors.text,
    border: colors.border,
    primary: colors.accent,
  },
};

export default function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Auth" component={AuthScreen} options={{ title: "Sign in" }} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ title: "About you" }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: "Innerarc" }} />
        <Stack.Screen name="FoodCapture" component={FoodCaptureScreen} options={{ title: "Log meal" }} />
        <Stack.Screen name="FoodResult" component={FoodResultScreen} options={{ title: "Is this right?" }} />
        <Stack.Screen name="FoodEdit" component={FoodEditScreen} options={{ title: "Edit dish" }} />
        <Stack.Screen name="FoodNutrition" component={FoodNutritionScreen} options={{ title: "Nutrition" }} />
        <Stack.Screen name="WorkoutLibrary" component={WorkoutLibraryScreen} options={{ title: "Workouts" }} />
        <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} options={{ title: "Workout" }} />
        <Stack.Screen name="ProgramDetail" component={ProgramDetailScreen} options={{ title: "Program" }} />
        <Stack.Screen name="WorkoutSession" component={WorkoutSessionScreen} options={{ title: "Session" }} />
        <Stack.Screen name="ProgressCapture" component={ProgressCaptureScreen} options={{ title: "Progress" }} />
        <Stack.Screen name="ProgressCompare" component={ProgressCompareScreen} options={{ title: "Compare" }} />
        <Stack.Screen name="CoachChat" component={CoachChatScreen} options={{ title: "Coach" }} />
        <Stack.Screen
          name="WearableConnect"
          component={WearableConnectScreen}
          options={{ title: "Health Connect" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
