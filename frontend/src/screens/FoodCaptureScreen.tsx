import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { Text } from "react-native";

import { api } from "../api";
import { Button, Screen } from "../components/ui";
import { setFoodDraft, singleFromClassify } from "../foodDraft";
import { RootStackParamList } from "../navigation/types";
import { usePhotoCapture } from "../usePhotoCapture";

type Nav = NativeStackNavigationProp<RootStackParamList, "FoodCapture">;

export default function FoodCaptureScreen() {
  const navigation = useNavigation<Nav>();
  const { pick, busy, error } = usePhotoCapture({
    task: "food_log",
    screen: "FoodCapture",
    quality: 0.7,
    permissionDeniedMessage: "Permission is needed to add a meal photo.",
    failureMessage: "Classification failed",
    capture: (uri) => api.classify(uri),
    onCaptured: (classified, uri) => {
      setFoodDraft(singleFromClassify(classified, uri));
      navigation.navigate("FoodResult");
    },
  });

  return (
    <Screen scroll={false} className="justify-center">
      <Text className="mb-sm text-display font-semibold text-ink">
        Log a meal
      </Text>
      <Text className="mb-lg text-caption text-muted">
        Photograph a dish or choose an existing photo. The model names the dish;
        ingredients come from the recipe table, not from pixels.
      </Text>
      {error ? (
        <Text className="mb-lg text-caption text-danger">{error}</Text>
      ) : null}
      <Button
        label={busy ? "Working…" : "Take photo"}
        onPress={() => pick(true)}
        disabled={busy}
        busy={busy}
      />
      <Button
        label="Choose from library"
        variant="secondary"
        onPress={() => pick(false)}
        disabled={busy}
        className="mt-sm"
      />
    </Screen>
  );
}
