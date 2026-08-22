import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { useNotifications } from "../../context/NotificationsContext";
import { useTheme } from "../../ThemeProvider";
import { AppText, Button } from "../ui";
import { INTERACTIVE_NAV } from "../ui/interactiveStyles";
import { TitleBarDropdown } from "./TitleBarDropdown";

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function NotificationBellButton({
  variant = "default",
}: {
  variant?: "default" | "fitness";
}) {
  const { colors } = useTheme();
  const { notifications, unreadCount, markAllRead, markRead } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const visible = notifications.slice(0, 4);
  const iconColor = variant === "fitness" ? colors.accentBright : colors.accent;
  const iconSize = variant === "fitness" ? 24 : 20;
  const panelWidth = variant === "fitness" ? 280 : 228;

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        hitSlop={8}
        className={`relative rounded-md p-xs ${INTERACTIVE_NAV}`}
      >
        <Ionicons name="notifications-outline" size={iconSize} color={iconColor} />
        {unreadCount > 0 ? (
          <View className="absolute -right-0.5 -top-0.5 min-h-[14px] min-w-[14px] items-center justify-center rounded-full bg-danger px-[3px]">
            <AppText variant="overline" className="text-[9px] text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </AppText>
          </View>
        ) : null}
      </Pressable>

      <TitleBarDropdown open={open} onClose={() => setOpen(false)} width={panelWidth}>
        <View className="border-b border-border px-sm py-xs">
          <AppText variant="label">Notifications</AppText>
        </View>
        <ScrollView
          style={{ maxHeight: 168 }}
          className="px-sm py-xs"
          showsVerticalScrollIndicator={false}
        >
          {visible.length === 0 ? (
            <AppText variant="caption" className="py-sm text-center text-muted">
              No notifications
            </AppText>
          ) : (
            visible.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => markRead(item.id)}
                accessibilityRole="button"
                className={`mb-xxs rounded-md px-xs py-xs ${INTERACTIVE_NAV} ${
                  item.read ? "opacity-60" : "bg-accent-soft/50"
                }`}
              >
                <View className="flex-row items-center justify-between gap-xs">
                  <AppText variant="caption" className="flex-1 font-semibold">
                    {item.title}
                  </AppText>
                  {!item.read ? (
                    <View className="h-1.5 w-1.5 rounded-full bg-accent" />
                  ) : null}
                </View>
                <AppText
                  variant="overline"
                  className="mt-xxs text-muted"
                  numberOfLines={2}
                >
                  {item.body}
                </AppText>
                <AppText variant="overline" className="mt-xxs text-muted">
                  {formatTime(item.time)}
                </AppText>
              </Pressable>
            ))
          )}
        </ScrollView>
        {unreadCount > 0 ? (
          <View className="border-t border-border p-xs">
            <Button
              label="Mark all read"
              variant="secondary"
              onPress={markAllRead}
            />
          </View>
        ) : null}
      </TitleBarDropdown>
    </>
  );
}
