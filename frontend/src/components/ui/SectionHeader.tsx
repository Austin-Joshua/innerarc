import { Text, View } from "react-native";

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
      <Text className="text-heading font-semibold text-ink">{title}</Text>
      {caption ? (
        <Text className="mt-xxs text-caption text-muted">{caption}</Text>
      ) : null}
    </View>
  );
}
