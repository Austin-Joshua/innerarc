**Innerarc**

Backend Schema

Prepared by: Tharun P

B.E. Computer Science and Business Systems, Rajalakshmi Institute of
Technology

Version 1.0

**1. Schema Overview**

The schema is organised into five groups matching the five functional
modules: User and Profile, Food and Nutrition, Workout, Progress and
Wearables, and AI and Engagement. Relational tables are used throughout
(PostgreSQL); photo binaries live in object storage with only a
reference URL stored here.

**2. User and Profile**

**users**

| **Field**     | **Type**       | **Description**        |
|---------------|----------------|------------------------|
| id            | UUID (PK)      | Primary key.           |
| email         | string, unique | Login identifier.      |
| password_hash | string         | Hashed credential.     |
| created_at    | timestamp      | Account creation time. |

**user_profile**

| **Field**        | **Type**               | **Description**                                                       |
|------------------|------------------------|-----------------------------------------------------------------------|
| user_id          | UUID (FK -\> users.id) | One-to-one with users.                                                |
| height_cm        | float                  | Onboarding input.                                                     |
| weight_kg        | float                  | Onboarding input, updatable.                                          |
| biological_sex   | enum                   | Used only to set starting-parameter calibration, not to gate content. |
| goal             | enum                   | fat_loss / muscle_gain / recomposition / endurance / general_fitness. |
| activity_level   | enum                   | Used for calorie target calculation.                                  |
| equipment_access | enum                   | none / home_gym / full_gym.                                           |

**3. Food and Nutrition**

**dishes**

| **Field**          | **Type**  | **Description**                         |
|--------------------|-----------|-----------------------------------------|
| id                 | UUID (PK) | Primary key.                            |
| name               | string    | Dish name, e.g. "Chicken biryani".      |
| cuisine            | string    | For dataset organisation and filtering. |
| nutrition_per_100g | JSON      | Calories, protein, carbs, fat.          |

**ingredients / dish_ingredients**

| **Field**                         | **Type**  | **Description**                                                                   |
|-----------------------------------|-----------|-----------------------------------------------------------------------------------|
| ingredients.id                    | UUID (PK) | Primary key.                                                                      |
| ingredients.name                  | string    | Ingredient name.                                                                  |
| dish_ingredients.dish_id          | UUID (FK) | Links to dishes.id.                                                               |
| dish_ingredients.ingredient_id    | UUID (FK) | Links to ingredients.id.                                                          |
| dish_ingredients.typical_quantity | string    | e.g. "1 tsp", used for the inferred ingredient list, not measured from the photo. |

**food_logs**

| **Field**        | **Type**                | **Description**                         |
|------------------|-------------------------|-----------------------------------------|
| id               | UUID (PK)               | Primary key.                            |
| user_id          | UUID (FK -\> users.id)  | Owner of the log entry.                 |
| dish_id          | UUID (FK -\> dishes.id) | Classified or user-corrected dish.      |
| image_url        | string                  | Reference to object storage.            |
| confidence_score | float                   | Classifier confidence, shown in the UI. |
| serving_size_g   | float                   | User-confirmed or default serving size. |
| logged_at        | timestamp               | When the meal was logged.               |

**4. Workout**

**workouts**

| **Field**        | **Type**   | **Description**                                       |
|------------------|------------|-------------------------------------------------------|
| id               | UUID (PK)  | Primary key.                                          |
| name             | string     | Workout name.                                         |
| modality         | enum       | bodyweight / weighted / home_gym / yoga / aerobics.   |
| level            | enum       | beginner / intermediate / advanced.                   |
| goal_tags        | string\[\] | One or more of the goal values in user_profile.goal.  |
| equipment_needed | string\[\] | Used to filter against user_profile.equipment_access. |
| media_url        | string     | Demo video or image reference.                        |

**programs / program_workouts**

