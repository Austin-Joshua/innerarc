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
five functional modules below implement that loop.

- Food and Nutrition Module — dish classification, ingredient inference,
  calorie and macro tracking.

- Progress Intelligence Module — pose-estimation-based photo analysis
  for ratio and silhouette tracking.

- Workout Engine — tagged content database and rule-based
  program/individual-workout recommender.

- AI Coach — LLM-based assistant with retrieval over the user's own
  logged data, reasoning across all modules.

- Wearable Integration — Health Connect (Android) and Apple HealthKit
  (iOS) data ingestion.

- Gamification Layer — streaks, badges, and milestone logic,
  event-driven off the other four modules.

**2. Technology Stack**

| **Layer**               | **Choice**                                                                     |
|-------------------------|--------------------------------------------------------------------------------|
| Food classifier (CV/ML) | TensorFlow or PyTorch; transfer learning on EfficientNetB0/ResNet50            |
| Pose estimation         | MediaPipe Pose                                                                 |
| Backend                 | FastAPI (Python) or Node.js/Express                                            |
| Frontend                | React Native (mobile) or React (web demo)                                      |
| Database                | PostgreSQL (relational data) with object storage (S3-compatible) for photos    |
| AI coach                | Claude or GPT API, with a retrieval step over the user's own logged data (RAG) |
| Wearable data           | Android Health Connect; Apple HealthKit                                        |
| Nutrition data          | USDA FoodData Central API; IFCT 2017 for Indian dishes                         |

**3. Module-by-Module Technical Breakdown**

**3.1 Food and Nutrition Module**

A CNN classifies the photographed dish against a curated 25–30 class
list built from Food-101 and an Indian food dataset. The predicted dish
is looked up in a recipe/ingredient table to return its typical
ingredients, then mapped to nutrition data from USDA FoodData Central or
IFCT 2017. This is implemented as ingredient inference (dish to known
recipe) rather than pixel-level ingredient detection, which is not
reliable for cooked or mixed dishes. Where a plate has clearly separated
items, a secondary object-detection pass (e.g. YOLO) can identify each
item independently.

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
progress metrics, wearable data) before being sent to the model, so
responses are grounded in the user's actual data rather than generic
advice. In the Phase 2 tier, the coach also runs on a schedule to
proactively surface patterns (adherence drop plus falling protein
intake, for example) rather than only responding to direct questions.

**3.5 Wearable Integration**

Steps, heart rate, sleep, and — on supported devices — blood oxygen are
read through Android Health Connect and Apple HealthKit rather than
through custom hardware. Both platforms aggregate data from whatever
wearable the user already owns (Fitbit, Galaxy Watch, Apple Watch, Mi
Band, and others), so this integration is the practical route to
wearable-backed data without a hardware build.

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
