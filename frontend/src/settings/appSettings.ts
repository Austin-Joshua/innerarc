import AsyncStorage from "@react-native-async-storage/async-storage";

export type WeightUnit = "kg" | "lb";

export type NotificationPrefs = {
  mealReminders: boolean;
  workoutReminders: boolean;
  coachNudges: boolean;
  progressReminders: boolean;
  weeklySummary: boolean;
};

export type ReminderTimes = {
  breakfast: string;
  lunch: string;
  dinner: string;
  workout: string;
};

export type PersonalPrefs = {
  displayName: string;
  dailyCalorieGoal: string;
  weightUnit: WeightUnit;
};

export type AppSettings = {
  personal: PersonalPrefs;
  notifications: NotificationPrefs;
  reminderTimes: ReminderTimes;
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  personal: {
    displayName: "",
    dailyCalorieGoal: "2200",
    weightUnit: "kg",
  },
  notifications: {
    mealReminders: true,
    workoutReminders: true,
    coachNudges: true,
    progressReminders: false,
    weeklySummary: true,
  },
  reminderTimes: {
    breakfast: "08:00",
    lunch: "12:30",
    dinner: "19:00",
    workout: "17:30",
  },
};

const STORAGE_KEY = "innerarc_app_settings_v1";

export const REMINDER_TIME_OPTIONS = [
  "06:30",
  "07:00",
  "07:30",
  "08:00",
  "08:30",
  "12:00",
  "12:30",
  "13:00",
  "17:00",
  "17:30",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
] as const;

export function formatReminderLabel(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  const h = Number(hStr);
  const m = mStr ?? "00";
  if (Number.isNaN(h)) return time24;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m} ${period}`;
}

function mergeSettings(raw: Partial<AppSettings> | null): AppSettings {
  if (!raw) return DEFAULT_APP_SETTINGS;
  return {
    personal: { ...DEFAULT_APP_SETTINGS.personal, ...raw.personal },
    notifications: { ...DEFAULT_APP_SETTINGS.notifications, ...raw.notifications },
    reminderTimes: { ...DEFAULT_APP_SETTINGS.reminderTimes, ...raw.reminderTimes },
  };
}

export async function loadAppSettings(): Promise<AppSettings> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return DEFAULT_APP_SETTINGS;
    return mergeSettings(JSON.parse(json) as Partial<AppSettings>);
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

export async function saveAppSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
