import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback } from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { api } from "../api";
import { ActionStack } from "../components/layout/ActionStack";
import { DesktopColumns, PageShell } from "../components/layout";
import {
  FitnessHeroWorkoutCard,
  FitnessListRow,
  FitnessScreenTitle,
} from "../components/fitness/FitnessMobileParts";
import { FitnessListSection } from "../components/fitness/FitnessListSection";
import { AppText, Button, Card, PageTitle, Screen } from "../components/ui";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { setProgressDraft } from "../progressDraft";
import {
  isProgressPreview,
  PREVIEW_PROGRESS,
  seedProgressPreviewDraft,
} from "../progressPreviewSeed";
import { ProgressStackParamList } from "../navigation/types";
import { useTheme } from "../ThemeProvider";
import { usePhotoCapture } from "../usePhotoCapture";

type Nav = NativeStackNavigationProp<ProgressStackParamList, "ProgressCapture">;

const PROGRESS_GRADIENTS: [string, string][] = [
  ["#0f2418", "#000000"],
  ["#142818", "#050505"],
];

function ProgressInfoPanel() {
  const { colors } = useTheme();

  return (
    <View className="w-full">
      <Card variant="elevated" className="mb-md p-md">
        <View className="mb-sm flex-row items-center gap-xs">
          <Ionicons name="analytics-outline" size={20} color={colors.accent} />
          <AppText variant="subhead" className="font-bold">
            Body metrics
          </AppText>
        </View>
        <AppText variant="caption" muted className="mb-md">
          Pose ratios track shape change over time — not body-fat percentage.
        </AppText>
        <View className="flex-row flex-wrap gap-md">
          <View>
            <AppText variant="overline" muted>
              Waist-to-hip
            </AppText>
            <AppText variant="bodyStrong">0.842</AppText>
          </View>
          <View>
            <AppText variant="overline" muted>
              Shoulder-waist
            </AppText>
            <AppText variant="bodyStrong">1.156</AppText>
          </View>
          <View>
            <AppText variant="overline" muted>
              Streak
            </AppText>
            <AppText variant="bodyStrong">5 days</AppText>
          </View>
        </View>
      </Card>
      <Card variant="elevated" className="p-md">
        <AppText variant="subhead" className="mb-sm font-bold">
          Photo tips
        </AppText>
        <AppText variant="caption" muted className="mb-xs">
          · Stand in frame with arms slightly out
        </AppText>
        <AppText variant="caption" muted className="mb-xs">
          · Use even lighting, same spot each time
        </AppText>
        <AppText variant="caption" muted>
          · First photo becomes your baseline
        </AppText>
      </Card>
    </View>
  );
}

export default function ProgressCaptureScreen() {
  const navigation = useNavigation<Nav>();
  const { isDesktop, tier } = useBreakpoint();

  useFocusEffect(
    useCallback(() => {
      seedProgressPreviewDraft();
    }, []),
  );

  const { pick, busy, error } = usePhotoCapture({
    task: "progress_photo",
    screen: "ProgressCapture",
    quality: 0.8,
    permissionDeniedMessage: "Allow camera access to add a photo.",
    failureMessage: "Could not estimate pose. Stand in frame with even light.",
    capture: async (uri) => {
      if (isProgressPreview()) {
        return { ...PREVIEW_PROGRESS, local_uri: uri };
      }
      return api.uploadProgressPhoto(uri);
    },
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

  const openCompare = () => {
    seedProgressPreviewDraft();
    navigation.navigate("ProgressCompare");
  };

  const mobileCapture = (
    <View className="w-full">
      <FitnessScreenTitle title="Progress" tier={tier} />

      {busy ? (
        <AppText variant="bodyStrong" className="mb-md w-full text-center">
          Estimating pose…
        </AppText>
      ) : null}
      {error ? (
        <AppText variant="caption" className="mb-md w-full text-center text-danger">
          {error}
        </AppText>
      ) : null}

      <FitnessHeroWorkoutCard
        title="Progress check-in"
        subtitle="Capture pose for ratio tracking"
        icon="camera-outline"
        gradient={PROGRESS_GRADIENTS[0]}
        actionIcon="camera"
        onPress={() => pick(true)}
        busy={busy}
      />

      <FitnessHeroWorkoutCard
        title="Choose from library"
        subtitle="Upload an existing photo"
        icon="images-outline"
        gradient={PROGRESS_GRADIENTS[1]}
        actionIcon="add"
        onPress={() => pick(false)}
        busy={busy}
      />

      <FitnessListSection title="Photo tips">
        <FitnessListRow icon="body-outline" label="Stand with arms slightly out" />
        <FitnessListRow icon="sunny-outline" label="Use even lighting, same spot" />
        <FitnessListRow icon="analytics-outline" label="First photo is your baseline" />
      </FitnessListSection>
      {isProgressPreview() ? (
        <Button
          label="View sample compare"
          variant="secondary"
          className="mt-md w-full"
          onPress={openCompare}
        />
      ) : null}
    </View>
  );

  const capture = (
    <View className="w-full items-center justify-center">
      <PageTitle className="mb-lg">Progress</PageTitle>
      {busy ? (
        <AppText variant="bodyStrong" className="mb-md w-full text-center">
          Estimating pose…
        </AppText>
      ) : null}
      {error ? (
        <AppText variant="caption" className="mb-md w-full text-center text-danger">
          {error}
        </AppText>
      ) : null}
      <ActionStack align="center">
        <Button
          label={busy ? "Working…" : "Take photo"}
          onPress={() => pick(true)}
          disabled={busy}
          busy={busy}
          className="w-full"
        />
        <Button
          label="Choose photo"
          variant="secondary"
          onPress={() => pick(false)}
          disabled={busy}
          className="mt-sm w-full"
        />
        {isProgressPreview() ? (
          <Button
            label="View sample compare"
            variant="secondary"
            onPress={openCompare}
            className="mt-sm w-full"
          />
        ) : null}
      </ActionStack>
    </View>
  );

  return (
    <Screen scroll={!isDesktop}>
      <PageShell centeredMobile={false}>
        {isDesktop ? (
          <DesktopColumns
            left={<ProgressInfoPanel />}
            right={capture}
            leftFlex={1}
            rightFlex={1}
          />
        ) : (
          mobileCapture
        )}
      </PageShell>
    </Screen>
  );
}
