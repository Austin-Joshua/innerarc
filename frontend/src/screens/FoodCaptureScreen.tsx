import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback } from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { api } from "../api";
import { FitnessScreenTitle } from "../components/fitness/FitnessMobileParts";
import { ActionStack } from "../components/layout/ActionStack";
import { DesktopColumns, PageShell } from "../components/layout";
import { AppText, Button, Card, Screen } from "../components/ui";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { PREVIEW_DASHBOARD } from "../homePreviewSeed";
import { setFoodDraft, singleFromClassify } from "../foodDraft";
import {
  isFoodPreview,
  previewClassifyResult,
  seedFoodPreviewDraft,
} from "../foodPreviewSeed";
import { LogMealStackParamList } from "../navigation/types";
import { useTheme } from "../ThemeProvider";
import { usePhotoCapture } from "../usePhotoCapture";

type Nav = NativeStackNavigationProp<LogMealStackParamList, "FoodCapture">;

function LogMealInfoPanel() {
  const { colors } = useTheme();
  const d = PREVIEW_DASHBOARD;

  return (
    <View className="w-full">
      <Card variant="elevated" className="mb-md p-md">
        <View className="mb-sm flex-row items-center gap-xs">
          <Ionicons name="nutrition-outline" size={20} color={colors.accent} />
          <AppText variant="subhead" className="font-bold">
            Today&apos;s nutrition
          </AppText>
        </View>
        <AppText variant="numeral" className="text-accent">
          {Math.round(d.logged.calories)}
        </AppText>
        <AppText variant="caption" muted>
          kcal logged · {Math.round(d.remaining.calories)} remaining
        </AppText>
        <View className="mt-md flex-row flex-wrap gap-md">
          <View>
            <AppText variant="overline" muted>
              Protein
            </AppText>
            <AppText variant="bodyStrong">
              {Math.round(d.logged.protein_g)} / {d.target.protein_g} g
            </AppText>
          </View>
          <View>
            <AppText variant="overline" muted>
              Meals
            </AppText>
            <AppText variant="bodyStrong">{d.entries.length} logged</AppText>
          </View>
        </View>
      </Card>
      <Card variant="elevated" className="p-md">
        <AppText variant="subhead" className="mb-sm font-bold">
          Photo tips
        </AppText>
        <AppText variant="caption" muted className="mb-xs">
          · Shoot from above with even lighting
        </AppText>
        <AppText variant="caption" muted className="mb-xs">
          · Include the full plate in frame
        </AppText>
        <AppText variant="caption" muted>
          · AI estimates calories and macros instantly
        </AppText>
      </Card>
    </View>
  );
}

export default function FoodCaptureScreen() {
  const navigation = useNavigation<Nav>();
  const { isDesktop, tier } = useBreakpoint();

  useFocusEffect(
    useCallback(() => {
      seedFoodPreviewDraft();
    }, []),
  );

  const { pick, busy, error } = usePhotoCapture({
    task: "food_log",
    screen: "FoodCapture",
    quality: 0.7,
    permissionDeniedMessage: "Allow camera access to log a meal.",
    failureMessage: "Could not classify photo",
    capture: async (uri) => {
      if (isFoodPreview()) {
        return previewClassifyResult(uri);
      }
      return api.classify(uri);
    },
    onCaptured: (classified, uri) => {
      setFoodDraft(singleFromClassify(classified, uri));
      navigation.navigate("FoodResult");
    },
  });

  const openSampleResult = () => {
    seedFoodPreviewDraft();
    navigation.navigate("FoodResult");
  };

  const capture = (
    <View className="w-full items-center justify-center">
      <FitnessScreenTitle title="Nutrition" tier={tier} />
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
        {isFoodPreview() ? (
          <Button
            label="Use sample meal"
            variant="secondary"
            onPress={openSampleResult}
            disabled={busy}
            className="mt-sm w-full"
          />
        ) : null}
      </ActionStack>
    </View>
  );

  return (
    <Screen scroll={false} className="items-center justify-center">
      <PageShell centeredMobile>
        {isDesktop ? (
          <DesktopColumns
            left={<LogMealInfoPanel />}
            right={capture}
            leftFlex={1}
            rightFlex={1}
          />
        ) : (
          capture
        )}
      </PageShell>
    </Screen>
  );
}
