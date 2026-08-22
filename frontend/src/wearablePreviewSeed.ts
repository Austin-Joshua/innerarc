import { WearableReading } from "./api";
import { isHomePreview } from "./homePreviewSeed";

/** Synthetic 7-day trend points ending at `current`. */
export function buildTrendPoints(
  current: number,
  points = 7,
): { value: number }[] {
  if (current <= 0) {
    return Array.from({ length: points }, (_, i) => ({ value: 20 + i * 3 }));
  }
  return Array.from({ length: points }, (_, i) => {
    const t = i / Math.max(points - 1, 1);
    const wobble = Math.sin(i * 1.4) * current * 0.04;
    return { value: Math.max(0, current * (0.82 + t * 0.18) + wobble) };
  });
}

const BASE_READINGS: WearableReading[] = [
  {
    id: "preview-steps",
    source: "preview",
    metric_type: "steps",
    value: 8420,
    recorded_at: new Date().toISOString(),
  },
  {
    id: "preview-hr",
    source: "preview",
    metric_type: "heart_rate",
    value: 72,
    recorded_at: new Date().toISOString(),
  },
  {
    id: "preview-sleep",
    source: "preview",
    metric_type: "sleep",
    value: 7.2,
    recorded_at: new Date().toISOString(),
  },
  {
    id: "preview-spo2",
    source: "preview",
    metric_type: "spo2",
    value: 98,
    recorded_at: new Date().toISOString(),
  },
];

export function mergeWearablePreview(
  readings: WearableReading[],
): WearableReading[] {
  if (isHomePreview() || readings.length < 4) {
    const merged = [...readings];
    for (const seed of BASE_READINGS) {
      if (!merged.some((r) => r.metric_type === seed.metric_type)) {
        merged.push(seed);
      }
    }
    return merged;
  }
  return readings;
}

export const PREVIEW_BLOOD_PRESSURE = { systolic: 118, diastolic: 76 };

export const PREVIEW_HEARTBEAT = 68;
