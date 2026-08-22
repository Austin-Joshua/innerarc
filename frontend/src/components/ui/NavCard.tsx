import { Pressable } from "react-native";

import { AppText } from "./AppText";
import { Card } from "./Card";
import { INTERACTIVE_CARD_PRESSABLE } from "./interactiveStyles";

type NavCardProps = {
  title: string;
  caption?: string;
  onPress: () => void;
  className?: string;
};

export function NavCard({
  title,
  caption,
  onPress,
  className = "",
}: NavCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className={`mt-sm ${INTERACTIVE_CARD_PRESSABLE} ${className}`.trim()}
    >
      <Card variant="elevated" interactive>
        <AppText variant="subhead">{title}</AppText>
        {caption ? (
          <AppText variant="caption" className="mt-xxs">
            {caption}
          </AppText>
        ) : null}
      </Card>
    </Pressable>
  );
}
