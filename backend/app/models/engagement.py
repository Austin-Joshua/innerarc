from __future__ import annotations

import uuid
from datetime import date, datetime, time

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, Text, Time, func
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String

from app.db import Base
from app.models.enums import ReminderRecurrence, ReminderType


class AIConversation(Base):
    __tablename__ = "ai_conversations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    response: Mapped[str] = mapped_column(Text, nullable=False)
    referenced_data_snapshot: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    user: Mapped[User] = relationship(back_populates="ai_conversations")


class Gamification(Base):
    __tablename__ = "gamification"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    streak_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    badges_earned: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)
    points: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_activity_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    user: Mapped[User] = relationship(back_populates="gamification")


class Reminder(Base):
    __tablename__ = "reminders"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    type: Mapped[ReminderType] = mapped_column(
        Enum(ReminderType, name="reminder_type", native_enum=True), nullable=False
    )
    scheduled_time: Mapped[time] = mapped_column(Time, nullable=False)
    recurrence: Mapped[ReminderRecurrence] = mapped_column(
        Enum(ReminderRecurrence, name="reminder_recurrence", native_enum=True), nullable=False
    )

    user: Mapped[User] = relationship(back_populates="reminders")
