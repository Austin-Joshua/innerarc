import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { NotificationBellButton } from "../layout/NotificationBellButton";
import { AppearanceToggle } from "../ui/AppearanceToggle";
import { AppText } from "../ui/AppText";
import { useTheme } from "../../ThemeProvider";
import { BreakpointTier } from "../../hooks/useBreakpoint";
import { fitnessTokens } from "./fitnessLayout";
import { FITNESS_MOBILE } from "./fitnessMobileTheme";

type FitnessScreenTitleProps = {
  title: string;
  tier?: BreakpointTier;
  onMenu?: () => void;
  /** Dark mode + notifications in title card (mobile shell). */
  showActions?: boolean;
  rightAction?: React.ReactNode;
};

export function FitnessScreenTitle({
  title,
  tier = "mobile",
  onMenu,
  showActions = true,
  rightAction,
}: FitnessScreenTitleProps) {
  const { colors } = useTheme();
  const tokens = fitnessTokens(tier);
  const isCard = tier === "mobile";

  const inner = (
    <View className="flex-row items-center justify-between gap-sm">
      <View className="min-w-0 flex-1 flex-row items-center gap-sm">
        {onMenu ? (
          <Pressable
            onPress={onMenu}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Open menu"
          >
            <Ionicons name="menu" size={tier === "desktop" ? 28 : 26} color={colors.text} />
          </Pressable>
        ) : null}
        <AppText
          variant="display"
          className="font-extrabold"
          style={{ fontSize: tokens.titleSize }}
          numberOfLines={1}
        >
          {title}
        </AppText>
      </View>
      <View className="flex-row items-center gap-xxs">
        {rightAction}
        {showActions ? (
          <>
            <AppearanceToggle icon fitness />
            <NotificationBellButton variant="fitness" />
          </>
        ) : null}
      </View>
    </View>
  );

  if (!isCard) {
    return <View className="mb-lg w-full">{inner}</View>;
  }

  return (
    <View
      className="mb-md rounded-xl border border-border px-md py-sm"
      style={{ backgroundColor: `${colors.surface}CC` }}
    >
      {inner}
    </View>
  );
}

type FitnessListRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
};

export function FitnessListRow({ icon, label, value, onPress }: FitnessListRowProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : "text"}
      className="flex-row items-center border-b border-border py-md"
    >
      <View
        className="mr-md rounded-md p-xs"
        style={{ backgroundColor: `${colors.accentBright}18` }}
      >
        <Ionicons name={icon} size={FITNESS_MOBILE.listIconSize} color={colors.accentBright} />
      </View>
      <AppText variant="bodyStrong" className="flex-1" style={{ color: colors.accentBright }}>
        {label}
      </AppText>
      {value ? (
        <AppText variant="bodyStrong" className="mr-sm" style={{ color: colors.accentBright }}>
          {value}
        </AppText>
      ) : null}
      {onPress ? (
        <Ionicons name="chevron-forward" size={18} color={colors.accentBright} />
      ) : null}
    </Pressable>
  );
}

type StatItem = { label: string; value: string };

export function FitnessStatGrid({ items }: { items: StatItem[] }) {
  return (
    <View className="mb-lg flex-row flex-wrap">
      {items.map((item) => (
        <View key={item.label} className="mb-md w-1/2 pr-sm">
          <AppText variant="caption" muted>
            {item.label}
          </AppText>
          <AppText variant="title" className="mt-xxs font-bold">
            {item.value}
          </AppText>
        </View>
      ))}
    </View>
  );
}

type FitnessHeroWorkoutCardProps = {
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: [string, string];
  onPress: () => void;
  actionIcon?: keyof typeof Ionicons.glyphMap;
  busy?: boolean;
};

export function FitnessHeroWorkoutCard({
  title,
  subtitle,
  icon,
  gradient,
  onPress,
  actionIcon = "play",
  busy = false,
}: FitnessHeroWorkoutCardProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      className="mb-md overflow-hidden rounded-2xl"
      style={{ borderRadius: FITNESS_MOBILE.heroCardRadius, opacity: busy ? 0.7 : 1 }}
    >
      <View
        className="min-h-[140px] justify-between p-lg"
        style={{
          backgroundColor: gradient[0],
        }}
      >
        <View className="flex-row items-start justify-between">
          <Ionicons name={icon} size={28} color={colors.accentBright} />
          <View
            className="h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.accentBright }}
          >
            <Ionicons name={actionIcon} size={22} color="#000000" />
          </View>
        </View>
        <View>
          <AppText variant="title" className="font-bold text-white">
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="caption" className="mt-xxs text-white/70">
              {subtitle}
            </AppText>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
