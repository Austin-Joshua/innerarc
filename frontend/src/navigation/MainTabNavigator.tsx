import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { FitnessTabBar } from "../components/fitness/FitnessTabBar";
import { useBreakpoint } from "../hooks/useBreakpoint";
import HomeScreen from "../screens/HomeScreen";
import CoachChatScreen from "../screens/CoachChatScreen";
import FoodCaptureScreen from "../screens/FoodCaptureScreen";
import FoodEditScreen from "../screens/FoodEditScreen";
import FoodNutritionScreen from "../screens/FoodNutritionScreen";
import FoodResultScreen from "../screens/FoodResultScreen";
import ProgressCaptureScreen from "../screens/ProgressCaptureScreen";
import ProgressCompareScreen from "../screens/ProgressCompareScreen";
import WorkoutDetailScreen from "../screens/WorkoutDetailScreen";
import WorkoutLibraryScreen from "../screens/WorkoutLibraryScreen";
import ProgramDetailScreen from "../screens/ProgramDetailScreen";
import {
  LogMealStackParamList,
  MainTabParamList,
  ProgressStackParamList,
  WorkoutStackParamList,
} from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();
const WorkoutStack = createNativeStackNavigator<WorkoutStackParamList>();
const LogMealStack = createNativeStackNavigator<LogMealStackParamList>();
const ProgressStack = createNativeStackNavigator<ProgressStackParamList>();

function LogMealStackNavigator() {
  return (
    <LogMealStack.Navigator screenOptions={{ headerShown: false }}>
      <LogMealStack.Screen name="FoodCapture" component={FoodCaptureScreen} />
      <LogMealStack.Screen name="FoodResult" component={FoodResultScreen} />
      <LogMealStack.Screen name="FoodEdit" component={FoodEditScreen} />
      <LogMealStack.Screen name="FoodNutrition" component={FoodNutritionScreen} />
    </LogMealStack.Navigator>
  );
}

function ProgressStackNavigator() {
  return (
    <ProgressStack.Navigator screenOptions={{ headerShown: false }}>
      <ProgressStack.Screen name="ProgressCapture" component={ProgressCaptureScreen} />
      <ProgressStack.Screen name="ProgressCompare" component={ProgressCompareScreen} />
    </ProgressStack.Navigator>
  );
}

function WorkoutStackNavigator() {
  return (
    <WorkoutStack.Navigator screenOptions={{ headerShown: false }}>
      <WorkoutStack.Screen name="WorkoutLibrary" component={WorkoutLibraryScreen} />
      <WorkoutStack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} />
      <WorkoutStack.Screen name="ProgramDetail" component={ProgramDetailScreen} />
    </WorkoutStack.Navigator>
  );
}

export function MainTabNavigator() {
  const { isMobile, isTablet, tier } = useBreakpoint();
  const useFitnessTabs = isMobile || isTablet;

  return (
    <Tab.Navigator
      tabBar={
        useFitnessTabs
          ? (props) => (
              <FitnessTabBar
                {...props}
                position={isTablet ? "top" : "bottom"}
                tier={tier}
              />
            )
          : undefined
      }
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        ...(useFitnessTabs ? {} : { tabBarStyle: { display: "none" } }),
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: "Home" }} />
      <Tab.Screen name="LogMeal" component={LogMealStackNavigator} options={{ title: "Log Meal" }} />
      <Tab.Screen name="Workouts" component={WorkoutStackNavigator} options={{ title: "Workouts" }} />
      <Tab.Screen name="Progress" component={ProgressStackNavigator} options={{ title: "Progress" }} />
      <Tab.Screen name="Coach" component={CoachChatScreen} options={{ title: "Coach" }} />
    </Tab.Navigator>
  );
}