| **Field**                                 | **Type**  | **Description**                              |
|-------------------------------------------|-----------|----------------------------------------------|
| programs.id                               | UUID (PK) | Primary key.                                 |
| programs.name                             | string    | Program name.                                |
| programs.duration_weeks                   | int       | Program length.                              |
| program_workouts.program_id               | UUID (FK) | Links to programs.id.                        |
| program_workouts.workout_id               | UUID (FK) | Links to workouts.id.                        |
| program_workouts.week_number / day_number | int / int | Position of this workout within the program. |

**workout_logs**

| **Field**           | **Type**                  | **Description**         |
|---------------------|---------------------------|-------------------------|
| id                  | UUID (PK)                 | Primary key.            |
| user_id             | UUID (FK -\> users.id)    | Owner of the log entry. |
| workout_id          | UUID (FK -\> workouts.id) | Completed workout.      |
| completed_at        | timestamp                 | Completion time.        |
| duration_min        | float                     | Session duration.       |
| calories_burned_est | float                     | MET-based estimate.     |

**5. Progress and Wearables**

**progress_photos**

| **Field**            | **Type**               | **Description**                                         |
|----------------------|------------------------|---------------------------------------------------------|
| id                   | UUID (PK)              | Primary key.                                            |
| user_id              | UUID (FK -\> users.id) | Owner; access is scoped strictly to this user.          |
| image_url            | string                 | Reference to encrypted object storage.                  |
| taken_at             | timestamp              | When the photo was captured.                            |
| pose_landmarks_json  | JSON                   | MediaPipe landmark output.                              |
| computed_ratios_json | JSON                   | Waist-to-hip and related ratios derived from landmarks. |

**wearable_data**

| **Field**   | **Type**               | **Description**                                    |
|-------------|------------------------|----------------------------------------------------|
| id          | UUID (PK)              | Primary key.                                       |
| user_id     | UUID (FK -\> users.id) | Owner of the data point.                           |
| source      | enum                   | health_connect / apple_healthkit.                  |
| metric_type | enum                   | steps / heart_rate / sleep / spo2.                 |
| value       | float                  | Metric value.                                      |
| recorded_at | timestamp              | When the metric was recorded on the source device. |

**6. AI and Engagement**

**ai_conversations**

| **Field**                | **Type**               | **Description**                                                          |
|--------------------------|------------------------|--------------------------------------------------------------------------|
| id                       | UUID (PK)              | Primary key.                                                             |
| user_id                  | UUID (FK -\> users.id) | Owner of the conversation.                                               |
| message                  | text                   | User message, or null for a proactive nudge.                             |
| response                 | text                   | Coach response.                                                          |
| referenced_data_snapshot | JSON                   | The logged-data snapshot the response was grounded in, for traceability. |
| created_at               | timestamp              | Message time.                                                            |

**gamification**

| **Field**          | **Type**               | **Description**                    |
|--------------------|------------------------|------------------------------------|
| user_id            | UUID (FK -\> users.id) | One-to-one with users.             |
| streak_count       | int                    | Current consecutive-day streak.    |
| badges_earned      | string\[\]             | Badge identifiers.                 |
| points             | int                    | Cumulative points.                 |
| last_activity_date | date                   | Used to compute streak continuity. |

**reminders**

| **Field**      | **Type**               | **Description**                      |
|----------------|------------------------|--------------------------------------|
| id             | UUID (PK)              | Primary key.                         |
| user_id        | UUID (FK -\> users.id) | Owner of the reminder.               |
| type           | enum                   | log_meal / workout / progress_photo. |
| scheduled_time | time                   | Time of day the reminder fires.      |
| recurrence     | enum                   | daily / weekly / custom.             |

**7. Relationship Summary**

- users 1—1 user_profile, 1—1 gamification.

- users 1—many food_logs, workout_logs, progress_photos, wearable_data,
  ai_conversations, reminders.

- dishes many—many ingredients, through dish_ingredients.

- programs many—many workouts, through program_workouts (ordered by
  week_number and day_number).

- food_logs many—1 dishes; workout_logs many—1 workouts.
