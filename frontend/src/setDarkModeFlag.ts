import { StyleSheet } from "react-native";

const setFlag = (
  StyleSheet as typeof StyleSheet & {
    setFlag?: (key: string, value: string) => void;
  }
).setFlag;
if (typeof setFlag === "function") {
  try {
    setFlag("darkMode", "class");
  } catch {
    /* web NativeWind may already be in class mode */
  }
}
