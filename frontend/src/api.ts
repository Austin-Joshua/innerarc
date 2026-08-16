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
  }) => request("/food/logs", { method: "POST", body: JSON.stringify(body) }),
  dashboardToday: () => request<Dashboard>("/dashboard/today"),
};
