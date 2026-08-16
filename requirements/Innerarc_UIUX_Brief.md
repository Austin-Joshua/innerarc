**Innerarc**

UI/UX Brief

Prepared by: Tharun P

B.E. Computer Science and Business Systems, Rajalakshmi Institute of
Technology

Version 1.0

**1. Design Principles**

- Motivation over shame: progress is framed around consistency and
  strength, not just appearance — no aggressive before/after language.

- Clarity first: every screen has one primary action; nutrition and
  workout data is shown as trends, not raw numbers alone.

- Calm, not clinical: the visual tone is closer to a wellness app than a
  medical dashboard, even though the underlying data is precise.

- Low-friction logging: food and workout logging should be reachable in
  one or two taps from Home.

- Honesty in the UI: classification confidence is always visible, and
  every AI prediction is editable.

**2. Visual Style Direction**

- Palette: a calm neutral base (off-white / soft grey) with a single
  accent colour for primary actions and progress indicators; avoid
  alarm-coded red/green for calorie surplus or deficit.

- Typography: one clean sans-serif family for the app UI; numerals
  (calories, reps, streaks) can use a slightly heavier weight for
  scannability.

- Imagery: real food and progress photos are the dominant visual
  content; illustration is used sparingly, for empty states and
  onboarding only.

- Motion: subtle transitions for logging confirmations and streak
  updates; nothing that slows down the core logging flow.

**3. Key Screens**

| **Screen**               | **Purpose**                                                                                                                         |
|--------------------------|-------------------------------------------------------------------------------------------------------------------------------------|
| Home dashboard           | Daily calorie/macro summary, today's workout, streak status, and any AI coach nudge, all in one glance.                             |
| Food log / camera        | One-tap photo capture, recognition result with confidence score, editable ingredient and nutrition breakdown.                       |
| Workout library          | Filterable list by modality, level, and goal; clear distinction between individual workouts and multi-week programs.                |
| Session player           | Large timer, current exercise, and next-up preview; minimal chrome so it is usable mid-workout.                                     |
| Progress / photo compare | Side-by-side previous vs. current photo with the ratio trend line beneath it.                                                       |
| AI coach chat            | Conversational interface; proactive nudges appear as distinct message cards, not identical to user-initiated replies.               |
| Profile / settings       | Physical stats, goal, equipment access, connected wearables, and data/privacy controls (including delete photo and delete account). |

**4. Interaction Principles**

- Logging a meal or a workout should never require more than three
  screens from Home.

- Every AI-generated number (calories, ingredients, ratios) is presented
  with a visible "edit" affordance, never as a locked value.

- Positive reinforcement microcopy on streaks and milestones; neutral,
  non-judgemental microcopy on a missed day or a paused streak.

- Proactive AI nudges are dismissible in one tap and never block access
  to the rest of the app.

**5. Accessibility Notes**

- Minimum WCAG AA colour contrast on all text and primary buttons.

- Text scales with system font-size settings without breaking layout on
  the dashboard or session player.

- Progress photos and food photos carry user-editable alt text for
  screen-reader users.

- Timer and workout-session screens pair colour with icon or text cues,
  not colour alone, for state changes.

**6. Responsible Design Notes**

Because this app touches body image and eating habits directly, a few
constraints apply across every screen, not just the Progress module.
Before/after comparisons are shown alongside consistency metrics
(workouts completed, days logged) rather than in isolation, so visual
change is never the only signal of success. The AI coach is constrained
from recommending extreme calorie deficits or excessive training volume
regardless of what the user asks for, and copy throughout the app avoids
language that frames food or missed workouts in moralising terms.
