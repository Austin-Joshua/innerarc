import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { AppText, Card } from "../components/ui";
import { ResponsiveGrid } from "../components/layout";
import { INTERACTIVE_CARD_PRESSABLE } from "../components/ui/interactiveStyles";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { useTheme } from "../ThemeProvider";
import { RecentActivityItem } from "../homePreviewSeed";
import { activityReport, HomeReport } from "./homeReports";

const ICONS: Record<
  RecentActivityItem["icon"],
  keyof typeof Ionicons.glyphMap
> = {
  restaurant: "restaurant-outline",
  barbell: "barbell-outline",
  camera: "camera-outline",
  walk: "footsteps-outline",
  moon: "moon-outline",
};

type Props = {
  items: RecentActivityItem[];
  onShowMore?: () => void;
  onReport?: (report: HomeReport) => void;
};

function ActivityCard({ item }: { item: RecentActivityItem }) {
  const { colors } = useTheme();

  return (
    <Card interactive variant="elevated" className="h-full p-md">
      <View
        className="mb-sm self-start rounded-md p-sm"
        style={{ backgroundColor: `${colors.accent}18` }}
      >
        <Ionicons name={ICONS[item.icon]} size={22} color={colors.accent} />
      </View>
      <AppText variant="bodyStrong" numberOfLines={1}>
        {item.title}
      </AppText>
      <AppText variant="caption" className="mt-xxs">
        {item.stat}
      </AppText>
      <AppText variant="overline" muted className="mt-sm">
        {item.time}
      </AppText>
    </Card>
  );
}

export function HomeRecentActivity({ items, onShowMore, onReport }: Props) {
  const { isDesktop } = useBreakpoint();
  const visible = items;

  const renderItem = (item: RecentActivityItem) => (
    <Pressable
      key={item.id}
      onPress={() => onReport?.(activityReport(item))}
      accessibilityRole="button"
      className={INTERACTIVE_CARD_PRESSABLE}
    >
      <ActivityCard item={item} />
    </Pressable>
  );

  if (isDesktop) {
    return (
      <View className="mb-lg w-full">
        <ResponsiveGrid desktopCols={5} equalWidth className="w-full">
          {visible.map((item) => renderItem(item))}
        </ResponsiveGrid>
        {onShowMore ? (
          <Pressable
            onPress={onShowMore}
            accessibilityRole="button"
            className="mt-sm self-start"
          >
            <AppText variant="bodyStrong" accent>
              View all activity
            </AppText>
          </Pressable>
        ) : null}
      </View>
    );
  }

  const { colors } = useTheme();

  return (
    <View className="mb-lg w-full">
      {visible.slice(0, 4).map((item) => (
        <Pressable
          key={item.id}
          onPress={() => onReport?.(activityReport(item))}
          accessibilityRole="button"
          className={`mb-xs ${INTERACTIVE_CARD_PRESSABLE}`}
        >
          <Card interactive variant="elevated" className="flex-row items-center py-sm">
            <View
              className="mr-sm rounded-md p-sm"
              style={{ backgroundColor: `${colors.accent}18` }}
            >
              <Ionicons
                name={ICONS[item.icon]}
                size={20}
                color={colors.accent}
              />
            </View>
            <View className="min-w-0 flex-1">
              <AppText variant="bodyStrong" numberOfLines={1}>
                {item.title}
              </AppText>
              <AppText variant="caption" className="mt-xxs">
                {item.stat}
              </AppText>
            </View>
            <AppText variant="overline" className="ml-xs text-muted">
              {item.time}
            </AppText>
          </Card>
        </Pressable>
      ))}
      {onShowMore ? (
        <Pressable
          onPress={onShowMore}
          accessibilityRole="button"
          className="mt-xs self-start"
        >
          <AppText variant="bodyStrong" accent>
            More
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}
