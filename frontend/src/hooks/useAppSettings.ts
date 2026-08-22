import { useCallback, useEffect, useState } from "react";

import {
  AppSettings,
  DEFAULT_APP_SETTINGS,
  loadAppSettings,
  saveAppSettings,
} from "../settings/appSettings";

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    void loadAppSettings().then((loaded) => {
      if (active) {
        setSettings(loaded);
        setReady(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback((updater: (prev: AppSettings) => AppSettings) => {
    setSettings((prev) => {
      const next = updater(prev);
      void saveAppSettings(next);
      return next;
    });
  }, []);

  const updatePersonal = useCallback(
    (patch: Partial<AppSettings["personal"]>) => {
      persist((prev) => ({
        ...prev,
        personal: { ...prev.personal, ...patch },
      }));
    },
    [persist],
  );

  const updateNotifications = useCallback(
    (patch: Partial<AppSettings["notifications"]>) => {
      persist((prev) => ({
        ...prev,
        notifications: { ...prev.notifications, ...patch },
      }));
    },
    [persist],
  );

  const updateReminderTime = useCallback(
    (key: keyof AppSettings["reminderTimes"], value: string) => {
      persist((prev) => ({
        ...prev,
        reminderTimes: { ...prev.reminderTimes, [key]: value },
      }));
    },
    [persist],
  );

  return {
    settings,
    ready,
    updatePersonal,
    updateNotifications,
    updateReminderTime,
  };
}
