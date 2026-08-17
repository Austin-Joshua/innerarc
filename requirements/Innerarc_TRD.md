**Innerarc**

Technical Requirements Document (TRD)

Prepared by: Tharun P

B.E. Computer Science and Business Systems, Rajalakshmi Institute of
Technology

Version 1.0

**1. System Architecture Overview**

Innerarc is organised around a closed loop: four input streams (food
photos, progress photos, workout logs, and wearable data) feed a central
AI health engine, which produces two outputs (a personalized daily plan
and a progress dashboard) that in turn shape the next day's inputs. The
functional modules below implement that loop.

**Core (implemented in this repository)**

- Food and Nutrition Module — dish classification, ingredient inference,
  calorie and macro tracking; plus multi-item plate recognition via
  Gemini Vision (user-toggled), mapping each item to the dishes table
  (unmatched items flagged; nutrition never invented by the model).

- Workout Engine — tagged content database and rule-based
  program/individual-workout recommender.

- Progress Intelligence Module — pose-estimation-based photo analysis
  for ratio and side-by-side tracking (not body-fat %).

- AI Coach — on-demand LLM assistant with retrieval over the user's own
  logged data (Gemini), with hard safety constraints on deficit and
  training volume; plus proactive Home-triggered nudges (logging gap /
  adherence+progress patterns, rate-limited in `ai_conversations`).

- Gamification Layer — streaks, badges, and points, event-driven off
  logging/completion events only (not visual body-change metrics).

- Wearable Integration (Android) — Health Connect manual Sync Now for
  steps, heart rate, and sleep into `wearable_data` (no background sync;
  not wired into the AI coach snapshot yet).

**Phase 2 / remaining**

- Apple HealthKit (iOS) wearable ingestion — **explicitly blocked** in
  this workspace (no macOS/Xcode); remains in scope, not cancelled.

**2. Technology Stack**

| **Layer**               | **Choice**                                                                     |
|-------------------------|--------------------------------------------------------------------------------|
| Food classifier (CV/ML) | TensorFlow or PyTorch; transfer learning on EfficientNetB0/ResNet50            |
| Pose estimation         | MediaPipe Pose                                                                 |
| Backend                 | FastAPI (Python) or Node.js/Express                                            |
| Frontend                | React Native (mobile) or React (web demo)                                      |
| Database                | PostgreSQL (relational data) with object storage (S3-compatible) for photos    |
| AI coach                | Gemini API (`google-genai`), with a retrieval step over the user's own logged data |
| Wearable data           | Android Health Connect (done); Apple HealthKit (blocked: no macOS/Xcode)       |
| Proactive AI coaching   | Done — Home `GET /coach/nudge`, not cron; logging-gap + adherence+progress     |
| Multi-item plate        | Done — Gemini Vision (user toggle); dish-table match; no trained detector      |
| Nutrition data          | USDA FoodData Central API; IFCT 2017 for Indian dishes                             |

**3. Module-by-Module Technical Breakdown**

**3.1 Food and Nutrition Module**

A CNN classifies the photographed dish against a curated 25–30 class
list built from Food-101 and an Indian food dataset. The predicted dish
is looked up in a recipe/ingredient table to return its typical
ingredients, then mapped to nutrition data from USDA FoodData Central or
IFCT 2017. This is implemented as ingredient inference (dish to known
recipe) rather than pixel-level ingredient detection, which is not
reliable for cooked or mixed dishes. For multi-item plates, a
user-toggled Gemini Vision path (`POST /food/classify-plate`) lists
distinct visible items with portion size; each label is matched to the
dishes table (unmatched items are flagged, not forced). Nutrition still
comes only from the recipe/nutrition pipeline — never invented by the
vision model. A custom-trained object detector remains out of scope
until labeled multi-item data exists.

**3.2 Progress Intelligence Module**

MediaPipe Pose extracts body landmarks from a user-submitted photo. From
these landmarks the module computes relative ratios (waist-to-hip,
shoulder-to-waist) and stores them alongside a downsized copy of the
photo for a before/after comparison view. The module explicitly does not
claim to compute body-fat percentage; that framing is a defined non-goal
(see PRD, Section 10).

