import { GamificationState } from "../api";
import { RecentActivityItem } from "../homePreviewSeed";
import { REPORT_HERO, REPORT_ICONS, ReportIcon } from "./reportAssets";

export type ReportInsight = { label: string; value: string };

export type HomeReport = {
  id: string;
  category: string;
  headlineLabel: string;
  headlineValue: string;
  body: string;
  aiAnalysis: string;
  insights: ReportInsight[];
  heroImage: string;
  icon: ReportIcon;
};

function build(
  id: string,
  category: string,
  headlineLabel: string,
  headlineValue: string,
  body: string,
  aiAnalysis: string,
  insights: ReportInsight[],
  heroImage: string,
  icon: ReportIcon,
): HomeReport {
  return {
    id,
    category,
    headlineLabel,
    headlineValue,
    body,
    aiAnalysis,
    insights,
    heroImage,
    icon,
  };
}

export function dayCalorieReport(
  day: string,
  calories: number,
  target: number,
): HomeReport {
  const diff = calories - target;
  const onTarget = Math.abs(diff) <= target * 0.05;
  const pct = Math.round((calories / target) * 100);

  const body = onTarget
    ? `${day} landed near your ${target.toLocaleString()} kcal target. Meals were spaced evenly with balanced portions across breakfast, lunch, and dinner.`
    : diff > 0
      ? `${day} ran ${diff.toLocaleString()} kcal above target — mostly from a larger dinner and an evening snack.`
      : `${day} was ${Math.abs(diff).toLocaleString()} kcal under target with lighter lunch and an earlier dinner.`;

  const aiAnalysis = onTarget
    ? "Intake pattern supports stable energy and recovery. Protein distribution across meals looks adequate for muscle maintenance."
    : diff > 0
      ? "One higher day does not undo weekly progress. Return to regular meal timing tomorrow to keep your rolling average on track."
      : "Lighter days can balance higher ones across the week. Ensure protein stays above 100 g so recovery is not affected.";

  return build(
    `day-${day.toLowerCase()}`,
    `${day.toUpperCase()} NUTRITION`,
    `Calories logged on ${day}`,
    `${calories.toLocaleString()} kcal`,
    body,
    aiAnalysis,
    [
      { label: "Target", value: `${target.toLocaleString()} kcal` },
      { label: "Vs target", value: `${pct}%` },
      { label: "Protein", value: day === "Sun" ? "118 g" : "92 g" },
      { label: "Meals", value: day === "Sun" ? "4 logged" : "3 logged" },
    ],
    REPORT_HERO.caloriesDay,
    REPORT_ICONS.caloriesDay,
  );
}

export function macroReport(data: {
  logged: number;
  target: number;
  remaining: number;
  meals: number;
  protein?: number;
  proteinTarget?: number;
}): HomeReport {
  const protein = data.protein ?? 118;
  const proteinTarget = data.proteinTarget ?? 150;

  return build(
    "macro",
    "DAILY MACROS",
    "Calories logged today",
    `${Math.round(data.logged).toLocaleString()} kcal`,
    `Protein, carbs, and fat drive your calorie total. With ${data.meals} meals logged, you have ${Math.round(data.remaining).toLocaleString()} kcal remaining in today's budget.`,
    `Protein is at ${protein} g of ${proteinTarget} g — on track for recovery. Carbs have room at dinner without overshooting calories if portions stay moderate.`,
    [
      { label: "Remaining", value: `${Math.round(data.remaining)} kcal` },
      { label: "Protein", value: `${protein} / ${proteinTarget} g` },
      { label: "Meals", value: `${data.meals}` },
      { label: "Target", value: `${Math.round(data.target)} kcal` },
    ],
    REPORT_HERO.nutrition,
    REPORT_ICONS.nutrition,
  );
}

