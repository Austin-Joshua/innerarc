import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import "./src/setDarkModeFlag";
import "./global.css";
import { WebShell } from "./src/components/layout/WebShell";
import { ThemeProvider, useTheme } from "./src/ThemeProvider";
import RootNavigator from "./src/navigation/RootNavigator";

function AppShell() {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <WebShell>
          <AppShell />
        </WebShell>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
