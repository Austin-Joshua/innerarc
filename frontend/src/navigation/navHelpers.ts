import { NavigationProp, ParamListBase } from "@react-navigation/native";

import {
  LogMealStackParamList,
  MainTabParamList,
  ProgressStackParamList,
  RootStackParamList,
  WorkoutStackParamList,
} from "./types";

type NavLike = {
  getParent?: () => NavLike | undefined;
  navigate: NavigationProp<ParamListBase>["navigate"];
};

/** Reach the root stack from nested drawer/tab navigators. */
export function getRootNavigation(
  navigation: NavLike,
): NavigationProp<RootStackParamList> {
  let current: NavLike | undefined = navigation;
  while (current?.getParent) {
    const parent = current.getParent();
    if (!parent) break;
    current = parent;
  }
  return current as NavigationProp<RootStackParamList>;
}

export function goToHome(navigation: NavLike) {
  getRootNavigation(navigation).navigate("Main", {
    screen: "Tabs",
    params: { screen: "Home" },
  });
}

export function navigateDrawer(
  navigation: NavLike,
  screen: "WearableConnect" | "Profile" | "Settings",
) {
  getRootNavigation(navigation).navigate("Main", { screen });
}

export function navigateMainTab(
  navigation: NavLike,
  screen: Exclude<keyof MainTabParamList, "Workouts">,
) {
  getRootNavigation(navigation).navigate("Main", {
    screen: "Tabs",
    params: { screen },
  });
}

export function navigateWorkoutStack(
  navigation: NavLike,
  screen: keyof WorkoutStackParamList,
  params?: WorkoutStackParamList[keyof WorkoutStackParamList],
) {
  getRootNavigation(navigation).navigate("Main", {
    screen: "Tabs",
    params: {
      screen: "Workouts",
      params: { screen, params } as never,
    },
  });
}

export function navigateLogMeal(
  navigation: NavLike,
  screen: keyof LogMealStackParamList = "FoodCapture",
) {
  getRootNavigation(navigation).navigate("Main", {
    screen: "Tabs",
    params: {
      screen: "LogMeal",
      params: { screen },
    },
  });
}

export function navigateProgress(
  navigation: NavLike,
  screen: keyof ProgressStackParamList = "ProgressCapture",
) {
  getRootNavigation(navigation).navigate("Main", {
    screen: "Tabs",
    params: {
      screen: "Progress",
      params: { screen },
    },
  });
}

export function navigateRootFocus(
  navigation: NavLike,
  screen: keyof RootStackParamList,
  params?: object,
) {
  const root = getRootNavigation(navigation);
  const navigate = root.navigate as (name: string, p?: object) => void;
  if (params !== undefined) {
    navigate(screen, params);
  } else {
    navigate(screen);
  }
}
