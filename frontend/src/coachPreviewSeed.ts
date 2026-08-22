import { CoachChatResult } from "./api";

export function isCoachPreview() {
  return process.env.EXPO_PUBLIC_COACH_PREVIEW === "1";
}

export function previewCoachReply(message: string): CoachChatResult {
  return {
    id: `preview-${Date.now()}`,
    message,
    response:
      "You logged protein at lunch on 4 of 7 days. Adding a morning source on rest days would close the gap without changing dinner.",
    created_at: new Date().toISOString(),
    snapshot_summary: {
      data_sufficiency: "preview",
      food_log_count: 4,
      workout_log_count: 3,
      has_calorie_target: true,
      has_progress_ratios: false,
    },
    safety_precheck_blocked: false,
  };
}

export const PREVIEW_COACH_BUBBLES = [
  {
    key: "preview-u1",
    role: "user" as const,
    text: "How did my protein intake look this week?",
  },
  {
    key: "preview-c1",
    role: "coach" as const,
    text: "You logged protein at lunch on 4 of 7 days. Adding a morning source on rest days would close the gap without changing dinner.",
  },
];
