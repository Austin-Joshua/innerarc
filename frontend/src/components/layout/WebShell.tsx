import { PropsWithChildren } from "react";
import { View } from "react-native";

import { isWeb } from "../../platform";

/**
 * Centers the app in a phone-width column on desktop browsers.
 * Native builds render children full-screen.
 */
export function WebShell({ children }: PropsWithChildren) {
  if (!isWeb) {
    return children;
  }

  return (
    <View className="min-h-full flex-1 items-center bg-surface">
      <View className="min-h-full w-full max-w-app flex-1 border-x border-border bg-background shadow-sm">
        {children}
      </View>
    </View>
  );
}
