from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import MetricType, WearableSource


class WearableReadingIn(BaseModel):
    metric_type: MetricType
    value: float
    recorded_at: datetime


class WearableSyncRequest(BaseModel):
    readings: list[WearableReadingIn] = Field(default_factory=list)


class WearableReadingOut(BaseModel):
    id: UUID
    source: WearableSource
    metric_type: MetricType
    value: float
    recorded_at: datetime


class WearableSyncResponse(BaseModel):
    inserted: int
    updated: int
    total: int
    readings: list[WearableReadingOut]


class WearableRecentResponse(BaseModel):
    readings: list[WearableReadingOut]
    synced_at: datetime | None = None
