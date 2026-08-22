import { ProgressUploadResult } from "./api";
import { getProgressDraft, setProgressDraft } from "./progressDraft";

const PLACEHOLDER =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240"><rect fill="#e0dcd6" width="320" height="240"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6f6b66" font-family="sans-serif" font-size="14">Progress photo</text></svg>',
  );

const PREVIOUS_PLACEHOLDER =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240"><rect fill="#efece8" width="320" height="240"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6f6b66" font-family="sans-serif" font-size="14">Previous</text></svg>',
  );

const PREVIEW_RATIOS = {
  waist_to_hip: 0.912,
  shoulder_to_waist: 1.284,
  pixel_widths: { waist: 120, hip: 132, shoulder: 154 },
};

const PREVIOUS_RATIOS = {
  waist_to_hip: 0.928,
  shoulder_to_waist: 1.261,
  pixel_widths: { waist: 124, hip: 134, shoulder: 152 },
};

export const PREVIEW_PROGRESS: ProgressUploadResult & { local_uri?: string } = {
  local_uri: PLACEHOLDER,
  current: {
    id: "preview-progress-current",
    image_url: "/progress/photos/preview-progress-current/image",
    taken_at: new Date().toISOString(),
    mean_visibility: 0.86,
    ratios: PREVIEW_RATIOS,
  },
  previous: {
    id: "preview-progress-previous",
    image_url: "/progress/photos/preview-progress-previous/image",
    taken_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    mean_visibility: 0.82,
    ratios: PREVIOUS_RATIOS,
  },
  consistency: {
    period_start: new Date(Date.now() - 7 * 86400000).toISOString(),
    period_end: new Date().toISOString(),
    workouts_logged: 4,
    days_active: 5,
  },
  milestone: {
    code: "streak_3",
    message: "Three check-ins logged — consistency beats perfection.",
    streak_count: 3,
  },
  trend: [
    {
      id: "preview-progress-previous",
      image_url: "",
      taken_at: new Date(Date.now() - 14 * 86400000).toISOString(),
      mean_visibility: 0.82,
      ratios: PREVIOUS_RATIOS,
    },
    {
      id: "preview-progress-current",
      image_url: "",
      taken_at: new Date().toISOString(),
      mean_visibility: 0.86,
      ratios: PREVIEW_RATIOS,
    },
  ],
  gamification: {
    streak_count: 3,
    points: 120,
    badges_earned: [],
    last_activity_date: new Date().toISOString(),
    new_badges: [],
  },
};

export function isProgressPreview() {
  return process.env.EXPO_PUBLIC_PROGRESS_PREVIEW === "1";
}

export function seedProgressPreviewDraft() {
  if (!isProgressPreview()) return;
  if (!getProgressDraft()) {
    setProgressDraft({
      ...PREVIEW_PROGRESS,
      local_uri: PLACEHOLDER,
    });
  }
}

export function previewProgressImageUri(which: "current" | "previous") {
  return which === "current" ? PLACEHOLDER : PREVIOUS_PLACEHOLDER;
}
