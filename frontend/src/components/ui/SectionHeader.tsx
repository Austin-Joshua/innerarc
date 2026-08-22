import { View } from "react-native";

import { AppText } from "./AppText";

type SectionHeaderProps = {
  title: string;
  caption?: string;
  className?: string;
};

export function SectionHeader({
  title,
  caption,
  className = "",
}: SectionHeaderProps) {
  return (
    <View className={`mb-sm mt-lg ${className}`.trim()}>
      <AppText variant="overline">{title}</AppText>
      {caption ? (
        <AppText variant="caption" className="mt-xxs">
          {caption}
        </AppText>
      ) : null}
    </View>
  );
}
