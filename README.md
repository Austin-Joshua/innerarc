# Innerarc

Closed-loop AI health companion: food recognition, structured workouts, pose-based progress tracking, and a retrieval-grounded AI coach.

This repository currently contains **Module 1** (repo scaffold + full PostgreSQL schema). Core feature modules are not implemented yet.

## Stack

| Layer | Choice |
| --- | --- |
| Backend + ML inference | Python, FastAPI |
| Frontend | React Native (Expo, TypeScript) |
| Database | PostgreSQL 16 |
| CV/ML (later) | PyTorch, MediaPipe Pose |
| AI coach (later) | Claude API |

## Repository layout

```
backend/     FastAPI app, SQLAlchemy models, Alembic migrations
frontend/    Expo React Native app shell
ml/          Classifier and pose-estimation stubs
requirements/  Product and technical specs
```

## Local setup

### Prerequisites

- Docker Desktop
- Python 3.11+
- Node.js 20+

### 1. Environment

```bash
cp .env.example .env
```

### 2. Database

```bash
docker compose up -d
```

Wait until Postgres is healthy, then apply the schema:

```bash
cd backend
python -m venv .venv

# Windows PowerShell
.\.venv\Scripts\Activate.ps1

# macOS / Linux
# source .venv/bin/activate

pip install -r requirements.txt
alembic upgrade head
```

### 3. Backend

From `backend/` with the venv active:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Health check: [http://localhost:8000/health](http://localhost:8000/health)

### 4. Frontend

```bash
cd frontend
npm install
npx expo start
```

### 5. ML (stubs only)

See [ml/data/README.md](ml/data/README.md). Do not download Food-101 or train a classifier in this module.

## Schema

Migrations implement [requirements/Innerarc_Backend_Schema.md](requirements/Innerarc_Backend_Schema.md), plus three extensions needed by the session player and nutrition dashboard:

- `exercises` / `workout_exercises` — ordered sets, reps or duration, and rest for each workout
- `calorie_targets` — one daily calorie/macro target per user (`calculated` or `ai_adjusted`)

`wearable_data` and `reminders` tables exist because the schema includes them. There is no Health Connect / HealthKit ingestion or reminder-firing code yet (Phase 2 / later).

## Core constraints (do not regress)

- Ingredient inference is dish-classification then recipe lookup — never pixel-level ingredient detection.
- Progress tracking outputs ratios and silhouette comparison from pose landmarks — never body-fat percentage or clinical claims.
- No custom hardware or sensor code. Wearable data is Health Connect / Apple HealthKit only (not in this module).
- The AI coach must never recommend an extreme calorie deficit or excessive training volume (Module 5).
