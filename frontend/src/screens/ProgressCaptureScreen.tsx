import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { Text } from "react-native";

import { api } from "../api";
import { Button, Screen } from "../components/ui";
import { setProgressDraft } from "../progressDraft";
import { RootStackParamList } from "../navigation/types";
import { usePhotoCapture } from "../usePhotoCapture";

type Nav = NativeStackNavigationProp<RootStackParamList, "ProgressCapture">;

export default function ProgressCaptureScreen() {
  const navigation = useNavigation<Nav>();
  const { pick, busy, error } = usePhotoCapture({
    task: "progress_photo",
    screen: "ProgressCapture",
    quality: 0.8,
    permissionDeniedMessage: "Permission is needed to add a progress photo.",
    failureMessage:
      "Pose could not be estimated. Stand fully in frame with even lighting.",
    capture: (uri) => api.uploadProgressPhoto(uri),
    onCaptured: (uploaded, uri) => {
      setProgressDraft({ ...uploaded, local_uri: uri });
      api.logEvent({
        event_type: "task_completed",
        task: "progress_photo",
        screen: "ProgressCapture",
      });
      navigation.navigate("ProgressCompare");
    },
  });

  return (
    <Screen scroll={false} className="justify-center">
      <Text className="mb-xs text-title text-ink">Progress photo</Text>
      <Text className="mb-lg text-caption text-muted">
        Capture a full-body standing photo. We estimate pose landmarks and two
        relative ratios — not body composition or clinical measures.
      </Text>
      {busy ? (
        <Text className="mb-md mt-md text-heading text-ink">
          Estimating pose…
        </Text>
      ) : null}
      {error ? (
        <Text className="mb-md text-caption text-danger">{error}</Text>
      ) : null}
      <Button
        label={busy ? "Working…" : "Take photo"}
        onPress={() => pick(true)}
        disabled={busy}
        busy={busy}
        className="mb-sm"
      />
      <Button
        label="Choose from library"
        variant="secondary"
        onPress={() => pick(false)}
        disabled={busy}
      />
    </Screen>
  );
}
