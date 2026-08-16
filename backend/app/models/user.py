from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.enums import ActivityLevel, BiologicalSex, EquipmentAccess, Goal


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    profile: Mapped[UserProfile | None] = relationship(back_populates="user", uselist=False)
    gamification: Mapped[Gamification | None] = relationship(back_populates="user", uselist=False)
    food_logs: Mapped[list[FoodLog]] = relationship(back_populates="user")
    calorie_targets: Mapped[list[CalorieTarget]] = relationship(back_populates="user")
    workout_logs: Mapped[list[WorkoutLog]] = relationship(back_populates="user")
    progress_photos: Mapped[list[ProgressPhoto]] = relationship(back_populates="user")
    wearable_data: Mapped[list[WearableData]] = relationship(back_populates="user")
    ai_conversations: Mapped[list[AIConversation]] = relationship(back_populates="user")
    reminders: Mapped[list[Reminder]] = relationship(back_populates="user")


class UserProfile(Base):
    __tablename__ = "user_profile"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    height_cm: Mapped[float] = mapped_column(Float, nullable=False)
    weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    biological_sex: Mapped[BiologicalSex] = mapped_column(
        Enum(BiologicalSex, name="biological_sex", native_enum=True), nullable=False
    )
    goal: Mapped[Goal] = mapped_column(Enum(Goal, name="goal", native_enum=True), nullable=False)
    activity_level: Mapped[ActivityLevel] = mapped_column(
        Enum(ActivityLevel, name="activity_level", native_enum=True), nullable=False
    )
    equipment_access: Mapped[EquipmentAccess] = mapped_column(
        Enum(EquipmentAccess, name="equipment_access", native_enum=True), nullable=False
    )

    user: Mapped[User] = relationship(back_populates="profile")
