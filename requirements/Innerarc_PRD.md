**Innerarc**

Product Requirements Document (PRD)

A closed-loop AI health companion for nutrition, training, and body
progress

Prepared by: Tharun P

B.E. Computer Science and Business Systems, Rajalakshmi Institute of
Technology

Version 1.0

**1. Overview**

Innerarc is a mobile-first health application that unifies three
functions that most existing apps keep separate: food recognition and
nutrition tracking, structured exercise programming, and image-based
body progress tracking. A single AI coaching layer reasons across all
three data streams and adjusts recommendations as new data arrives, so
the user experiences one continuously adapting plan instead of three
disconnected tools.

**2. Problem Statement**

Existing health apps are single-purpose. A user who wants to manage
diet, training, and visible body progress together today has to run a
calorie tracker, a workout app, and a separate progress-photo folder,
none of which talk to each other. This creates two problems: the user
has to do the cross-referencing manually (did my workouts drop because
my protein intake dropped?), and each individual app has no visibility
into whether its recommendations are actually working for the user's
body.

**3. Novelty and Differentiation**

Food recognition apps, workout apps, and wearable dashboards each
already exist individually. Innerarc's novelty is not any single feature
— it is the reasoning layer that sits across all of them. The AI coach
cross-references adherence, nutrition, and visual progress together, and
proactively adjusts the plan (for example, suggesting a deload week when
workout adherence drops alongside falling protein intake and a stalled
progress photo) instead of waiting to be asked. This closed-loop
behaviour is the core differentiator and is reflected in every module
described in this document.

**4. Target Users**

- Students and early-career individuals who want to manage fat loss or
  recomposition without a personal trainer or dietitian.

- Home-gym or no-equipment users who want workouts calibrated to what
  they actually have access to, rather than generic routines.

- Users currently juggling multiple apps (a calorie tracker, a workout
  app, a wearable's own app) who want one dashboard.

- Beginners who need a program that adapts to their measured starting
  point rather than a one-size-fits-all plan.

**5. Goals and Success Metrics**

- Dish classification accuracy of at least 85% top-1 on a curated 25–30
  dish list (Core scope).

- A workout recommendation available for every combination of modality,
  level, goal, and equipment access captured at onboarding.

- Weekly active logging: percentage of users who log at least one meal
  and complete at least one workout per week.

- Progress-tracking engagement: percentage of users who upload a second
  progress photo within 14 days of their first.

- AI coach usefulness: percentage of AI recommendations the user marks
  as helpful or acts on.

**6. Use Cases**

- A student photographs a home-cooked meal; the app identifies the dish,
  infers its typical ingredients, and logs calories and macros against
  the daily target.

- A user with no gym access filters the workout library to
  bodyweight-only, beginner level, fat-loss goal, and starts a 4-week
  structured program.

- A user uploads a biweekly progress photo; the app tracks waist-to-hip
  ratio and silhouette change over time and shows the trend alongside
  the training and nutrition log for the same period.

- A user connects an existing wearable through Health Connect or Apple
  HealthKit; steps, heart rate, and sleep flow into the dashboard
  automatically.

- The AI coach notices three consecutive missed workouts and a rising
  calorie deficit, and proactively suggests easing the deficit rather
  than waiting for the user to ask why progress has stalled.

**7. Real-Time Application Scenarios**

- Point-of-eating logging: a meal is photographed and logged in the
  moment, at home or at a restaurant, rather than recalled and estimated
  later.

- Live workout sessions: a session screen with an active set/rep timer
  guides the user in real time through an individual workout or a
  program day.

- Background wearable sync: step count, heart rate, and sleep stream in
  continuously through Health Connect / HealthKit without manual entry,
  keeping the daily activity picture current.

- Proactive nudges: reminders and AI-generated check-ins are triggered
  by real-time adherence patterns (a missed log, a plateau in the trend
  line) rather than sent on a fixed schedule only.

**8. Feature Scope**

Feature scope is split into three tiers so the ambitious full vision is
documented while the build stays realistic within a project timeline.
This mirrors the phased plan discussed for this project.

| **Tier**                    | **Modules included**                                                                                                                                                                                                                                                                                                                  |
|-----------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Core (build and demo)       | Dish classifier with recipe-based ingredient inference; nutrition dashboard; tagged workout database and program generator; pose-estimation progress tracking (ratios and silhouette, not clinical body-fat %); LLM-based AI coach with retrieval over the user's own logged data; gamification (streaks, badges); central dashboard. |
| Phase 2 (stretch)           | Multi-item plate segmentation for mixed plates; one wearable integration (Health Connect) for real steps, heart rate, and sleep; AI coach that proactively cross-references data streams instead of only answering on demand.                                                                                                         |
| Future scope (roadmap only) | Custom hardware wearable for steps, activity, and calorie detection; clinical-grade blood-oxygen and blood-pressure tracking; multi-cuisine and multi-language expansion; reminders engine expanded to full habit coaching.                                                                                                           |

**9. Non-Functional Requirements**

- Privacy: progress photos and meal photos are sensitive personal data
  and must be stored encrypted, with a clear user-facing delete option.

- Responsible design: progress framing emphasises consistency and
  strength alongside visual change; the AI coach must not recommend
  extreme calorie deficits.

- Accuracy transparency: the app must show a confidence score on food
  classification and allow manual correction rather than presenting
  predictions as certain.

- Accessibility: text scaling and sufficient colour contrast across all
  core screens.

- Performance: food classification result returned within a few seconds
  of photo capture on a typical mid-range device.

**10. Out of Scope**

- Clinical diagnosis of any kind, including body-fat percentage
  presented as a medical measurement.

- Prescription of medication, supplements, or medical-grade dietary
  intervention.

- Custom hardware development in the current build (see Future scope).

**11. Assumptions and Constraints**

- Development timeline is assumed to be a single academic semester; the
  Implementation Plan document details the week-by-week breakdown.

- Nutrition values are sourced from USDA FoodData Central and IFCT 2017
  and are estimates, not lab-measured values for the specific meal
  photographed.

- Wearable data depends on the user owning a compatible device and
  granting Health Connect / HealthKit permissions.

**12. Risks**

- Ingredient inference is a lookup against known recipes, not true
  visual ingredient detection — this must be represented accurately in
  the UI and report, not oversold.

- Body-composition imaging from a single 2D photo has real accuracy
  limits; the product commits to ratio/silhouette tracking rather than
  absolute body-fat measurement to stay within what is defensible.

- Scope creep is the primary delivery risk given the breadth of this
  vision; the tiered feature scope in Section 8 exists specifically to
  manage it.
