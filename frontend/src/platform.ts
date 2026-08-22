import { Platform } from "react-native";

export const isWeb = Platform.OS === "web";
export const isNative = Platform.OS === "ios" || Platform.OS === "android";
export const isAndroid = Platform.OS === "android";
export const isIOS = Platform.OS === "ios";

/** Max content width for the web app shell (matches tailwind `max-w-app`). */
export const WEB_APP_MAX_WIDTH = 560;
