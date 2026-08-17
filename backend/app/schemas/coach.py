from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class CoachChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)


class CoachChatResponse(BaseModel):
    id: UUID
    message: str
    response: str
    created_at: datetime
    snapshot_summary: dict
    safety_precheck_blocked: bool


class CoachHistoryItem(BaseModel):
    id: UUID
    message: str | None
    response: str
    created_at: datetime
    safety_precheck_blocked: bool = False


class CoachNudgeItem(BaseModel):
    id: UUID
    response: str
    created_at: datetime
    pattern_code: str


class CoachNudgeResponse(BaseModel):
    nudge: CoachNudgeItem | None = None
