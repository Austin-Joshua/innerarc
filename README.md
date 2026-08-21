# Innerarc

Closed-loop AI health companion: food recognition, structured workouts, pose-based progress tracking, a retrieval-grounded AI coach, and consistency-based gamification.

**Core tier is implemented** (Modules 1–6). **Modules 7, 9, 10, 11, 12, and 14** are also done (Android Health Connect, proactive coaching, multi-item plate via Gemini Vision, usability instrumentation, shared UI token/component system, system-aware dark theme). **Module 8 (Apple HealthKit)** remains **blocked** — no macOS/Xcode access in this workspace — and is not silently dropped from scope.

## Stack

| Layer | Choice |
| --- | --- |
| Backend + ML inference | Python, FastAPI, PyTorch (EfficientNet-B0), MediaPipe Pose Landmarker |
| Frontend | React Native (Expo, TypeScript) |
| Database | PostgreSQL 16 |
| AI coach | Gemini API (`google-genai`), snapshot retrieval over user logs |
| Nutrition | USDA FoodData Central + IFCT 2017 (seeded) |

## Repository layout

```
backend/        FastAPI app, SQLAlchemy models, Alembic, seeds, smoke scripts
frontend/       Expo React Native app
ml/             Classifier training/eval, IFCT tooling, checkpoints (gitignored)
requirements/   PRD, TRD, schema, app flow, UI/UX, implementation plan
data/photos/    Local object storage for meal/progress images (created at runtime)
```

## What Core includes

| Module | Capability |
| --- | --- |
| 1 | Repo scaffold, full schema migrations, auth/onboarding shell |
| 2 | 27-class dish classifier → recipe ingredients → nutrition dashboard |
| 3 | Tagged workouts/programs, equipment-superset recommend, session logs |
| 4 | Server-side pose → waist-to-hip & shoulder-to-waist; auth-scoped photo fetch |
| 5 | On-demand Gemini coach with log snapshot + safety constraints |
| 6 | Streaks/badges/points from logging events only (not body-change metrics) |
| 7 | Android Health Connect — manual Sync Now for steps, heart rate, sleep |
| 8 | Apple HealthKit (iOS) — **blocked** (requires macOS/Xcode; out of scope until available) |
| 9 | Proactive AI coaching — Home-triggered `GET /coach/nudge`, rate-limited logging-gap / adherence patterns |
| 10 | Multi-item plate recognition — Gemini Vision (`POST /food/classify-plate`); dish-table match; no trained detector |
| 11 | Usability instrumentation — `usability_events` log (screen/task started/completed/abandoned) + `POST /feedback` (1–5 rating + comment); data collection only, not a completed usability study |
| 12 | UI redesign — shared design tokens + component system (NativeWind); calm light palette with blue accent |
| 14 | System-aware dark theme — System/Light/Dark preference, AA-verified dark tokens, charts and screens themed end-to-end |

## Local setup

### Prerequisites

- Docker Desktop
- Python 3.11+
- Node.js 20+

### 1. Environment

```bash
cp .env.example .env
```

Set at least `GEMINI_API_KEY` for the coach. Optionally set `CLASSIFIER_STUB_MODE=false` after you have `ml/checkpoints/best.pt` and checked `ml/reports/test_metrics.json`.

### 2. Database

```bash
docker compose up -d
cd backend
python -m venv .venv

# Windows PowerShell
.\.venv\Scripts\Activate.ps1

# macOS / Linux
# source .venv/bin/activate

pip install -r requirements.txt
alembic upgrade head
```

### 3. Seed data

From `backend/` with the venv active and `PYTHONPATH=.` (Windows: `$env:PYTHONPATH='.'`):

```bash
python -u scripts/seed_food.py
python -u scripts/seed_workouts.py
```

### 4. Pose model (Module 4)

Download the MediaPipe Tasks pose landmarker once (path matches `.env.example`):

```bash
# from repo root, create ml/checkpoints if needed
# URL: https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task
```

Save as `ml/checkpoints/pose_landmarker_lite.task` (directory is gitignored).

### 5. Backend

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Health: [http://localhost:8000/health](http://localhost:8000/health) · Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### 6. Frontend

```bash
cd frontend
npm install
npx expo start
```

Point `EXPO_PUBLIC_API_URL` at your machine if not using the default `http://127.0.0.1:8000`.

### 7. Optional smoke scripts

From `backend/` with `PYTHONPATH=.`:

```bash
python -u scripts/smoke_coach.py
python -u scripts/smoke_gamification.py
python -u scripts/smoke_progress_pose.py
python -u scripts/smoke_wearable.py
python -u scripts/smoke_proactive.py
python -u scripts/smoke_plate.py
python -u scripts/smoke_usability.py
```

Health Connect (Module 7) needs a **custom Android development build** (`expo-dev-client`); it is not available in Expo Go. Use `npx expo run:android` or a prebuilt debug APK on an emulator/device with the Play Store (Health Connect preinstalled or installable).

Apple HealthKit (Module 8) is **blocked** until a macOS/Xcode environment is available; do not treat it as cancelled.

Multi-item plate smoke expects genuine multi-item photos under `backend/scripts/fixtures/plates/` (see `SOURCES.md`). Do not pad with Food-101 single-dish images.

## Schema notes

Migrations follow [requirements/Innerarc_Backend_Schema.md](requirements/Innerarc_Backend_Schema.md), plus:

- `exercises` / `workout_exercises` — session player structure
- `calorie_targets` — daily calorie/macro targets
- `dishes.nutrition_confidence` / `match_coverage_pct` — IFCT coverage tiers
- `usability_events` / `feedback` — instrumentation for a future usability study (Module 11)

`wearable_data` is ingested from **Android Health Connect** via manual Sync Now (`POST /wearable/sync`, `GET /wearable/recent`; source `health_connect`; dedupe on `user_id` + `metric_type` + `recorded_at`). Apple HealthKit remains planned but **blocked** (no macOS/Xcode). Background sync is not built. The `reminders` table exists with no reminder scheduler yet.

Proactive coaching stores nudges in `ai_conversations` with `message = null`, at most one per user per UTC day, triggered by Home `GET /coach/nudge` (not a cron).

Progress photos are **not** served via public StaticFiles. Use authenticated `GET /progress/photos/{id}/image` (404 if not owner).

Usability instrumentation (`POST /usability/events`, `POST /feedback`) is data-collection infrastructure only — it captures `screen_viewed` / `task_started` / `task_completed` / `task_abandoned` events (tagged with an optional `task` + `screen` label) and 1–5 ratings with optional comment. It does not run or analyze a usability study.

## Core constraints (do not regress)

- Ingredient inference is dish-classification then recipe lookup — never pixel-level ingredient detection.
- Progress tracking outputs ratios (and side-by-side compare) from pose landmarks — never body-fat %, BMI, or clinical claims.
- Equipment matching is a **superset** (`none` ⊂ `home_gym` ⊂ `full_gym`), not exact-match only.
- The AI coach must never recommend a deficit beyond the 20% / 1200-kcal floor policy, or training through injury.
- Gamification rewards logging/consistency only — never progress-photo ratio change.

## Specs

Start with [requirements/](requirements/) — PRD, TRD, Backend Schema, App Flow, UI/UX Brief, Implementation Plan (includes actual-vs-planned Core status).
