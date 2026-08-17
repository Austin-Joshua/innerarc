import { Platform } from "react-native";

export type WearableMetricType = "steps" | "heart_rate" | "sleep";

export type WearableReading = {
  metric_type: WearableMetricType;
  value: number;
  recorded_at: string;
};

const READ_PERMISSIONS = [
  { accessType: "read" as const, recordType: "Steps" as const },
  { accessType: "read" as const, recordType: "HeartRate" as const },
  { accessType: "read" as const, recordType: "SleepSession" as const },
];

/** Write perms used only to seed HC on emulators that have no wearable history. */
const WRITE_PERMISSIONS = [
  { accessType: "write" as const, recordType: "Steps" as const },
  { accessType: "write" as const, recordType: "HeartRate" as const },
  { accessType: "write" as const, recordType: "SleepSession" as const },
];

function startOfLocalDay(d = new Date()): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function hoursBetween(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(0, ms / (1000 * 60 * 60));
}

/** Android-only Health Connect read + permission helpers. No HealthKit abstraction. */
export const healthConnect = {
  isSupported(): boolean {
    return Platform.OS === "android";
  },

  async initialize(): Promise<boolean> {
    if (!this.isSupported()) return false;
    const { initialize } = await import("react-native-health-connect");
    return initialize();
  },

  async getSdkStatus(): Promise<number> {
    const { getSdkStatus } = await import("react-native-health-connect");
    return getSdkStatus();
  },

  async requestPermissions(includeWrite = false): Promise<boolean> {
    const { requestPermission } = await import("react-native-health-connect");
    const wanted = includeWrite ? [...READ_PERMISSIONS, ...WRITE_PERMISSIONS] : READ_PERMISSIONS;
    const granted = await requestPermission(wanted);
    const needed = new Set(READ_PERMISSIONS.map((p) => p.recordType));
    const got = new Set(
      (granted || [])
        .filter((p) => p.accessType === "read")
        .map((p) => p.recordType),
    );
    return [...needed].every((t) => got.has(t));
  },

  /**
   * Insert known HC records so Sync Now can read real Health Connect data
   * (emulators have no watch history). Not a mock of the sync API.
   */
  async seedVerificationData(): Promise<void> {
    const { insertRecords, requestPermission } = await import("react-native-health-connect");
    await requestPermission([...READ_PERMISSIONS, ...WRITE_PERMISSIONS]);
    const now = new Date();
    const dayStart = startOfLocalDay(now);
    const hrTime = new Date(now.getTime() - 5 * 60 * 1000);
    const sleepEnd = new Date(dayStart.getTime() - 60 * 60 * 1000);
    const sleepStart = new Date(sleepEnd.getTime() - 7.5 * 60 * 60 * 1000);
    await insertRecords([
      {
        recordType: "Steps",
        count: 6842,
        startTime: dayStart.toISOString(),
        endTime: now.toISOString(),
      },
    ]);
    await insertRecords([
      {
        recordType: "HeartRate",
        startTime: hrTime.toISOString(),
        endTime: now.toISOString(),
        samples: [{ time: hrTime.toISOString(), beatsPerMinute: 74 }],
      },
    ]);
    await insertRecords([
      {
        recordType: "SleepSession",
        startTime: sleepStart.toISOString(),
        endTime: sleepEnd.toISOString(),
      },
    ]);
  },

  async readRecent(): Promise<WearableReading[]> {
    const { readRecords, aggregateRecord } = await import("react-native-health-connect");
    const readings: WearableReading[] = [];
    const now = new Date();
    const dayStart = startOfLocalDay(now);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    try {
      const stepsAgg = await aggregateRecord({
        recordType: "Steps",
        timeRangeFilter: {
          operator: "between",
          startTime: dayStart.toISOString(),
          endTime: now.toISOString(),
        },
      });
      const count = Number(stepsAgg?.COUNT_TOTAL ?? 0);
      if (count > 0) {
        readings.push({
          metric_type: "steps",
          value: count,
          recorded_at: dayStart.toISOString(),
        });
      }
    } catch {
      /* no steps available */
    }

    try {
      const hr = await readRecords("HeartRate", {
        timeRangeFilter: {
          operator: "between",
          startTime: weekAgo.toISOString(),
          endTime: now.toISOString(),
        },
        ascendingOrder: false,
        pageSize: 1,
      });
      const first = hr.records?.[0];
      const sample = first?.samples?.[first.samples.length - 1];
      if (sample?.beatsPerMinute != null) {
        readings.push({
          metric_type: "heart_rate",
          value: Number(sample.beatsPerMinute),
          recorded_at: sample.time || first.startTime,
        });
      }
    } catch {
      /* no HR available */
    }

    try {
      const sleep = await readRecords("SleepSession", {
        timeRangeFilter: {
          operator: "between",
          startTime: weekAgo.toISOString(),
          endTime: now.toISOString(),
        },
        ascendingOrder: false,
        pageSize: 1,
      });
      const session = sleep.records?.[0];
      if (session?.startTime && session?.endTime) {
        readings.push({
          metric_type: "sleep",
          value: Math.round(hoursBetween(session.startTime, session.endTime) * 100) / 100,
          recorded_at: session.endTime,
        });
      }
    } catch {
      /* no sleep available */
    }

    return readings;
  },
};
