import { PropsWithChildren } from "react";
import { Modal, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "../ui";

type TitleBarDropdownProps = PropsWithChildren<{
  open: boolean;
  onClose: () => void;
  align?: "left" | "right";
  width?: number;
}>;

export function TitleBarDropdown({
  open,
  onClose,
  align = "right",
  width = 280,
  children,
}: TitleBarDropdownProps) {
  const insets = useSafeAreaInsets();

  if (!open) return null;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <View className="flex-1">
        <Pressable
          className="absolute inset-0"
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close menu"
        >
          <View className="flex-1 bg-black/20" />
        </Pressable>
        <View
          pointerEvents="box-none"
          className={`absolute ${align === "right" ? "right-md" : "left-md"}`}
          style={{ top: insets.top + 52, width }}
        >
          <Card variant="elevated" className="overflow-hidden p-0 shadow-lg">
            {children}
          </Card>
        </View>
      </View>
    </Modal>
  );
}
