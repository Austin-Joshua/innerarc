**Innerarc**

App Flow Document

Prepared by: Tharun P

B.E. Computer Science and Business Systems, Rajalakshmi Institute of
Technology

Version 1.0

**1. Flow Map**

Innerarc has five primary user flows, all reachable from the Home
dashboard: Onboarding (once), Food Logging, Workout, Progress Check-in,
and AI Coach. Each is detailed below as a numbered sequence of screens
and actions.

**2. Flow A — Onboarding**

| **Step** | **Screen**              | **Action / transition**                                                                                            |
|----------|-------------------------|--------------------------------------------------------------------------------------------------------------------|
| 1        | Splash                  | App opens, checks for an existing session.                                                                         |
| 2        | Sign up / Login         | New user creates an account; returning user logs in.                                                               |
| 3        | Physical stats and goal | User enters height, weight, and selects a goal (fat loss, muscle gain, recomposition, endurance, general fitness). |
| 4        | Calibration input       | User enters biological sex and activity level, used only to set starting recommendation parameters.                |
| 5        | Equipment access        | User selects available equipment (none, home gym, full gym) to filter the workout library.                         |
| 6        | Home dashboard          | Onboarding completes; user lands on the central dashboard.                                                         |

**3. Flow B — Food Logging**

| **Step** | **Screen**          | **Action / transition**                                                                       |
|----------|---------------------|-----------------------------------------------------------------------------------------------|
| 1        | Home                | User taps "Log meal".                                                                         |
| 2        | Camera / upload     | User photographs a meal or selects an existing photo.                                         |
| 3        | Recognition result  | Classifier returns the predicted dish with a confidence score and an "edit" option if wrong.  |
| 4        | Nutrition breakdown | App shows inferred ingredients, calories, and macros for the confirmed dish and serving size. |
| 5        | Add to log          | User confirms; entry is added to the daily log.                                               |
| 6        | Dashboard update    | Daily calorie and macro totals update on the Home dashboard.                                  |

**4. Flow C — Workout**

| **Step** | **Screen**       | **Action / transition**                                                                      |
|----------|------------------|----------------------------------------------------------------------------------------------|
| 1        | Home             | User taps "Workouts".                                                                        |
| 2        | Filter           | User filters by modality, level, and goal (equipment access is pre-applied from onboarding). |
| 3        | Selection        | User chooses an individual workout or a structured multi-week program.                       |
| 4        | Session player   | Active session screen with set/rep timer guides the user through the workout.                |
| 5        | Completion       | User marks the session complete; duration and estimated calories burned are logged.          |
| 6        | Dashboard update | Workout log updates on Home and feeds the Progress and Gamification modules.                 |

**5. Flow D — Progress Check-in**

| **Step** | **Screen**      | **Action / transition**                                                                   |
|----------|-----------------|-------------------------------------------------------------------------------------------|
| 1        | Home            | User taps "Progress".                                                                     |
| 2        | Upload photo    | User captures or uploads a new progress photo.                                            |
| 3        | Processing      | Pose estimation extracts landmarks and computes ratio changes against the previous photo. |
| 4        | Comparison view | Side-by-side previous vs. current photo, with the ratio trend line.                       |
| 5        | Milestone check | If a consistency or trend milestone is met, a badge is awarded (Gamification Layer).      |

**6. Flow E — AI Coach**

| **Step** | **Screen**                | **Action / transition**                                                                                                               |
|----------|---------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| 1        | Home or push notification | User opens the Coach tab, or receives a proactive nudge based on a detected pattern.                                                  |
| 2        | Chat                      | User asks a question, or reviews the proactive message (for example, adherence dropping alongside falling protein intake).            |
| 3        | Grounded response         | Coach responds using a snapshot of the user's own logged data, not generic advice.                                                    |
| 4        | Suggested action          | Where relevant, the coach offers a concrete action (for example, adjust today's calorie target), which the user accepts or dismisses. |

**7. Cross-Flow Notes**

- All five flows write to the same underlying user record, which is what
  allows the AI Coach in Flow E to reason across food, workout, and
  progress data from Flows B, C, and D.

- Wearable data (Health Connect / Apple HealthKit) syncs in the
  background and is not a user-initiated flow; it updates the Home
  dashboard and is available to the AI Coach the same way logged data
  is.

- Reminders (for logging a meal, completing a scheduled workout, or
  taking a progress photo) can trigger Flow B, C, or D directly from a
  notification.
