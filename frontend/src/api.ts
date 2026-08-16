const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

let token: string | null = null;

export function setToken(value: string | null) {
  token = value;
}

export function getToken() {
  return token;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      detail = body.detail ?? JSON.stringify(body);
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return (await response.json()) as T;
}

export type Profile = {
  height_cm: number;
  weight_kg: number;
  biological_sex: string;
  goal: string;
  activity_level: string;
  equipment_access: string;
};

export type User = {
  id: string;
  email: string;
  profile: Profile | null;
};

export type Ingredient = { name: string; typical_quantity: string };

export type Dish = {
  id: string;
  class_name: string | null;
  name: string;
  cuisine: string;
  nutrition_source: string;
  nutrition_confidence: "high" | "medium" | "low";
  match_coverage_pct: number | null;
  default_serving_g: number;
  nutrition_per_100g: { calories: number; protein: number; carbs: number; fat: number };
  ingredients: Ingredient[];
};

export type ClassifyResult = Dish & { confidence_score: number; image_url: string };

export type Dashboard = {
  date: string;
  target: { calories: number; protein_g: number; carbs_g: number; fat_g: number; source: string };
  logged: { calories: number; protein_g: number; carbs_g: number; fat_g: number };
  remaining: { calories: number; protein_g: number; carbs_g: number; fat_g: number };
  entries: Array<{
    id: string;
    dish_name: string;
    nutrition_source: string;
    serving_size_g: number;
    confidence_score: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
};

export type WorkoutSummary = {
  id: string;
  name: string;
  modality: string;
  level: string;
  goal_tags: string[];
  equipment_needed: string[];
  media_url: string;
  exercise_count: number;
};

export type WorkoutExercise = {
  exercise_id: string;
  name: string;
  description: string;
  media_url: string;
  order_index: number;
  sets: number;
  reps: number | null;
  duration_seconds: number | null;
  rest_seconds: number;
};

export type WorkoutDetail = WorkoutSummary & { exercises: WorkoutExercise[] };

export type ProgramSummary = {
  id: string;
  name: string;
  duration_weeks: number;
  workout_count: number;
};

export type ProgramDetail = ProgramSummary & {
  schedule: Array<{
    week_number: number;
    day_number: number;
    workout: WorkoutSummary;
  }>;
};

export type WorkoutLog = {
  id: string;
  workout_id: string;
  duration_min: number;
  calories_burned_est: number;
  gamification?: GamificationState | null;
};

export type BadgeEarned = { id: string; label: string };

export type GamificationState = {
  streak_count: number;
  points: number;
  badges_earned: string[];
  last_activity_date: string | null;
  new_badges: BadgeEarned[];
};

export type ProgressRatios = {
  waist_to_hip: number;
  shoulder_to_waist: number;
  pixel_widths: Record<string, number>;
};

export type ProgressPhoto = {
  id: string;
  image_url: string;
  taken_at: string;
  mean_visibility: number | null;
  ratios: ProgressRatios;
};

export type ConsistencyMetrics = {
  period_start: string;
  period_end: string;
  workouts_logged: number;
  days_active: number;
};

export type MilestoneStub = {
  code: string | null;
  message: string | null;
  streak_count: number;
};

export type ProgressUploadResult = {
  current: ProgressPhoto;
  previous: ProgressPhoto | null;
  consistency: ConsistencyMetrics;
  milestone: MilestoneStub;
  trend: ProgressPhoto[];
  gamification?: GamificationState | null;
};

export type ProgressTimeline = {
  photos: ProgressPhoto[];
  consistency: ConsistencyMetrics;
  milestone: MilestoneStub;
};

export type CoachChatResult = {
  id: string;
  message: string;
  response: string;
  created_at: string;
  snapshot_summary: {
    data_sufficiency: string;
    food_log_count: number;
    workout_log_count: number;
    has_calorie_target: boolean;
    has_progress_ratios: boolean;
  };
  safety_precheck_blocked: boolean;
};

export type CoachMessage = {
  id: string;
  message: string | null;
  response: string;
  created_at: string;
  safety_precheck_blocked: boolean;
};

function workoutQuery(params?: { modality?: string; level?: string; goal?: string; equipment_access?: string }) {
  const query = new URLSearchParams();
  if (params?.modality) query.set("modality", params.modality);
  if (params?.level) query.set("level", params.level);
  if (params?.goal) query.set("goal", params.goal);
  if (params?.equipment_access) query.set("equipment_access", params.equipment_access);
  const suffix = query.toString();
  return suffix ? `?${suffix}` : "";
}

export const api = {
  register: (email: string, password: string) =>
    request<{ access_token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string) =>
    request<{ access_token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<User>("/auth/me"),
  saveProfile: (profile: Profile) =>
    request<User>("/auth/me/profile", { method: "PUT", body: JSON.stringify(profile) }),
  dishes: () => request<Dish[]>("/food/dishes"),
  classify: async (uri: string) => {
    const form = new FormData();
    if (uri.startsWith("file:")) {
      form.append("file", {
        uri,
        name: "meal.jpg",
        type: "image/jpeg",
      } as unknown as Blob);
    } else {
      const blob = await fetch(uri).then((response) => response.blob());
      form.append("file", blob, "meal.jpg");
    }
    return request<ClassifyResult>("/food/classify", { method: "POST", body: form });
  },
  logMeal: (body: {
    dish_id: string;
    confidence_score: number;
    serving_size_g: number;
    image_url: string;
  }) =>
    request<{ gamification?: GamificationState | null }>("/food/logs", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  dashboardToday: () => request<Dashboard>("/dashboard/today"),
  gamificationStatus: () => request<GamificationState>("/gamification/status"),
  workouts: (params?: { modality?: string; level?: string; goal?: string; equipment_access?: string }) =>
    request<WorkoutSummary[]>(`/workouts${workoutQuery(params)}`),
  recommendWorkouts: (params?: { modality?: string; level?: string; goal?: string }) =>
    request<WorkoutSummary[]>(`/workouts/recommend${workoutQuery(params)}`),
  workout: (id: string) => request<WorkoutDetail>(`/workouts/${id}`),
  programs: () => request<ProgramSummary[]>("/programs"),
  program: (id: string) => request<ProgramDetail>(`/programs/${id}`),
  logWorkout: (body: { workout_id: string; duration_min: number }) =>
    request<WorkoutLog>("/workout/logs", { method: "POST", body: JSON.stringify(body) }),
  uploadProgressPhoto: async (uri: string) => {
    const form = new FormData();
    if (uri.startsWith("file:")) {
      form.append("file", {
        uri,
        name: "progress.jpg",
        type: "image/jpeg",
      } as unknown as Blob);
    } else {
      const blob = await fetch(uri).then((response) => response.blob());
      form.append("file", blob, "progress.jpg");
    }
    return request<ProgressUploadResult>("/progress/photos", { method: "POST", body: form });
  },
  progressPhotos: () => request<ProgressPhoto[]>("/progress/photos"),
  progressTimeline: () => request<ProgressTimeline>("/progress/timeline"),
  progressPhotoImageUri: async (photoId: string) => {
    const headers = new Headers();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const response = await fetch(`${API_URL}/progress/photos/${photoId}/image`, { headers });
    if (!response.ok) {
      throw new Error(response.status === 404 ? "Photo not found" : "Could not load photo");
    }
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    const contentType = response.headers.get("content-type") || "image/jpeg";
    return `data:${contentType};base64,${btoa(binary)}`;
  },
  coachChat: (message: string) =>
    request<CoachChatResult>("/coach/chat", {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
  coachHistory: () => request<CoachMessage[]>("/coach/history"),
};
