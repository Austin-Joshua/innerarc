import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { api, WearableReading } from "../api";
import { healthConnect } from "../healthConnect";
import { mergeWearablePreview } from "../wearablePreviewSeed";
import { isAndroid, isWeb } from "../platform";
import { LAST_SYNC_KEY } from "../wearableKeys";

type WearableSyncContextValue = {
  readings: WearableReading[];
  setReadings: (readings: WearableReading[]) => void;
  syncBusy: boolean;
  syncMsg: string | null;
  needsConnect: boolean;
  lastSyncedAt: string | null;
  syncNow: () => Promise<boolean>;
  clearSyncMsg: () => void;
};

const WearableSyncContext = createContext<WearableSyncContextValue | null>(null);

export function WearableSyncProvider({ children }: PropsWithChildren) {
  const [readings, setReadings] = useState<WearableReading[]>([]);
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [needsConnect, setNeedsConnect] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(LAST_SYNC_KEY).then((iso) => {
      if (active && iso) setLastSyncedAt(iso);
    });
    void api
      .wearableRecent()
      .then((res) => {
        if (active && res.readings.length > 0) setReadings(res.readings);
      })
      .catch(() => {
        /* offline or logged out */
      });
    return () => {
      active = false;
    };
  }, []);

  const syncNow = useCallback(async (): Promise<boolean> => {
    setNeedsConnect(false);
    if (isWeb) {
      setSyncMsg("Sync is available in the Android app.");
      return false;
    }
    if (!isAndroid) {
      setSyncMsg("Sync requires the Android app.");
      return false;
    }
    setSyncBusy(true);
    setSyncMsg(null);
    try {
      const ok = await healthConnect.initialize();
      if (!ok) {
        setNeedsConnect(true);
        setSyncMsg("Link Health Connect first.");
        return false;
      }
      const granted = await healthConnect.requestPermissions(__DEV__);
      if (!granted) {
        setNeedsConnect(true);
        setSyncMsg("Health Connect permission required.");
        return false;
      }
      let next = await healthConnect.readRecent();
      if (next.length === 0 && __DEV__) {
        await healthConnect.seedVerificationData();
        next = await healthConnect.readRecent();
      }
      if (next.length === 0) {
        setSyncMsg("No recent Health Connect data found.");
        return false;
      }
      const result = await api.wearableSync(next);
      const iso = new Date().toISOString();
      await AsyncStorage.setItem(LAST_SYNC_KEY, iso);
      setLastSyncedAt(iso);
      setSyncMsg(`Synced ${result.total} items`);
      const recent = await api.wearableRecent();
      setReadings(recent.readings);
      return true;
    } catch (err) {
      setSyncMsg(err instanceof Error ? err.message : "Sync failed");
      return false;
    } finally {
      setSyncBusy(false);
    }
  }, []);

  const clearSyncMsg = useCallback(() => {
    setSyncMsg(null);
    setNeedsConnect(false);
  }, []);

  const mergedReadings = mergeWearablePreview(readings);

  return (
    <WearableSyncContext.Provider
      value={{
        readings: mergedReadings,
        setReadings,
        syncBusy,
        syncMsg,
        needsConnect,
        lastSyncedAt,
        syncNow,
        clearSyncMsg,
      }}
    >
      {children}
    </WearableSyncContext.Provider>
  );
}

export function useWearableSync() {
  const ctx = useContext(WearableSyncContext);
  if (!ctx) {
    throw new Error("useWearableSync must be used within WearableSyncProvider");
  }
  return ctx;
}
