from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.enums import WorkoutLevel, WorkoutModality


class Workout(Base):
    __tablename__ = "workouts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    modality: Mapped[WorkoutModality] = mapped_column(
        Enum(WorkoutModality, name="workout_modality", native_enum=True), nullable=False
    )
    level: Mapped[WorkoutLevel] = mapped_column(
        Enum(WorkoutLevel, name="workout_level", native_enum=True), nullable=False
    )
    goal_tags: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False)
    equipment_needed: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False)
    media_url: Mapped[str] = mapped_column(String, nullable=False)

    program_workouts: Mapped[list[ProgramWorkout]] = relationship(
        back_populates="workout"
    )
    workout_exercises: Mapped[list[WorkoutExercise]] = relationship(
        back_populates="workout"
    )
    workout_logs: Mapped[list[WorkoutLog]] = relationship(back_populates="workout")


class Exercise(Base):
    __tablename__ = "exercises"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    media_url: Mapped[str] = mapped_column(Text, nullable=False)

    workout_exercises: Mapped[list[WorkoutExercise]] = relationship(
        back_populates="exercise"
    )


class WorkoutExercise(Base):
    __tablename__ = "workout_exercises"

    workout_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workouts.id", ondelete="CASCADE"),
        primary_key=True,
    )
    exercise_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("exercises.id", ondelete="CASCADE"),
        primary_key=True,
    )
    order_index: Mapped[int] = mapped_column(Integer, primary_key=True)
    sets: Mapped[int] = mapped_column(Integer, nullable=False)
    reps: Mapped[int | None] = mapped_column(Integer, nullable=True)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    rest_seconds: Mapped[int] = mapped_column(Integer, nullable=False)

    workout: Mapped[Workout] = relationship(back_populates="workout_exercises")
    exercise: Mapped[Exercise] = relationship(back_populates="workout_exercises")


class Program(Base):
    __tablename__ = "programs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    duration_weeks: Mapped[int] = mapped_column(Integer, nullable=False)

    program_workouts: Mapped[list[ProgramWorkout]] = relationship(
        back_populates="program"
    )


class ProgramWorkout(Base):
    __tablename__ = "program_workouts"

    program_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("programs.id", ondelete="CASCADE"),
        primary_key=True,
    )
    workout_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workouts.id"), primary_key=True
    )
    week_number: Mapped[int] = mapped_column(Integer, primary_key=True)
    day_number: Mapped[int] = mapped_column(Integer, primary_key=True)

    program: Mapped[Program] = relationship(back_populates="program_workouts")
    workout: Mapped[Workout] = relationship(back_populates="program_workouts")


class WorkoutLog(Base):
    __tablename__ = "workout_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    workout_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workouts.id"), nullable=False
    )
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    duration_min: Mapped[float] = mapped_column(Float, nullable=False)
    calories_burned_est: Mapped[float] = mapped_column(Float, nullable=False)

    user: Mapped[User] = relationship(back_populates="workout_logs")
    workout: Mapped[Workout] = relationship(back_populates="workout_logs")
