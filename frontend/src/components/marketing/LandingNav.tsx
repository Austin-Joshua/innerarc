import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { Pressable, View } from "react-native";

import { useBreakpoint } from "../../hooks/useBreakpoint";
import { BRAND } from "../../marketing/landingAssets";
import { useTheme } from "../../ThemeProvider";
import { RootStackParamList } from "../../navigation/types";
import { AppText, Button } from "../ui";

type Nav = NativeStackNavigationProp<RootStackParamList, "Landing">;

/** In-flow top bar — not absolute, so hero content never slides underneath. */
export function LandingNav() {
  const navigation = useNavigation<Nav>();
  const { colors, isDark } = useTheme();
  const { isDesktop } = useBreakpoint();

  const barBg = isDark ? colors.surface : colors.elevated;
  const borderColor = isDark ? "#1F1F1F" : "#E5E7EB";

  return (
    <View
      className="w-full border-b px-lg"
      style={{
        backgroundColor: barBg,
        borderBottomColor: borderColor,
      }}
    >
      <View className="mx-auto w-full max-w-wide flex-row items-center justify-between py-md">
        <AppText variant="wordmark" accent>
          Innerarc
        </AppText>

        {isDesktop ? (
          <View className="flex-row items-center gap-xl">
            <AppText variant="caption" muted>
              Features
            </AppText>
            <AppText variant="caption" muted>
              How it works
            </AppText>
            <Pressable onPress={() => navigation.navigate("Login")}>
              <AppText variant="bodyStrong" style={{ color: colors.accent }}>
                Sign in
              </AppText>
            </Pressable>
            <Button
              label="Get started"
              onPress={() => navigation.navigate("SignUp")}
              className="px-lg"
            />
          </View>
        ) : (
          <Pressable
            onPress={() => navigation.navigate("Login")}
            accessibilityRole="button"
            className="rounded-full border border-border px-md py-xs"
          >
            <AppText variant="caption" className="font-semibold text-accent">
              Sign in
            </AppText>
          </Pressable>
        )}
      </View>
    </View>
  );
}
