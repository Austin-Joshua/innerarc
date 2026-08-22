import AsyncStorage from "@react-native-async-storage/async-storage";
import { CompositeNavigationProp, useFocusEffect, useNavigation } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { useCallback, useMemo, useState } from "react";

import {
  api,
  CoachNudge,
  Dashboard,
  GamificationState,
} from "../api";
import { HomeFitnessSummary } from "../charts/HomeFitnessSummary";
import { HomeReport } from "../charts/homeReports";
import { HomeReportModal, PageShell } from "../components/layout";
import { Screen } from "../components/ui";
import { useWearableSync } from "../context/WearableSyncContext";
import {
  isHomePreview,
  mergeDashboardPreview,
  mergeGamificationPreview,
  PREVIEW_RECENT_ACTIVITY,
} from "../homePreviewSeed";
import { MainDrawerParamList, MainTabParamList } from "../navigation/types";

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "Home">,
  DrawerNavigationProp<MainDrawerParamList>
>;

const nudgeDismissKey = (nudgeId: string, day: string) =>
  `coach_nudge_dismissed:${day}:${nudgeId}`;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { readings, setReadings } = useWearableSync();
  const [activeReport, setActiveReport] = useState<HomeReport | null>(null);
  const [data, setData] = useState<Dashboard | null>(
    isHomePreview() ? mergeDashboardPreview(null) : null,
  );
  const [game, setGame] = useState<GamificationState | null>(
    isHomePreview() ? mergeGamificationPreview(null) : null,
  );
  const [nudge, setNudge] = useState<CoachNudge | null>(null);

  const dashboard = useMemo(() => mergeDashboardPreview(data), [data]);
  const gamification = useMemo(() => mergeGamificationPreview(game), [game]);

  const openReport = useCallback((report: HomeReport) => {
    setActiveReport(report);
  }, []);

  const refresh = useCallback(() => {
    if (isHomePreview()) {
      setData(mergeDashboardPreview(null));
      setGame(mergeGamificationPreview(null));
      setReadings([]);
      return () => undefined;
    }

    let active = true;
    const utcDay = new Date().toISOString().slice(0, 10);
    Promise.all([
      api.dashboardToday().catch(() => null),
      api.gamificationStatus().catch(() => null),
      api.wearableRecent().catch(() => null),
      api.coachNudge().catch(() => ({ nudge: null })),
    ])
      .then(async ([dash, g, w, nudgeRes]) => {
        if (!active) return;
        setData(dash);
        setGame(g);
        setReadings(w?.readings ?? []);
        const next = nudgeRes?.nudge ?? null;
        if (!next) {
          setNudge(null);
          return;
        }
        const dismissed = await AsyncStorage.getItem(
          nudgeDismissKey(next.id, utcDay),
        );
        if (!active) return;
        setNudge(dismissed ? null : next);
      })
      .catch(() => {
        setData(mergeDashboardPreview(null));
        setGame(mergeGamificationPreview(null));
        setReadings([]);
      });
    return () => {
      active = false;
    };
  }, [setReadings]);

  useFocusEffect(
    useCallback(() => {
      return refresh();
    }, [refresh]),
  );

  const onDismissNudge = async () => {
    if (!nudge) return;
    const utcDay = new Date().toISOString().slice(0, 10);
    const id = nudge.id;
    setNudge(null);
    try {
      await AsyncStorage.setItem(nudgeDismissKey(id, utcDay), "1");
    } catch {
      /* local dismiss only */
    }
  };

  return (
    <Screen>
      <PageShell centeredMobile={false}>
        <HomeFitnessSummary
          dashboard={dashboard}
          gamification={gamification}
          nudge={nudge}
          onDismissNudge={onDismissNudge}
          recentItems={PREVIEW_RECENT_ACTIVITY}
          readings={readings}
          onReport={openReport}
        />
      </PageShell>

      <HomeReportModal
        report={activeReport}
        onClose={() => setActiveReport(null)}
      />
    </Screen>
  );
}
