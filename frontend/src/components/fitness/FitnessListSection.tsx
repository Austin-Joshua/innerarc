import { PropsWithChildren } from "react";
import { View } from "react-native";

import { AppText } from "../ui/AppText";

type FitnessListSectionProps = PropsWithChildren<{
  title: string;
  caption?: string;
  className?: string;
}>;

export function FitnessListSection({
  title,
  caption,
  className = "",
  children,
}: FitnessListSectionProps) {
  return (
    <View className={`mb-lg w-full ${className}`.trim()}>
      <AppText variant="title" className="mb-sm font-bold">
        {title}
      </AppText>
      {caption ? (
        <AppText variant="caption" muted className="mb-sm">
          {caption}
        </AppText>
      ) : null}
      <View className="overflow-hidden rounded-xl border border-border bg-surface/50 px-md">
        {children}
      </View>
    </View>
  );
}
