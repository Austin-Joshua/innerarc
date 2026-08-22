import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Appearance, ColorSchemeName, useColorScheme, View } from "react-native";

import {
  darkColors,
  getElevation,
  getTypography,
  lightColors,
  ThemeColors,
  ThemePreference,
} from "./theme";

const STORAGE_KEY = "innerarc.theme_preference";

type ThemeContextValue = {
  colors: ThemeColors;
  typography: ReturnType<typeof getTypography>;
  elevation: ReturnType<typeof getElevation>;
  isDark: boolean;
  preference: ThemePreference;
  setPreference: (next: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveIsDark(
  preference: ThemePreference,
  system: ColorSchemeName,
) {
  if (preference === "light") return false;
  if (preference === "dark") return true;
  return system === "dark";
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const rnScheme = useColorScheme();
  const [webScheme, setWebScheme] = useState<ColorSchemeName | null>(null);
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!active) return;
        if (stored === "light" || stored === "dark" || stored === "system") {
          setPreferenceState(stored);
        }
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const sub = Appearance.addChangeListener(() => {
      /* useColorScheme updates on native */
    });
    return () => sub.remove();
  }, []);

  // Web: track prefers-color-scheme so preference:system follows OS Appearance.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => setWebScheme(mq.matches ? "dark" : "light");
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  const systemScheme = webScheme ?? rnScheme;
  const isDark = resolveIsDark(preference, systemScheme);
  const colors = isDark ? darkColors : lightColors;

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors,
      typography: getTypography(colors),
      elevation: getElevation(colors),
      isDark,
      preference,
      setPreference,
    }),
    [colors, isDark, preference, setPreference],
  );

  if (!ready) {
    return <View className="flex-1 bg-background" />;
  }

  return (
    <ThemeContext.Provider value={value}>
      <View className={`flex-1 bg-background ${isDark ? "dark" : ""}`.trim()}>
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
