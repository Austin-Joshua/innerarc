# Innerarc — build kickoff prompt

Paste everything below into Cursor's chat/composer with this `innerarc/` folder open as the workspace.

---

You are helping me build **Innerarc**, a closed-loop AI health app that unifies food recognition, structured fitness programming, and image-based body-progress tracking, with an AI coach that reasons across all three instead of treating them as separate features.

## Step 1 — read the requirements before writing any code

Read these files in `requirements/` in this order, they build on each other:

1. `Innerarc_PRD.md` — problem statement, target users, and the Core / Phase 2 / Future feature tiers
2. `Innerarc_TRD.md` — architecture, tech stack, and the technical approach for each module
3. `Innerarc_Backend_Schema.md` — the exact database schema to implement
4. `Innerarc_App_Flow.md` — the five user flows (onboarding, food logging, workout, progress check-in, AI coach)
5. `Innerarc_UIUX_Brief.md` — design principles and key screens
6. `Innerarc_Implementation_Plan.md` — phased build order and week-by-week milestones

Use the `.md` versions, not the `.docx` versions — the `.docx` files are the formatted deliverables for my report, the `.md` files are the same content in plain text for you to actually read.

## Step 2 — confirm the stack before scaffolding

The TRD leaves backend framework and mobile framework as either/or choices. Default to this unless I say otherwise:

- Backend + ML inference: Python, FastAPI (one language across backend and ML keeps the food-classifier and pose-estimation code in the same service instead of splitting across a Node backend and a separate Python ML service)
- Frontend: React Native
- Database: PostgreSQL
- CV/ML: PyTorch, MediaPipe Pose
- AI coach: Claude API, with a retrieval step over the user's own logged data

If you'd pick differently given the requirements docs, tell me why before scaffolding — don't just proceed silently on a different stack.

## Step 3 — build Core tier only, in this order

Do not touch anything under "Phase 2" or "Future scope" in the PRD yet. Build, in order:

1. Repo scaffold: `backend/`, `frontend/`, `ml/` as top-level folders, plus the database migrations for the full schema in `Innerarc_Backend_Schema.md`
2. Food and Nutrition module end to end (classifier → recipe-based ingredient inference → nutrition dashboard) — this comes first because the AI coach's retrieval step needs real logged data to work against
3. Workout Engine (tagged database + recommender)
4. Progress Intelligence (pose estimation → ratios)
5. AI Coach (retrieval-augmented, grounded in modules 2–4's data)
6. Gamification layer

## Hard constraints — do not deviate from these

- Ingredient inference is dish-classification-then-recipe-lookup. Never attempt pixel-level ingredient detection from the photo itself.
- Progress tracking outputs ratios and silhouette comparison from pose landmarks. It must never compute or display a body-fat percentage or any clinical claim.
- No custom hardware or sensor code, anywhere. Wearable data is Health Connect (Android) / Apple HealthKit (iOS) integration only.
- Match `Innerarc_Backend_Schema.md` exactly — table names, fields, relationships as written there, not a reinterpretation.
- The AI coach must never be able to recommend an extreme calorie deficit or excessive training volume, regardless of what a user asks it for (see UI/UX Brief, Responsible Design Notes).

## Working style

- After each module in Step 3, stop and summarize what you built against the relevant section of the requirements docs, so I can confirm before you continue to the next one.
- If anything across the six documents is ambiguous, contradictory, or missing a detail you need, ask me — don't guess and keep going.
- Follow the week-by-week order in `Innerarc_Implementation_Plan.md` if I ask you to plan out sessions rather than build everything in one pass.
