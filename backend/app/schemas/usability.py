from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

EVENT_TYPES = ("screen_viewed", "task_started", "task_completed", "task_abandoned")


class EventIn(BaseModel):
    event_type: str = Field(pattern="^(" + "|".join(EVENT_TYPES) + ")$")
    task: str | None = None
    screen: str | None = None


class EventOut(BaseModel):
    id: UUID
    event_type: str
    task: str | None
    screen: str | None
    created_at: datetime


class FeedbackIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str | None = None
    screen: str | None = None


class FeedbackOut(BaseModel):
    id: UUID
    rating: int
    comment: str | None
    screen: str | None
    created_at: datetime
