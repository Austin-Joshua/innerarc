from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ComputedRatios(BaseModel):
    waist_to_hip: float
    shoulder_to_waist: float
    pixel_widths: dict[str, float] = Field(default_factory=dict)


class ProgressPhotoOut(BaseModel):
    id: UUID
    image_url: str
    taken_at: datetime
    mean_visibility: float | None
    ratios: ComputedRatios


class ConsistencyMetrics(BaseModel):
    period_start: datetime
    period_end: datetime
    workouts_logged: int
    days_active: int


class MilestoneStub(BaseModel):
    code: str | None
    message: str | None
    streak_count: int


class ProgressUploadResponse(BaseModel):
    current: ProgressPhotoOut
    previous: ProgressPhotoOut | None
    consistency: ConsistencyMetrics
    milestone: MilestoneStub
    trend: list[ProgressPhotoOut]
    gamification: dict | None = None


class ProgressTimelineOut(BaseModel):
    photos: list[ProgressPhotoOut]
    consistency: ConsistencyMetrics
    milestone: MilestoneStub
