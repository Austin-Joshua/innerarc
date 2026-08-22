import { DrawerNavigationProp } from "@react-navigation/drawer";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { View } from "react-native";

import {
  AppText,
  AppearanceToggle,
  PageTitle,
  Screen,
  SectionHeader,
  TextField,
} from "../components/ui";
import { Card } from "../components/ui/Card";
import { PageShell } from "../components/layout";
import {
  FitnessListRow,
  FitnessScreenTitle,
} from "../components/fitness/FitnessMobileParts";
import { FitnessListSection } from "../components/fitness/FitnessListSection";
import { SettingsToggleRow } from "../components/settings/SettingsToggleRow";
import { TimeChipPicker } from "../components/settings/TimeChipPicker";
import { UnitToggle } from "../components/settings/UnitToggle";
import { useAppSettings } from "../hooks/useAppSettings";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { MainDrawerParamList } from "../navigation/types";

export default function SettingsScreen() {
  const navigation = useNavigation<DrawerNavigationProp<MainDrawerParamList>>();
  const { isMobile, isTablet, tier, isDesktop } = useBreakpoint();
  const { settings, ready, updatePersonal, updateNotifications, updateReminderTime } =
    useAppSettings();

  const { personal, notifications, reminderTimes } = settings;
  const remindersOn = notifications.mealReminders || notifications.workoutReminders;

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const personalFields = (
    <>
      <TextField
        label="Display name"
        placeholder="How should we greet you?"
        value={personal.displayName}
        onChangeText={(displayName) => updatePersonal({ displayName })}
        autoCapitalize="words"
        className="mb-sm"
      />
      <TextField
        label="Daily calorie goal"
        placeholder="2200"
        value={personal.dailyCalorieGoal}
        onChangeText={(dailyCalorieGoal) =>
          updatePersonal({ dailyCalorieGoal: dailyCalorieGoal.replace(/\D/g, "") })
        }
        keyboardType="number-pad"
        className="mb-sm"
      />
      <UnitToggle
        label="Weight unit"
        value={personal.weightUnit}
        onChange={(weightUnit) => updatePersonal({ weightUnit })}
      />
    </>
  );

  const notificationToggles = (
    <>
      <SettingsToggleRow
        label="Meal logging reminders"
        description="Remind you to log breakfast, lunch, and dinner."
        value={notifications.mealReminders}
        onValueChange={(mealReminders) => updateNotifications({ mealReminders })}
        fitness={!isDesktop}
      />
      <SettingsToggleRow
        label="Workout reminders"
        description="Alert before your usual training window."
        value={notifications.workoutReminders}
        onValueChange={(workoutReminders) =>
          updateNotifications({ workoutReminders })
        }
        fitness={!isDesktop}
      />
      <SettingsToggleRow
        label="Coach nudges"
        description="Short tips based on your recent activity."
        value={notifications.coachNudges}
        onValueChange={(coachNudges) => updateNotifications({ coachNudges })}
        fitness={!isDesktop}
      />
      <SettingsToggleRow
        label="Progress photo reminders"
        description="Monthly check-in to compare visual progress."
        value={notifications.progressReminders}
        onValueChange={(progressReminders) =>
          updateNotifications({ progressReminders })
        }
        fitness={!isDesktop}
      />
      <SettingsToggleRow
        label="Weekly summary"
        description="Sunday recap of calories, workouts, and streak."
        value={notifications.weeklySummary}
        onValueChange={(weeklySummary) => updateNotifications({ weeklySummary })}
        fitness={!isDesktop}
      />
    </>
  );

  const reminderPickers = (
    <>
      <TimeChipPicker
        label="Breakfast"
        value={reminderTimes.breakfast}
        onChange={(t) => updateReminderTime("breakfast", t)}
        enabled={notifications.mealReminders}
      />
      <TimeChipPicker
        label="Lunch"
        value={reminderTimes.lunch}
        onChange={(t) => updateReminderTime("lunch", t)}
        enabled={notifications.mealReminders}
      />
      <TimeChipPicker
        label="Dinner"
        value={reminderTimes.dinner}
        onChange={(t) => updateReminderTime("dinner", t)}
        enabled={notifications.mealReminders}
      />
      <TimeChipPicker
        label="Workout"
        value={reminderTimes.workout}
        onChange={(t) => updateReminderTime("workout", t)}
        enabled={notifications.workoutReminders}
      />
    </>
  );

  if (!isDesktop) {
    return (
      <Screen hideAppName scroll>
        <PageShell centeredMobile={false}>
          <FitnessScreenTitle title="Settings" tier={tier} onMenu={openDrawer} />

          {!ready ? (
            <AppText variant="caption" muted className="mb-md">
              Loading preferences…
            </AppText>
          ) : null}

          <FitnessListSection title="Personal" caption="Profile and daily targets">
            <View className="py-md">{personalFields}</View>
          </FitnessListSection>

          <FitnessListSection title="Appearance">
            <View className="py-md">
              <AppearanceToggle compact />
            </View>
          </FitnessListSection>

          <FitnessListSection
            title="Notifications"
            caption="Choose what Innerarc can nudge you about"
          >
            {notificationToggles}
          </FitnessListSection>

          <FitnessListSection
            title="Reminder times"
            caption={
              remindersOn
                ? "Tap a time for each habit — saved on this device."
                : "Enable meal or workout reminders above to set times."
            }
          >
            <View className="py-md">{reminderPickers}</View>
          </FitnessListSection>

          <FitnessListSection title="Account">
            <FitnessListRow
              icon="person-outline"
              label="My profile"
              onPress={() => navigation.navigate("Profile")}
            />
            <FitnessListRow
              icon="watch-outline"
              label="Connections"
              onPress={() => navigation.navigate("WearableConnect")}
            />
          </FitnessListSection>
        </PageShell>
      </Screen>
    );
  }

  return (
    <Screen hideAppName scroll className="pt-md">
      <PageShell centeredMobile={false}>
        <PageTitle className="mb-xs">Settings</PageTitle>
        <AppText variant="body" muted className="mb-lg">
          Personal preferences, notifications, and reminder times.
        </AppText>

        {!ready ? (
          <AppText variant="caption" muted>
            Loading preferences…
          </AppText>
        ) : null}

        <SectionHeader title="Personal" caption="Profile and daily targets" className="mt-0" />
        <Card variant="elevated" className="mb-md w-full p-md">
          {personalFields}
        </Card>

        <SectionHeader title="Appearance" />
        <Card variant="elevated" className="mb-md w-full p-md">
          <AppearanceToggle />
        </Card>

        <SectionHeader
          title="Notifications"
          caption="Choose what Innerarc can nudge you about"
        />
        <Card variant="elevated" className="mb-md w-full px-md">
          {notificationToggles}
        </Card>

        <SectionHeader
          title="Reminder times"
          caption={
            remindersOn
              ? "Tap a time for each habit — saved on this device."
              : "Enable meal or workout reminders above to set times."
          }
        />
        <Card variant="elevated" className="mb-xl w-full p-md">
          {reminderPickers}
        </Card>
      </PageShell>
    </Screen>
  );
}
