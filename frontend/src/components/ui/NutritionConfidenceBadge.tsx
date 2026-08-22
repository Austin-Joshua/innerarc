import { Badge } from "./Badge";

/** Warning badge for medium/low dish nutrition confidence; nothing for high. */
export function NutritionConfidenceBadge({
  confidence,
  className = "",
}: {
  confidence: "high" | "medium" | "low" | string | undefined | null;
  className?: string;
}) {
  if (confidence !== "medium" && confidence !== "low") {
    return null;
  }
  return (
    <Badge
      label={`Nutrition confidence: ${confidence} — some ingredients estimated.`}
      tone="warning"
      className={className}
    />
  );
}
