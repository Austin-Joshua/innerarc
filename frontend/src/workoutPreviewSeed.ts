import {
  ProgramDetail,
  ProgramSummary,
  WorkoutDetail,
  WorkoutLog,
  WorkoutSummary,
} from "./api";

export const PREVIEW_WORKOUT_ID = "preview-workout-1";
export const PREVIEW_PROGRAM_ID = "preview-program-1";

const BASE_WORKOUT: WorkoutSummary = {
  id: PREVIEW_WORKOUT_ID,
  name: "Full-body strength",
  modality: "home_gym",
  level: "intermediate",
  goal_tags: ["muscle_gain", "general_fitness"],
  equipment_needed: ["dumbbells", "bench"],
  media_url: "",
  exercise_count: 4,
};

export const PREVIEW_WORKOUT_DETAIL: WorkoutDetail = {
  ...BASE_WORKOUT,
  exercises: [
    {
      exercise_id: "ex-1",
      name: "Goblet squat",
      description: "Hold a dumbbell at chest height, squat to parallel.",
      media_url: "",
      order_index: 0,
      sets: 3,
      reps: 12,
      duration_seconds: null,
      rest_seconds: 60,
    },
    {
      exercise_id: "ex-2",
      name: "Push-up",
      description: "Full range of motion, elbows at 45°.",
      media_url: "",
      order_index: 1,
      sets: 3,
      reps: 10,
      duration_seconds: null,
      rest_seconds: 45,
    },
    {
      exercise_id: "ex-3",
      name: "Dumbbell row",
      description: "Hinge at hips, pull elbow to rib cage.",
      media_url: "",
      order_index: 2,
      sets: 3,
      reps: 12,
      duration_seconds: null,
      rest_seconds: 45,
    },
    {
      exercise_id: "ex-4",
      name: "Plank hold",
      description: "Brace core, neutral spine.",
      media_url: "",
      order_index: 3,
      sets: 2,
      reps: null,
      duration_seconds: 45,
      rest_seconds: 30,
    },
  ],
};

export const PREVIEW_WORKOUTS: WorkoutSummary[] = [
  BASE_WORKOUT,
  {
    ...BASE_WORKOUT,
    id: "preview-workout-2",
    name: "Morning mobility",
    modality: "yoga",
    level: "beginner",
    goal_tags: ["general_fitness"],
    equipment_needed: ["bodyweight"],
    exercise_count: 6,
  },
  {
    ...BASE_WORKOUT,
    id: "preview-workout-3",
    name: "HIIT finisher",
    modality: "aerobics",
    level: "advanced",
    goal_tags: ["fat_loss", "endurance"],
    equipment_needed: ["bodyweight"],
    exercise_count: 5,
  },
  {
    ...BASE_WORKOUT,
    id: "preview-workout-4",
    name: "Upper push",
    modality: "weighted",
    level: "intermediate",
    goal_tags: ["muscle_gain"],
    equipment_needed: ["dumbbells"],
    exercise_count: 5,
  },
  {
    ...BASE_WORKOUT,
    id: "preview-workout-5",
    name: "Core circuit",
    modality: "bodyweight",
    level: "beginner",
    goal_tags: ["general_fitness"],
    equipment_needed: ["bodyweight"],
    exercise_count: 4,
  },
  {
    ...BASE_WORKOUT,
    id: "preview-workout-6",
    name: "Leg day basics",
    modality: "home_gym",
    level: "intermediate",
    goal_tags: ["muscle_gain"],
    equipment_needed: ["dumbbells"],
    exercise_count: 5,
  },
];

export const PREVIEW_RECOMMENDED: WorkoutSummary[] = PREVIEW_WORKOUTS.slice(0, 3);

export const PREVIEW_PROGRAMS: ProgramSummary[] = [
  {
    id: PREVIEW_PROGRAM_ID,
    name: "4-week strength base",
    duration_weeks: 4,
    workout_count: 12,
  },
  {
    id: "preview-program-2",
    name: "Fat loss kickstart",
    duration_weeks: 6,
    workout_count: 18,
  },
  {
    id: "preview-program-3",
    name: "Mobility reset",
    duration_weeks: 3,
    workout_count: 9,
  },
];

export const PREVIEW_PROGRAM_DETAIL: ProgramDetail = {
  ...PREVIEW_PROGRAMS[0],
  schedule: [
    {
      week_number: 1,
      day_number: 1,
      workout: PREVIEW_WORKOUTS[0],
    },
    {
      week_number: 1,
      day_number: 3,
      workout: PREVIEW_WORKOUTS[1],
    },
    {
      week_number: 2,
      day_number: 1,
      workout: PREVIEW_WORKOUTS[0],
    },
    {
      week_number: 2,
      day_number: 3,
      workout: PREVIEW_WORKOUTS[2],
    },
  ],
};

export function isWorkoutPreview() {
  return process.env.EXPO_PUBLIC_WORKOUT_PREVIEW === "1";
}

export function previewWorkoutLog(workoutId: string, durationMin: number): WorkoutLog {
  return {
    id: "preview-workout-log",
    workout_id: workoutId,
    duration_min: durationMin,
    calories_burned_est: Math.round(durationMin * 7.2),
    gamification: {
      streak_count: 5,
      points: 480,
      badges_earned: [],
      last_activity_date: new Date().toISOString(),
      new_badges: [],
    },
  };
}
