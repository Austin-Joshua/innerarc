from __future__ import annotations

from pydantic import BaseModel


class BadgeEarned(BaseModel):
    id: str
    label: str


class GamificationOut(BaseModel):
    streak_count: int
    points: int
    badges_earned: list[str]
    last_activity_date: str | None = None
    new_badges: list[BadgeEarned] = []
