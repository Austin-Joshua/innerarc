import { PropsWithChildren } from "react";
import { View } from "react-native";

import { isWeb } from "../../platform";

/**
 * Full-width shell wrapper on web. Navigation chrome handles layout breakpoints.
 */
export function WebShell({ children }: PropsWithChildren) {
  if (!isWeb) {
    return children;
  }

  return (
    <View className="min-h-full flex-1 bg-background">
      {children}
    </View>
  );
}
