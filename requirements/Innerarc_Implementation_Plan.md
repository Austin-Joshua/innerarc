**Innerarc**

Implementation Plan

Prepared by: Tharun P

B.E. Computer Science and Business Systems, Rajalakshmi Institute of
Technology

Version 1.0

**1. Planning Assumption**

This plan assumes a single academic semester of roughly 12 working
weeks. Where the actual timeline differs, the week numbers below should
be rescaled proportionally; the milestone order should stay the same,
since later milestones depend on earlier ones (the AI Coach needs logged
data to reason over, so it is sequenced after logging is working).

**1.1 Actual Core build status (post-implementation)**

As of the completed Core implementation, the following are **built and
demoable**. Phase 2 remains optional enhancement, not required for the
Core pitch.

| **Core module** | **Status** | **Notes vs original week plan** |
|-----------------|------------|----------------------------------|
| Scaffold + full schema + auth/onboarding | Done | Corresponds to weeks 1 + 7 (schema early, dashboard with food). |
| Food and Nutrition (classifier, USDA/IFCT, dashboard) | Done | Weeks 2–4; 27-class EfficientNet-B0; confidence tiers on IFCT coverage. |
| Workout Engine (library, recommend, session, logs) | Done | Week 5; equipment filter is a tier **superset**, not exact match. |
| Progress Intelligence (pose, ratios, compare) | Done | Week 6; auth-scoped photo fetch; no body-fat claims. |
| AI Coach (on-demand, snapshot-grounded Gemini) | Done | Week 8; proactive/scheduled coaching deferred to Phase 2. |
| Gamification (streaks, badges, points on logging events) | Done | Week 9 gamification only; **basic reminders not implemented** (table exists). |

**Not in Core (Phase 2 / later):** multi-item plate segmentation, Health
Connect / HealthKit ingestion, proactive AI coaching, reminder-firing
engine, custom hardware.

The planned week table in Section 3 remains the original schedule. Use
Section 1.1 when writing the report’s Implementation “what was actually
delivered” narrative so module counts and demo claims match the repo.

**2. Phased Roadmap**

| **Tier**     | **Scope**                                                                                                                                                                                       |
|--------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Core         | Dish classifier and nutrition dashboard; tagged workout database and recommender; pose-estimation progress tracking; AI coach with retrieval over logged data; gamification; central dashboard. |
| Phase 2      | Multi-item plate segmentation; Health Connect wearable integration; proactive (not just on-demand) AI coaching.                                                                                 |
| Future scope | Custom hardware wearable; clinical-grade SpO2/BP; multi-cuisine expansion; full habit-coaching reminders engine.                                                                                |

**3. Week-by-Week Milestones**

| **Week** | **Milestone**              | **Deliverable**                                                                            |
|----------|----------------------------|--------------------------------------------------------------------------------------------|
| 1        | Setup and data collection  | Repo, environments, and datasets (Food-101, Indian food dataset, curated dish list) ready. |
| 2–3      | Food classifier v1         | CNN trained via transfer learning; ≥ 85% top-1 accuracy on the curated dish list.          |
| 4        | Nutrition mapping          | Dish-to-ingredient-to-nutrition pipeline (USDA + IFCT 2017) working end to end.            |
| 5        | Workout database           | Tagged workout and program database live; filter/recommend logic working.                  |
| 6        | Progress intelligence v1   | MediaPipe pose pipeline extracting landmarks and computing ratios from a photo.            |
| 7        | Core backend and dashboard | Backend schema (Section 6 of the TRD) implemented; dashboard renders logged data.          |
| 8        | AI coach v1                | LLM integration with retrieval over the user's logged data; answers grounded questions.    |
| 9        | Gamification and reminders | Streaks, badges, and basic reminders wired to the logging events.                          |
| 10       | Phase 2 (if time allows)   | Health Connect integration for real steps/heart rate/sleep.                                |
| 11       | Testing and polish         | Bug fixes, UI polish, accuracy validation pass.                                            |
| 12       | Report and demo            | Final report, recorded or live demo, presentation.                                         |

*Actual delivery:* Core modules through gamification are complete (see
Section 1.1). Week 9 **reminders** and weeks 10+ Phase 2 items were not
required for Core and remain optional.

**4. Environment and Tooling Setup**

- ML: Python, TensorFlow or PyTorch, a GPU-enabled environment (local
  GPU or a free-tier cloud notebook) for training the classifier.

- Backend: FastAPI, PostgreSQL, local object-storage path for photos
  (authenticated progress-photo fetch; not a public static mount).

- Frontend: React Native (Expo).

- AI coach: Gemini API key, plus a snapshot retrieval step over the
  PostgreSQL logs (on-demand chat in Core).

- Version control: a single Git repository with the ML pipeline,
  backend, and frontend as separate top-level folders.

**5. Testing Approach**

- Classifier accuracy: held-out test split reported as top-1 and top-3
  accuracy per dish class, not just an aggregate number.

- Nutrition calculation: unit tests on the dish-to-nutrition mapping
  against manually verified values for a sample of dishes.

- Workout recommender: test that every combination of modality, level,
  goal, and equipment access returns at least one result.

- Progress ratios: sanity-check computed ratios against manual
  measurement on a small sample of test photos.

- Usability: a short informal user test (5–10 people) on the core
  logging flow, since low-friction logging is a stated success metric.

**6. Deployment Plan**

For a project demo, a web build (React frontend plus FastAPI/Express
backend) deployed on a free or low-cost tier (Render, Railway, or
similar) is sufficient and avoids app-store review timelines. If a
mobile build is required, React Native can be demoed via Expo without a
full app-store submission. The ML model can be served from the same
backend or as a separate lightweight inference service if latency
becomes an issue.

**7. Report Alignment**

This phased structure is deliberately designed to match a typical
project report outline: Introduction and Problem Statement draw from the
PRD (Sections 1–3); System Design draws from the TRD and Backend Schema;
Implementation draws from this document (use **Section 1.1** for what
was actually delivered versus the planned week table); and a Future Scope
section draws directly from the Future-scope / Phase 2 rows in Section 2,
so the full ambition of the idea is documented even though only the Core
tier is required for the demo. Phase 2 remains optional enhancement.
