import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { Image, View } from "react-native";

import { api } from "../api";
import { RatioTrendChart } from "../charts/RatioTrendChart";
import BadgeBanner from "../components/BadgeBanner";
import { ActionStack } from "../components/layout/ActionStack";
import { DesktopColumns, PageShell, ResponsiveGrid } from "../components/layout";
import {
  FitnessListRow,
  FitnessScreenTitle,
  FitnessStatGrid,
} from "../components/fitness/FitnessMobileParts";
import { FitnessListSection } from "../components/fitness/FitnessListSection";
import { AppText, Button, Card, PageTitle, Screen } from "../components/ui";
import { getProgressDraft } from "../progressDraft";
import {
  isProgressPreview,
  previewProgressImageUri,
  seedProgressPreviewDraft,
} from "../progressPreviewSeed";
import { ProgressStackParamList } from "../navigation/types";
import { goToHome } from "../navigation/navHelpers";
import { useBreakpoint } from "../hooks/useBreakpoint";

type Nav = NativeStackNavigationProp<ProgressStackParamList, "ProgressCompare">;

const photoStyle = (tall?: boolean) => ({
  width: "100%" as const,
  height: tall ? 320 : 180,
});

export default function ProgressCompareScreen() {
  const navigation = useNavigation<Nav>();
  const { isDesktop, tier } = useBreakpoint();
  if (isProgressPreview()) seedProgressPreviewDraft();
  const draft = getProgressDraft();
  const [prevUri, setPrevUri] = useState<string | null>(null);
  const [currUri, setCurrUri] = useState<string | null>(
    draft?.local_uri ?? null,
  );

  useEffect(() => {
    let active = true;
    async function load() {
      if (!draft) return;
      if (isProgressPreview()) {
        if (active) {
          setPrevUri(
            draft.previous ? previewProgressImageUri("previous") : null,
          );
          setCurrUri(previewProgressImageUri("current"));
        }
        return;
      }
      if (draft.previous) {
        try {
          const uri = await api.progressPhotoImageUri(draft.previous.id);
          if (active) setPrevUri(uri);
        } catch {
          if (active) setPrevUri(null);
        }
      }
      if (!draft.local_uri) {
        try {
          const uri = await api.progressPhotoImageUri(draft.current.id);
          if (active) setCurrUri(uri);
        } catch {
          if (active) setCurrUri(null);
        }
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [draft]);

  if (!draft) {
    return (
      <Screen>
        <PageShell centeredMobile={false}>
          {!isDesktop ? (
            <>
              <FitnessScreenTitle title="Progress" tier={tier} />
              <AppText variant="body" muted className="mb-lg w-full text-center">
                No progress photo yet.
              </AppText>
              <FitnessListSection title="Get started">
                <FitnessListRow
                  icon="camera-outline"
                  label="Take your first check-in"
                  onPress={() => navigation.navigate("ProgressCapture")}
                />
              </FitnessListSection>
            </>
          ) : (
            <>
              <AppText variant="caption" muted className="w-full text-center">
                No progress photo yet.
              </AppText>
              <ActionStack align="center" className="mt-lg">
                <Button
                  label="Take photo"
                  className="w-full"
                  onPress={() => navigation.navigate("ProgressCapture")}
                />
              </ActionStack>
            </>
          )}
        </PageShell>
      </Screen>
    );
  }

  const { current, previous, consistency, milestone, trend, gamification } =
    draft;

  const photos = (
    <View className="w-full flex-row gap-sm">
      <View className="w-full flex-1">
        <AppText variant="overline" muted className="mb-xs">
          Previous
        </AppText>
        {previous && prevUri ? (
          <Image
            source={{ uri: prevUri }}
            style={photoStyle(isDesktop)}
            className="rounded-md border border-border bg-elevated"
            accessibilityLabel="Previous progress photo"
          />
        ) : (
          <View
            style={photoStyle(isDesktop)}
            className="items-center justify-center rounded-md border border-border bg-elevated p-sm"
          >
            <AppText variant="caption" muted className="text-center">
              {previous ? "Loading…" : "First check-in — compare next time"}
            </AppText>
          </View>
        )}
      </View>
      <View className="w-full flex-1">
        <AppText variant="overline" muted className="mb-xs">
          Current
        </AppText>
        {currUri ? (
          <Image
            source={{ uri: currUri }}
            style={photoStyle(isDesktop)}
            className="rounded-md border border-border bg-elevated"
            accessibilityLabel="Current progress photo"
          />
        ) : (
          <View
            style={photoStyle(isDesktop)}
            className="items-center justify-center rounded-md border border-border bg-elevated p-sm"
          >
            <AppText variant="caption" muted>
              Loading…
            </AppText>
          </View>
        )}
      </View>
    </View>
  );

  const stats = (
    <View className="w-full">
      <Card className="mb-md w-full">
        <AppText variant="subhead" className="mb-sm font-bold">
          Ratios
        </AppText>
        <ResponsiveGrid desktopCols={2} className="w-full">
          <View>
            <AppText variant="overline" muted>
              Waist-to-hip
            </AppText>
            <AppText variant="numeral">
              {current.ratios.waist_to_hip.toFixed(3)}
            </AppText>
          </View>
          <View>
            <AppText variant="overline" muted>
              Shoulder-to-waist
            </AppText>
            <AppText variant="numeral">
              {current.ratios.shoulder_to_waist.toFixed(3)}
            </AppText>
          </View>
        </ResponsiveGrid>
        {current.mean_visibility != null ? (
          <AppText variant="caption" muted className="mt-sm">
            Confidence {Math.round(current.mean_visibility * 100)}%
          </AppText>
        ) : null}
      </Card>

      <RatioTrendChart photos={trend} />

      <Card className="mt-md w-full">
        <AppText variant="subhead" className="mb-sm font-bold">
          Activity
        </AppText>
        <ResponsiveGrid desktopCols={2} className="w-full">
          <View>
            <AppText variant="overline" muted>
              Workouts
            </AppText>
            <AppText variant="bodyStrong">{consistency.workouts_logged}</AppText>
          </View>
          <View>
            <AppText variant="overline" muted>
              Active days
            </AppText>
            <AppText variant="bodyStrong">{consistency.days_active}</AppText>
          </View>
        </ResponsiveGrid>
      </Card>

      {milestone.message ? (
        <Card variant="accent" className="mt-md w-full">
          <AppText variant="subhead" className="mb-xs font-bold">
            Milestone
          </AppText>
          <AppText variant="body">{milestone.message}</AppText>
        </Card>
      ) : null}

      <ActionStack align={isDesktop ? "start" : "center"} className="mt-lg">
        <Button
          label="Back to Home"
          className="w-full"
          onPress={() => goToHome(navigation)}
        />
        <Button
          label="New check-in"
          variant="secondary"
          className="mt-sm w-full"
          onPress={() => navigation.navigate("ProgressCapture")}
        />
      </ActionStack>
    </View>
  );

  const mobileBody = (
    <>
      <FitnessScreenTitle title="Progress" tier={tier} />
      <BadgeBanner badges={gamification?.new_badges ?? []} />

      {milestone.streak_count > 0 ? (
        <FitnessStatGrid
          items={[
            { label: "Streak", value: `${milestone.streak_count} days` },
            { label: "Workouts", value: String(consistency.workouts_logged) },
            { label: "Active days", value: String(consistency.days_active) },
            {
              label: "Confidence",
              value:
                current.mean_visibility != null
                  ? `${Math.round(current.mean_visibility * 100)}%`
                  : "—",
            },
          ]}
        />
      ) : null}

      <View className="mb-lg w-full flex-row gap-sm">
        <View className="flex-1">
          <AppText variant="overline" muted className="mb-xs">
            Previous
          </AppText>
          {previous && prevUri ? (
            <Image
              source={{ uri: prevUri }}
              style={photoStyle(false)}
              className="rounded-xl border border-border bg-elevated"
              accessibilityLabel="Previous progress photo"
            />
          ) : (
            <View
              style={photoStyle(false)}
              className="items-center justify-center rounded-xl border border-border bg-elevated p-sm"
            >
              <AppText variant="caption" muted className="text-center">
                {previous ? "Loading…" : "First check-in"}
              </AppText>
            </View>
          )}
        </View>
        <View className="flex-1">
          <AppText variant="overline" muted className="mb-xs">
            Current
          </AppText>
          {currUri ? (
            <Image
              source={{ uri: currUri }}
              style={photoStyle(false)}
              className="rounded-xl border border-border bg-elevated"
              accessibilityLabel="Current progress photo"
            />
          ) : (
            <View
              style={photoStyle(false)}
              className="items-center justify-center rounded-xl border border-border bg-elevated p-sm"
            >
              <AppText variant="caption" muted>
                Loading…
              </AppText>
            </View>
          )}
        </View>
      </View>

      <FitnessListSection title="Ratios">
        <FitnessListRow
          icon="resize-outline"
          label="Waist-to-hip"
          value={current.ratios.waist_to_hip.toFixed(3)}
        />
        <FitnessListRow
          icon="body-outline"
          label="Shoulder-to-waist"
          value={current.ratios.shoulder_to_waist.toFixed(3)}
        />
      </FitnessListSection>

      <View className="mb-lg w-full">
        <RatioTrendChart photos={trend} />
      </View>

      {milestone.message ? (
        <FitnessListSection title="Milestone">
          <View className="py-md">
            <AppText variant="body">{milestone.message}</AppText>
          </View>
        </FitnessListSection>
      ) : null}

      <FitnessListSection title="Actions">
        <FitnessListRow
          icon="home-outline"
          label="Back to Summary"
          onPress={() => goToHome(navigation)}
        />
        <FitnessListRow
          icon="camera-outline"
          label="New check-in"
          onPress={() => navigation.navigate("ProgressCapture")}
        />
      </FitnessListSection>
    </>
  );

  return (
    <Screen>
      <PageShell centeredMobile={false}>
        {!isDesktop ? (
          mobileBody
        ) : (
          <>
        <BadgeBanner badges={gamification?.new_badges ?? []} />
        <PageTitle>Compare</PageTitle>
        {milestone.streak_count > 0 ? (
          <AppText variant="caption" className="mt-xs w-full text-muted">
            {milestone.streak_count}-day streak
          </AppText>
        ) : null}

        {isDesktop ? (
          <DesktopColumns
            left={photos}
            right={stats}
            leftFlex={1}
            rightFlex={1}
            className="mt-md"
          />
        ) : (
          <>
            <View className="mt-md w-full">{photos}</View>
            {stats}
          </>
        )}
          </>
        )}
      </PageShell>
    </Screen>
  );
}