**3.3 Workout Engine**

Every workout and program is tagged along four axes: modality
(bodyweight, weighted, home gym, yoga, aerobics), level
(beginner/intermediate/advanced), goal (fat loss, muscle gain,
recomposition, endurance, general fitness), and calibration inputs
(biological sex, body stats) used to set starting parameters such as
baseline load and calorie range. Calibration adjusts recommended
starting values only — it does not restrict which content a user can
access. The recommender is a filtered query against this tagged
database, not a machine-learning model.

**3.4 AI Coach**

The coach is a retrieval-augmented LLM assistant: each query is
augmented with a snapshot of the user's recent logs (meals, workouts,
progress metrics, and — when available — wearable data) before being
sent to the model, so responses are grounded in the user's actual data
rather than generic advice. **Core** ships on-demand chat (Gemini) with
hard constraints on calorie deficit and training volume. **Proactive
coaching is also done:** Home focus calls `GET /coach/nudge` (not a
cron). Patterns are a logging gap (3+ quiet days) and adherence+progress
(0 workouts this week vs ≥3/week prior average, gated internally by
flat/declining pose ratios when ≥2 photos exist). Nudges reuse the same
snapshot + safety path as chat; adherence prompts describe behavior only,
never body appearance or ratio trends.

**3.5 Wearable Integration**

**Implemented (Android):** steps, heart rate, and sleep are read through
Health Connect on a manual Sync Now path (custom Expo development
client; not Expo Go). Readings upsert into `wearable_data` with
`source = health_connect`, deduped on `(user_id, metric_type,
recorded_at)`. SpO2 is not specially chased. Background sync and wiring
into the AI coach snapshot are deferred.

**Blocked (not cancelled):** Apple HealthKit (iOS) — requires macOS and
Xcode; this Windows workspace cannot complete Module 8. Both platforms
remain the intended long-term route to aggregate data from whatever
wearable the user already owns, without custom hardware.

**3.6 Gamification Layer**

Streaks, badges, and points are computed from events emitted by the
other modules (a meal logged, a workout completed, a progress photo
uploaded) rather than being a separate data source. Milestones are tied
to consistency metrics as well as visual progress, per the
responsible-design requirement in the PRD.

**4. Data Flow**

- Capture: user submits a food photo, a progress photo, a workout
  completion, or wearable data syncs in the background.

- Processing: the relevant module (classifier, pose estimation, or
  direct ingestion) converts the capture into structured data.

- Storage: structured data is written to PostgreSQL; raw photos are
  written to object storage with a reference stored in PostgreSQL.

- Aggregation: the AI coach and dashboard read structured data across
  all modules for the current user.

- Output: the dashboard renders trends and the AI coach returns grounded
  recommendations, which feed back into the next day's plan.

**5. Non-Functional Technical Requirements**

| **Requirement**              | **Target**                                                                |
|------------------------------|---------------------------------------------------------------------------|
| Dish classification accuracy | ≥ 85% top-1 on the curated dish list (Core scope)                         |
| Classification latency       | Result returned within a few seconds of photo capture                     |
| Data encryption              | Photos and personal data encrypted at rest and in transit                 |
| Availability                 | Core logging flows usable offline with sync on reconnect                  |
| Scalability                  | Stateless backend services so instances can scale horizontally under load |

**6. Third-Party Dependencies**

- USDA FoodData Central API — nutrition data for international dishes.

- IFCT 2017 (ICMR-National Institute of Nutrition) — nutrition data for
  Indian dishes.

- Android Health Connect and Apple HealthKit — wearable data
  aggregation.

- Claude or GPT API — the AI coach's underlying language model.

- Food-101 and an Indian food classification dataset — training data for
  the dish classifier.

**7. Privacy and Data Handling**

Meal photos and progress photos are the most sensitive data this system
handles. Both are stored encrypted, are never used for anything beyond
the user's own tracking without explicit opt-in, and the user has a
clear, discoverable option to delete any photo or their entire account's
data. Progress photos in particular should be stored with access scoped
strictly to the owning user, since they are body images.