export function stepsReport(steps: number, goal = 10_000): HomeReport {
  const pct = goal > 0 ? Math.round((steps / goal) * 100) : 0;
  return build(
    "vital-steps",
    "STEPS",
    "Current step count",
    steps > 0 ? steps.toLocaleString() : "—",
    "Daily steps capture all movement — walking, stairs, and errands — not just structured workouts. Consistency across the week matters more than hitting 10,000 every single day.",
    pct >= 80
      ? "You are close to your daily goal. An evening walk of 15–20 minutes would likely close the remaining gap."
      : "Activity is below your typical goal. Short walks after meals are an easy way to add steps without changing your routine.",
    [
      { label: "Goal progress", value: `${pct}%` },
      { label: "Distance est.", value: "6.1 km" },
      { label: "Peak window", value: "5–7 PM" },
      { label: "Daily goal", value: goal.toLocaleString() },
    ],
    REPORT_HERO.steps,
    REPORT_ICONS.steps,
  );
}

export function heartRateReport(bpm: number): HomeReport {
  return build(
    "vital-heart-rate",
    "HEART RATE",
    "Current heart rate",
    bpm > 0 ? `${Math.round(bpm)} bpm` : "—",
    "Heart rate reflects how hard your cardiovascular system is working — at rest and during activity. Steady rhythm during light activity usually indicates good fitness.",
    bpm > 0
      ? "Reading sits in the fat-burn zone for light activity. No unusual spikes detected in today's rhythm window."
      : "Sync your wearable to see live heart rate on this dashboard.",
    [
      { label: "Zone", value: "Fat burn" },
      { label: "Peak today", value: "142 bpm" },
      { label: "Source", value: "Wearable sync" },
      { label: "Status", value: "Steady" },
    ],
    REPORT_HERO.heartRate,
    REPORT_ICONS.heartRate,
  );
}

export function restingHrReport(bpm: number): HomeReport {
  return build(
    "vital-resting-hr",
    "RESTING HR",
    "Overnight average",
    `${bpm} bpm`,
    "Resting heart rate is measured when you are still — often overnight. Lower, stable values generally reflect better aerobic fitness and recovery.",
    "Overnight average is stable vs your 7-day trend. This is a positive recovery signal for tomorrow's training load.",
    [
      { label: "7-day avg", value: "66 bpm" },
      { label: "Trend", value: "Stable" },
      { label: "Source", value: "Overnight sync" },
      { label: "Recovery", value: "Good" },
    ],
    REPORT_HERO.restingHr,
    REPORT_ICONS.restingHr,
  );
}

export function bloodPressureReport(systolic: number, diastolic: number): HomeReport {
  return build(
    "vital-blood-pressure",
    "BLOOD PRESSURE",
    "Latest reading",
    `${systolic}/${diastolic} mmHg`,
    "Blood pressure is the force of blood against artery walls. Readings in the normal range suggest healthy circulation during daily activity and rest.",
    "Systolic and diastolic values are within normal range. Continue regular monitoring, especially after intense training sessions.",
    [
      { label: "Systolic", value: `${systolic} mmHg` },
      { label: "Diastolic", value: `${diastolic} mmHg` },
      { label: "Classification", value: "Normal" },
      { label: "Monitor", value: "Weekly" },
    ],
    REPORT_HERO.bloodPressure,
    REPORT_ICONS.bloodPressure,
  );
}

export function sleepReport(hours: number, goal = 8): HomeReport {
  return build(
    "vital-sleep",
    "SLEEP",
    "Last night's duration",
    hours > 0 ? `${hours.toFixed(1)} h` : "—",
    "Sleep is when muscle repair, memory consolidation, and appetite regulation happen. Most adults benefit from seven to nine hours per night.",
    hours >= goal - 0.5
      ? "Duration is close to your 8-hour goal with balanced deep and REM phases. Recovery supports tomorrow's training intensity."
      : "You are slightly under your sleep goal. A fixed wake time — even on weekends — stabilizes rhythm faster than shifting bedtime alone.",
    [
      { label: "Goal", value: `${goal} h` },
      { label: "Deep sleep", value: "1.4 h" },
      { label: "Sleep score", value: "82 / 100" },
      { label: "Bedtime", value: "11:04 PM" },
    ],
    REPORT_HERO.sleep,
    REPORT_ICONS.sleep,
  );
}

