import { View } from "react-native";

import { AppText } from "../../components/ui";

type ShellPreviewScreenProps = {
  section: string;
};

/** Phase 1 placeholder — chrome verification only. */
export default function ShellPreviewScreen({ section }: ShellPreviewScreenProps) {
  return (
    <View className="flex-1 bg-background px-xl py-lg">
      <AppText variant="overline" className="mb-sm">
        Shell preview
      </AppText>
      <AppText variant="display" className="mb-md">
        {section}
      </AppText>
      <View className="flex-1 rounded-lg border border-dashed border-border bg-surface p-lg">
        <AppText variant="body" muted>
          Screen content will be wired in Phase 2. This area confirms the
          navigation shell, sidebar, title bar, and tab bar layout.
        </AppText>
      </View>
    </View>
  );
}
