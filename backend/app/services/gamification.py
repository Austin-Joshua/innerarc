"""Event-driven gamification: streaks, badges, points from logging events only.

Badges and streaks are tied to consistency (showing up / logging), never to
progress-photo ratios or body-change metrics.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.engagement import Gamification
from app.models.food import FoodLog
from app.models.progress import ProgressPhoto
from app.models.workout import WorkoutLog

# Fixed points per event type — no decay or multipliers.
POINTS = {
    "meal": 10,
    "workout": 25,
    "progress_photo": 15,
}

BADGE_LABELS = {
    "first_meal_logged": "First meal logged",
    "first_workout_completed": "First workout completed",
    "first_progress_photo": "First progress photo",
    "7_day_streak": "7-day streak",
    "5_workouts_logged": "5 workouts logged",
}


@dataclass(frozen=True)
class GamificationState:
    streak_count: int
    points: int
    badges_earned: list[str]
    last_activity_date: date | None
    new_badges: list[str]


def compute_streak(active_dates: set[date], as_of: date) -> int:
    """Consecutive calendar days with activity ending at as_of (or yesterday).

    A gap of one or more days resets the streak. Pure function for unit tests.
    """
    if not active_dates:
        return 0
    cursor = as_of
    if cursor not in active_dates:
        cursor = as_of - timedelta(days=1)
        if cursor not in active_dates:
            return 0
    streak = 0
    while cursor in active_dates:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


def eligible_badges(
    *,
    meal_count: int,
    workout_count: int,
    progress_photo_count: int,
    streak_count: int,
    already: set[str],
) -> list[str]:
    """Return newly earned badge ids based on consistency counts only."""
    candidates: list[str] = []
    if meal_count >= 1 and "first_meal_logged" not in already:
        candidates.append("first_meal_logged")
    if workout_count >= 1 and "first_workout_completed" not in already:
        candidates.append("first_workout_completed")
    if progress_photo_count >= 1 and "first_progress_photo" not in already:
        candidates.append("first_progress_photo")
    if streak_count >= 7 and "7_day_streak" not in already:
        candidates.append("7_day_streak")
    if workout_count >= 5 and "5_workouts_logged" not in already:
        candidates.append("5_workouts_logged")
    return candidates


def _active_dates(db: Session, user_id: UUID) -> set[date]:
    food_days = db.scalars(select(func.date(FoodLog.logged_at)).where(FoodLog.user_id == user_id)).all()
    workout_days = db.scalars(
        select(func.date(WorkoutLog.completed_at)).where(WorkoutLog.user_id == user_id)
    ).all()
    return {d for d in (*food_days, *workout_days) if d is not None}


def _counts(db: Session, user_id: UUID) -> tuple[int, int, int]:
    meals = db.scalar(select(func.count()).select_from(FoodLog).where(FoodLog.user_id == user_id)) or 0
    workouts = (
        db.scalar(select(func.count()).select_from(WorkoutLog).where(WorkoutLog.user_id == user_id)) or 0
    )
    photos = (
        db.scalar(select(func.count()).select_from(ProgressPhoto).where(ProgressPhoto.user_id == user_id))
        or 0
    )
    return int(meals), int(workouts), int(photos)


def get_or_create(db: Session, user_id: UUID) -> Gamification:
    row = db.get(Gamification, user_id)
    if row is None:
        row = Gamification(
            user_id=user_id,
            streak_count=0,
            badges_earned=[],
            points=0,
            last_activity_date=None,
        )
        db.add(row)
        db.flush()
    return row


def apply_event(
    db: Session,
    user_id: UUID,
    event_type: str,
    *,
    as_of: date | None = None,
) -> GamificationState:
    """Update gamification after a meal, workout, or progress_photo event."""
    if event_type not in POINTS:
        raise ValueError(f"Unknown event_type: {event_type}")
    today = as_of or datetime.now(timezone.utc).date()
    row = get_or_create(db, user_id)

    active = _active_dates(db, user_id)
    streak = compute_streak(active, today)
    meals, workouts, photos = _counts(db, user_id)
    already = set(row.badges_earned or [])
    new_badges = eligible_badges(
        meal_count=meals,
        workout_count=workouts,
        progress_photo_count=photos,
        streak_count=streak,
        already=already,
    )

    row.streak_count = streak
    row.points = int(row.points or 0) + POINTS[event_type]
    row.last_activity_date = today
    if new_badges:
        row.badges_earned = list(row.badges_earned or []) + new_badges
    db.add(row)
    db.flush()
    return GamificationState(
        streak_count=row.streak_count,
        points=row.points,
        badges_earned=list(row.badges_earned or []),
        last_activity_date=row.last_activity_date,
        new_badges=new_badges,
    )


def status_for_user(db: Session, user_id: UUID) -> GamificationState:
    row = db.get(Gamification, user_id)
    if row is None:
        today = datetime.now(timezone.utc).date()
        streak = compute_streak(_active_dates(db, user_id), today)
        return GamificationState(
            streak_count=streak,
            points=0,
            badges_earned=[],
            last_activity_date=None,
            new_badges=[],
        )
    return GamificationState(
        streak_count=int(row.streak_count),
        points=int(row.points),
        badges_earned=list(row.badges_earned or []),
        last_activity_date=row.last_activity_date,
        new_badges=[],
    )


def state_dict(state: GamificationState) -> dict:
    return {
        "streak_count": state.streak_count,
        "points": state.points,
        "badges_earned": state.badges_earned,
        "last_activity_date": state.last_activity_date.isoformat() if state.last_activity_date else None,
        "new_badges": [
            {"id": badge, "label": BADGE_LABELS.get(badge, badge)} for badge in state.new_badges
        ],
    }