const ACTIVITY_REPORTS: Record<
  RecentActivityItem["icon"],
  (item: RecentActivityItem) => HomeReport
> = {
  barbell: (item) =>
    build(
      `activity-${item.id}`,
      "WORKOUT",
      item.title,
      item.stat,
      "Full-body strength built around compound movements — squats and hinges for lower body, push and pull for upper body, plus a core finisher. Rest periods stayed consistent for quality over volume.",
      "This session supports weekly strength goals and muscle retention during a calorie deficit. Schedule at least one rest day before the next heavy lift.",
      [
        { label: "Focus", value: "Full body" },
        { label: "Intensity", value: "Moderate" },
        { label: "Exercises", value: "8 completed" },
        { label: "Next", value: "Rest or light walk" },
      ],
      REPORT_HERO.workout,
      REPORT_ICONS.workout,
    ),
  restaurant: (item) =>
    build(
      `activity-${item.id}`,
      "MEAL LOG",
      item.title,
      item.stat,
      "Logged via photo — grilled chicken on mixed greens with dressing on the side. Photo capture estimated calories and macros without manual entry.",
      "High-protein lunch choice that supports satiety and leaves room in your calorie budget for the rest of the day.",
      [
        { label: "Confidence", value: "88%" },
        { label: "Meal type", value: "Lunch" },
        { label: "Protein", value: "42 g" },
        { label: "Tip", value: "Dressing on side" },
      ],
      REPORT_HERO.meal,
      REPORT_ICONS.meal,
    ),
  walk: (item) =>
    build(
      `activity-${item.id}`,
      "MOVEMENT",
      item.title,
      item.stat,
      "Most movement came from everyday activity — commuting, errands, and an evening walk — rather than a dedicated workout block.",
      "Wearable sync captured this automatically. A 10–15 minute walk after meals can improve digestion and close step gaps on low days.",
      [
        { label: "Distance", value: "6.1 km" },
        { label: "Goal", value: "84%" },
        { label: "Source", value: "Health Connect" },
        { label: "Peak", value: "Evening" },
      ],
      REPORT_HERO.walk,
      REPORT_ICONS.walk,
    ),
  moon: (item) =>
    build(
      `activity-${item.id}`,
      "SLEEP",
      item.title,
      item.stat,
      "Sleep duration and stage balance from last night. Deep and REM phases support recovery, memory, and appetite regulation.",
      "Slightly under 8 hours but with good stage distribution. Keep wake time consistent to improve sleep efficiency over the next week.",
      [
        { label: "Score", value: "82 / 100" },
        { label: "Deep", value: "1.4 h" },
        { label: "REM", value: "1.8 h" },
        { label: "Wake", value: "6:16 AM" },
      ],
      REPORT_HERO.sleep,
      REPORT_ICONS.sleep,
    ),
  camera: (item) =>
    build(
      `activity-${item.id}`,
      "PROGRESS",
      item.title,
      item.stat,
      "Progress photos reveal visual change the scale misses — posture, definition, and how clothes fit. Consistent pose and lighting make comparisons fair.",
      "Waist-to-hip ratio is stable vs your last check-in. Compare side-by-side in Progress every 2–3 weeks for the clearest trend.",
      [
        { label: "Confidence", value: "91%" },
        { label: "Waist-hip", value: "0.842" },
        { label: "Vs last", value: "Stable" },
        { label: "Compare", value: "Progress tab" },
      ],
      REPORT_HERO.progress,
      REPORT_ICONS.progress,
    ),
};

export function activityReport(item: RecentActivityItem): HomeReport {
  return ACTIVITY_REPORTS[item.icon](item);
}

