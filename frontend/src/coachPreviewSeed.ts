export function isCoachPreview() {
  return process.env.EXPO_PUBLIC_COACH_PREVIEW === "1";
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
