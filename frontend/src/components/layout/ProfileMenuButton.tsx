import { Ionicons } from "@expo/vector-icons";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { Pressable } from "react-native";

import { useTheme } from "../../ThemeProvider";
import { MainDrawerParamList } from "../../navigation/types";
import { INTERACTIVE_NAV } from "../ui/interactiveStyles";
import { AppText } from "../ui/AppText";
import { TitleBarDropdown } from "./TitleBarDropdown";

type Nav = DrawerNavigationProp<MainDrawerParamList>;

type MenuItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  screen: "Profile" | "Settings";
};

const ITEMS: MenuItem[] = [
  { label: "My profile", icon: "person-outline", screen: "Profile" },
  { label: "Settings", icon: "settings-outline", screen: "Settings" },
];

export function ProfileMenuButton() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  const onSelect = (screen: MenuItem["screen"]) => {
    setOpen(false);
    navigation.navigate(screen);
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Profile menu"
        hitSlop={12}
        className="rounded-full border border-border bg-surface p-xs active:bg-accent-soft"
      >
        <Ionicons
          name="person-circle-outline"
          size={28}
          color={colors.accent}
        />
      </Pressable>

      <TitleBarDropdown open={open} onClose={() => setOpen(false)} width={240}>
        {ITEMS.map((item, index) => (
          <Pressable
            key={item.screen}
            onPress={() => onSelect(item.screen)}
            accessibilityRole="button"
            className={`flex-row items-center px-md py-sm ${INTERACTIVE_NAV} ${
              index < ITEMS.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <Ionicons name={item.icon} size={20} color={colors.accent} />
            <AppText variant="body" className="ml-sm">
              {item.label}
            </AppText>
          </Pressable>
        ))}
      </TitleBarDropdown>
    </>
  );
}