export function mealEntryReport(entry: {
  dish_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence_score: number;
  serving_size_g: number;
}): HomeReport {
  return build(
    `meal-${entry.dish_name}`,
    "MEAL LOG",
    entry.dish_name,
    `${entry.calories} kcal`,
    `Logged at ~${entry.serving_size_g} g via photo capture. Estimates work best when the full plate is visible with even lighting.`,
    entry.protein >= 30
      ? "Strong protein source — contributes meaningfully to your daily target without extra snacks."
      : "Moderate protein — pair with a protein side at your next meal to balance the day.",
    [
      { label: "Protein", value: `${entry.protein} g` },
      { label: "Carbs", value: `${entry.carbs} g` },
      { label: "Fat", value: `${entry.fat} g` },
      { label: "Confidence", value: `${Math.round(entry.confidence_score * 100)}%` },
    ],
    REPORT_HERO.meal,
    REPORT_ICONS.meal,
  );
}

export function streakReport(g: GamificationState): HomeReport {
  return build(
    "streak",
    "STREAK",
    "Active streak",
    `${g.streak_count} days`,
    "A streak counts consecutive days you log at least one meal or workout. It builds the habit of checking in — not a measure of perfection.",
    g.streak_count > 0
      ? "Log anything today — even a snack — to keep your streak alive. Consistency over the last week is driving your points total."
      : "Log your next meal to start a new streak. Small daily actions compound into lasting habits.",
    [
      { label: "This week", value: "5 / 7 days" },
      { label: "Best", value: "12 days" },
      { label: "Resets", value: "After 1 missed day" },
      { label: "Counts", value: "Meals · workouts" },
    ],
    REPORT_HERO.streak,
    REPORT_ICONS.streak,
  );
}

export function pointsReport(g: GamificationState): HomeReport {
  return build(
    "points",
    "POINTS",
    "Total points",
    g.points.toLocaleString(),
    "Points reward consistent engagement — logging meals, finishing workouts, hitting streak milestones, and earning badges.",
    `You have earned ${g.badges_earned.length} badge${g.badges_earned.length === 1 ? "" : "s"}. Badges mark meaningful moments like your first logged week or a sustained streak.`,
    [
      { label: "Badges", value: `${g.badges_earned.length}` },
      { label: "Streak pts", value: "+120" },
      { label: "Meal pts", value: "+840" },
      { label: "Workout pts", value: "+280" },
    ],
    REPORT_HERO.points,
    REPORT_ICONS.points,
  );
}

export function mealsInsightReport(mealCount: number): HomeReport {
  return build(
    "meals-insight",
    "MEALS",
    "Logged today",
    `${mealCount}`,
    "Photo logging closes the gap between what you think you ate and what you actually ate. Even two of three meals gives a useful daily picture.",
    "Log right after eating while portions are still visible. Average confidence on today's entries is 94%.",
    [
      { label: "Avg confidence", value: "94%" },
      { label: "Method", value: "Photo capture" },
      { label: "Target", value: "3–4 / day" },
      { label: "Edit", value: "Tap any meal" },
    ],
    REPORT_HERO.meal,
    REPORT_ICONS.meal,
  );
}

export function workoutsInsightReport(count: number): HomeReport {
  return build(
    "workouts-insight",
    "WORKOUTS",
    "Sessions this week",
    `${count}`,
    "Strength training 2–3× per week preserves muscle, supports metabolism, and complements nutrition tracking.",
    "Full-body sessions hit every major group efficiently. Allow at least one recovery day between heavy strength days.",
    [
      { label: "Latest", value: "Full-body strength" },
      { label: "Duration", value: "42 min" },
      { label: "Weekly goal", value: "3 sessions" },
      { label: "Next", value: "Rest or walk" },
    ],
    REPORT_HERO.workout,
    REPORT_ICONS.workout,
  );
}
