import { Ionicons } from "@expo/vector-icons";
import { Image, Modal, Pressable, ScrollView, useWindowDimensions, View } from "react-native";
import Animated, { FadeIn, FadeOut, ZoomIn } from "react-native-reanimated";

import { HomeReport } from "../../charts/homeReports";
import { REPORT_COLORS } from "../../charts/reportAssets";
import { useTheme } from "../../ThemeProvider";
import { AppText } from "../ui";

const CARD_MAX_WIDTH = 440;
const HEADER_HEIGHT = 52;
const HERO_HEIGHT = 80;
const FOOTER_HEIGHT = 44;

type DetailReportModalProps = {
  report: HomeReport | null;
  onClose: () => void;
};

export function DetailReportModal({ report, onClose }: DetailReportModalProps) {
  const { colors, isDark } = useTheme();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const cardWidth = Math.min(CARD_MAX_WIDTH, windowWidth - 32);
  const bodyMaxHeight = Math.min(
    340,
    windowHeight - HEADER_HEIGHT - HERO_HEIGHT - FOOTER_HEIGHT - 120,
  );

  const aiBoxBg = isDark ? REPORT_COLORS.aiBoxDark : REPORT_COLORS.aiBoxLight;
  const aiTitleColor = isDark ? REPORT_COLORS.fluorescent : REPORT_COLORS.aiTitleLight;
  const iconBg = isDark ? REPORT_COLORS.aiBoxDark : REPORT_COLORS.aiBoxLight;
  const primary = isDark ? REPORT_COLORS.fluorescent : REPORT_COLORS.primary;

  return (
    <Modal
      visible={report != null}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {report ? (
        <View className="flex-1 items-center justify-center px-md">
          <Animated.View
            entering={FadeIn.duration(160)}
            exiting={FadeOut.duration(120)}
            className="absolute inset-0 bg-black/55"
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close report"
              className="h-full w-full"
              onPress={onClose}
            />
          </Animated.View>

          <Animated.View
            entering={ZoomIn.duration(220).springify().damping(18)}
            exiting={FadeOut.duration(140)}
            style={{ width: cardWidth, zIndex: 10 }}
          >
            <View
              className="overflow-hidden rounded-2xl border border-border"
              style={{
                backgroundColor: colors.elevated,
                shadowColor: "#000",
                shadowOpacity: 0.22,
                shadowRadius: 28,
                shadowOffset: { width: 0, height: 12 },
                elevation: 12,
              }}
            >
              {/* Header */}
              <View
                className="flex-row items-center justify-between border-b border-border px-md py-sm"
                style={{ minHeight: HEADER_HEIGHT }}
              >
                <View className="min-w-0 flex-1 flex-row items-center gap-sm">
                  <View
                    className="rounded-md p-xs"
                    style={{ backgroundColor: iconBg }}
                  >
                    <Ionicons name={report.icon} size={18} color={primary} />
                  </View>
                  <View className="min-w-0 shrink">
                    <AppText variant="bodyStrong" className="font-bold">
                      Detailed Report
                    </AppText>
                    <AppText variant="overline" muted numberOfLines={1}>
                      {report.category}
                    </AppText>
                  </View>
                </View>
                <Pressable
                  onPress={onClose}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  className="ml-xs rounded-md p-xs"
                >
                  <Ionicons name="close" size={20} color={colors.textMuted} />
                </Pressable>
              </View>

              {/* Hero — clipped, decorative only */}
              <View
                style={{ height: HERO_HEIGHT, overflow: "hidden" }}
                className="border-b border-border bg-surface"
              >
                <Image
                  source={{ uri: report.heroImage }}
                  style={{ width: "100%", height: HERO_HEIGHT }}
                  resizeMode="cover"
                  accessibilityLabel={`${report.category} illustration`}
                />
              </View>

              {/* Body — stacked blocks, no absolute layers */}
              <ScrollView
                style={{ maxHeight: bodyMaxHeight }}
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
                showsVerticalScrollIndicator={false}
                bounces={false}
                nestedScrollEnabled
              >
                <AppText variant="bodyStrong" className="mb-md font-bold leading-6">
                  {report.headlineLabel}: {report.headlineValue}
                </AppText>

                <AppText variant="caption" muted className="mb-md leading-5">
                  {report.body}
                </AppText>

                <View
                  className="mb-md rounded-lg px-md py-sm"
                  style={{ backgroundColor: aiBoxBg }}
                >
                  <AppText
                    variant="caption"
                    className="mb-xs font-bold"
                    style={{ color: aiTitleColor }}
                  >
                    Coach analysis
                  </AppText>
                  <AppText variant="caption" className="leading-5">
                    {report.aiAnalysis}
                  </AppText>
                </View>

                <View className="gap-sm">
                  {report.insights.map((item) => (
                    <View key={item.label} className="flex-row flex-wrap gap-x-xs">
                      <AppText variant="caption" className="font-bold">
                        {item.label}:
                      </AppText>
                      <AppText variant="caption" muted>
                        {item.value}
                      </AppText>
                    </View>
                  ))}
                </View>
              </ScrollView>

              {/* Footer */}
              <View
                className="flex-row items-center gap-xs border-t border-border px-md py-sm"
                style={{ minHeight: FOOTER_HEIGHT }}
              >
                <Ionicons name="checkmark-circle" size={14} color={primary} />
                <AppText variant="overline" muted>
                  Generated by Innerarc Coach
                </AppText>
              </View>
            </View>
          </Animated.View>
        </View>
      ) : null}
    </Modal>
  );
}

/** @deprecated Use DetailReportModal — kept for existing imports. */
export const HomeReportModal = DetailReportModal;
