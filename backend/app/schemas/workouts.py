from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, Field


class WorkoutSummaryOut(BaseModel):
    id: UUID
    name: str
    modality: str
    level: str
    goal_tags: list[str]
    equipment_needed: list[str]
    media_url: str
    exercise_count: int


class WorkoutExerciseOut(BaseModel):
    exercise_id: UUID
    name: str
    description: str
    media_url: str
    order_index: int
    sets: int
    reps: int | None
    duration_seconds: int | None
    rest_seconds: int


class WorkoutDetailOut(WorkoutSummaryOut):
    exercises: list[WorkoutExerciseOut]


class ProgramSlotOut(BaseModel):
    week_number: int
    day_number: int
    workout: WorkoutSummaryOut


class ProgramSummaryOut(BaseModel):
    id: UUID
    name: str
    duration_weeks: int
    workout_count: int


class ProgramDetailOut(ProgramSummaryOut):
    schedule: list[ProgramSlotOut]


class WorkoutLogCreate(BaseModel):
    workout_id: UUID
    duration_min: float = Field(gt=0, le=600)


class WorkoutLogOut(BaseModel):
    id: UUID
    workout_id: UUID
    duration_min: float
    calories_burned_est: float
    gamification: dict | None = None
