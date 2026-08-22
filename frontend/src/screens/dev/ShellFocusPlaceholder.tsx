import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { Pressable, View } from "react-native";

import { AppText, Button } from "../../components/ui";
import { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type ShellFocusPlaceholderProps = {
  flow: string;
  step?: string;
  nextRoute?: string;
};

/** Dev placeholder for focused flows. */
export default function ShellFocusPlaceholder({
  flow,
  step,
  nextRoute,
}: ShellFocusPlaceholderProps) {
  const navigation = useNavigation<Nav>();

  return (
    <View className="flex-1 bg-background px-xl py-lg">
      <Pressable
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        className="mb-md self-start"
      >
        <AppText variant="bodyStrong" accent>
          Back
        </AppText>
      </Pressable>
      <AppText variant="overline" className="mb-sm">
        Focus flow
      </AppText>
      <AppText variant="display" className="mb-xs">
        {flow}
      </AppText>
      {step ? (
        <AppText variant="caption" className="mb-lg">
          {step}
        </AppText>
      ) : null}
      <View className="mb-lg flex-1 rounded-lg border border-dashed border-accent/40 bg-accent-soft p-lg">
        <AppText variant="body" muted>
          Dev placeholder — real screens live in tab stacks.
        </AppText>
      </View>
      {nextRoute ? (
        <Button
          label="Next step"
          onPress={() => navigation.navigate("Main" as never)}
        />
      ) : (
        <Button label="Done" onPress={() => navigation.navigate("Main")} />
      )}
    </View>
  );
}
