import { PropsWithChildren, ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText } from "../ui/AppText";
import { Card } from "../ui/Card";

type AuthShellProps = PropsWithChildren<{
  title: string;
  subtitle: string;
  footer?: ReactNode;
}>;

export function AuthShell({ title, subtitle, footer, children }: AuthShellProps) {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="grow px-xl pb-xl"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-lg mt-md rounded-lg bg-accent-soft px-lg py-xl">
          <AppText variant="wordmark" accent>
            Innerarc
          </AppText>
          <AppText variant="caption" className="mt-xs">
            Nutrition, training, and progress in one place.
          </AppText>
        </View>

        <Card variant="elevated" className="px-lg py-lg">
          <AppText variant="display">{title}</AppText>
          <AppText variant="body" muted className="mb-lg mt-xs">
            {subtitle}
          </AppText>
          {children}
        </Card>

        {footer ? <View className="mt-lg items-center">{footer}</View> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
