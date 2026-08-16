"""Upsert exercises, workouts, workout_exercises, programs, and program_workouts."""

from __future__ import annotations

import json
import sys
from pathlib import Path

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db import SessionLocal  # noqa: E402
from app.models.enums import WorkoutLevel, WorkoutModality  # noqa: E402
from app.models.workout import (  # noqa: E402
    Exercise,
    Program,
    ProgramWorkout,
    Workout,
    WorkoutExercise,
)

SEED_PATH = Path(__file__).resolve().parents[1] / "seed" / "workouts.json"


def seed(db: Session) -> None:
    payload = json.loads(SEED_PATH.read_text(encoding="utf-8"))

    exercises_by_slug: dict[str, Exercise] = {}
    for row in payload["exercises"]:
        existing = db.scalar(select(Exercise).where(Exercise.name == row["name"]))
        if existing:
            existing.description = row["description"]
            existing.media_url = row["media_url"]
            exercise = existing
        else:
            exercise = Exercise(
                name=row["name"],
                description=row["description"],
                media_url=row["media_url"],
            )
            db.add(exercise)
            db.flush()
        exercises_by_slug[row["slug"]] = exercise

    workouts_by_slug: dict[str, Workout] = {}
    for row in payload["workouts"]:
        existing = db.scalar(select(Workout).where(Workout.name == row["name"]))
        if existing:
            existing.modality = WorkoutModality(row["modality"])
            existing.level = WorkoutLevel(row["level"])
            existing.goal_tags = row["goal_tags"]
            existing.equipment_needed = row["equipment_needed"]
            existing.media_url = row["media_url"]
            workout = existing
            db.execute(delete(WorkoutExercise).where(WorkoutExercise.workout_id == workout.id))
        else:
            workout = Workout(
                name=row["name"],
                modality=WorkoutModality(row["modality"]),
                level=WorkoutLevel(row["level"]),
                goal_tags=row["goal_tags"],
                equipment_needed=row["equipment_needed"],
                media_url=row["media_url"],
            )
            db.add(workout)
            db.flush()

        for item in row["exercises"]:
            exercise = exercises_by_slug[item["slug"]]
            db.add(
                WorkoutExercise(
                    workout_id=workout.id,
                    exercise_id=exercise.id,
                    order_index=item["order_index"],
                    sets=item["sets"],
                    reps=item.get("reps"),
                    duration_seconds=item.get("duration_seconds"),
                    rest_seconds=item["rest_seconds"],
                )
            )
        workouts_by_slug[row["slug"]] = workout
        print(f"seeded workout {row['slug']} modality={row['modality']} level={row['level']}")

    for prow in payload["programs"]:
        existing = db.scalar(select(Program).where(Program.name == prow["name"]))
        if existing:
            existing.duration_weeks = prow["duration_weeks"]
            program = existing
            db.execute(delete(ProgramWorkout).where(ProgramWorkout.program_id == program.id))
        else:
            program = Program(name=prow["name"], duration_weeks=prow["duration_weeks"])
            db.add(program)
            db.flush()

        for slot in prow["schedule"]:
            workout = workouts_by_slug[slot["workout_slug"]]
            db.add(
                ProgramWorkout(
                    program_id=program.id,
                    workout_id=workout.id,
                    week_number=slot["week_number"],
                    day_number=slot["day_number"],
                )
            )
        print(f"seeded program {prow['slug']} weeks={prow['duration_weeks']}")

    db.commit()


def main() -> None:
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
