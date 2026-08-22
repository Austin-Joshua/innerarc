import { Pressable } from "react-native";

import { AppText } from "./AppText";
import { Card } from "./Card";

type NavCardProps = {
  title: string;
  caption: string;
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
    <Pressable onPress={onPress} className={`mt-sm ${className}`.trim()}>
      <Card variant="elevated">
        <AppText variant="subhead">{title}</AppText>
        <AppText variant="caption" className="mt-xxs">
          {caption}
        </AppText>
      </Card>
    </Pressable>
  );
}
