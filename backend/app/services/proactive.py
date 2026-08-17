"""Proactive AI coaching: pattern detection + rate-limited nudge generation."""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from typing import Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.engagement import AIConversation
from app.models.food import FoodLog
from app.models.progress import ProgressPhoto
from app.models.user import User
from app.models.workout import WorkoutLog
from app.services.coach import (
    MIN_CALORIES_FLOOR as COACH_FLOOR,
    build_user_snapshot,
    generate_coach_reply,
    safety_precheck,
)

PATTERN_LOGGING_GAP = "logging_gap"
PATTERN_ADHERENCE_PROGRESS = "adherence_progress"

# Post-check: refuse model output that violates deficit policy in text.
_AGGRESSIVE_DEFICIT = [
    re.compile(r"\b([3-9]\d|\d{3,})\s*%\s*(calorie\s+)?deficit\b", re.I),
    re.compile(r"\b(under|below|only)\s*(than\s+)?(900|800|700|600|500)\s*(kcal|calories)\b", re.I),
    re.compile(r"\b(crash\s*diet|starve|starvation)\b", re.I),
]

# Adherence-rule language ban: body ratio / shape / appearance (not workout anatomy).
_APPEARANCE_LANGUAGE = [
    re.compile(r"\b(waist[- ]?to[- ]?hip|shoulder[- ]?to[- ]?waist|wthr|w2h)\b", re.I),
    re.compile(r"\b(waist|hip)\s*(ratio|measurement|size|circumference)?\b", re.I),
    re.compile(r"\b(body\s+shape|body\s+appearance|silhouette|physique)\b", re.I),
    re.compile(r"\b(ratio\s+trend|progress\s+ratio|pose\s+ratio|appearance)\b", re.I),
    re.compile(r"\b(visual\s+(progress|change)|look\s+thinner)\b", re.I),
]


@dataclass(frozen=True)
class PatternMatch:
    code: str
    # Synthetic intent for safety_precheck (not shown to user)
    synthetic_intent: str
    # Prompt fragment for generate_coach_reply — behavioral only
    coach_prompt: str


def _utc_today(now: datetime | None = None) -> date:
    now = now or datetime.now(timezone.utc)
    return now.astimezone(timezone.utc).date()


def _week_start(d: date) -> date:
    """Monday-start calendar week (UTC date)."""
    return d - timedelta(days=d.weekday())


def proactive_nudge_today(db: Session, user_id: UUID, today: date | None = None) -> AIConversation | None:
    today = today or _utc_today()
    start = datetime(today.year, today.month, today.day, tzinfo=timezone.utc)
    end = start + timedelta(days=1)
    return db.scalar(
        select(AIConversation)
        .where(
            AIConversation.user_id == user_id,
            AIConversation.message.is_(None),
            AIConversation.created_at >= start,
            AIConversation.created_at < end,
        )
        .order_by(AIConversation.created_at.desc())
        .limit(1)
    )


def _day_has_activity(db: Session, user_id: UUID, day: date) -> bool:
    start = datetime(day.year, day.month, day.day, tzinfo=timezone.utc)
    end = start + timedelta(days=1)
    food = db.scalar(
        select(func.count())
        .select_from(FoodLog)
        .where(FoodLog.user_id == user_id, FoodLog.logged_at >= start, FoodLog.logged_at < end)
    ) or 0
    work = db.scalar(
        select(func.count())
        .select_from(WorkoutLog)
        .where(
            WorkoutLog.user_id == user_id,
            WorkoutLog.completed_at >= start,
            WorkoutLog.completed_at < end,
        )
    ) or 0
    return (food + work) > 0


def detect_logging_gap(db: Session, user_id: UUID, today: date | None = None) -> PatternMatch | None:
    """3+ consecutive calendar days ending at today with no food and no workout."""
    today = today or _utc_today()
    streak = 0
    day = today
    while True:
        if _day_has_activity(db, user_id, day):
            break
        streak += 1
        day -= timedelta(days=1)
        if streak >= 14:  # cap lookback
            break
    if streak < 3:
        return None
    return PatternMatch(
        code=PATTERN_LOGGING_GAP,
        synthetic_intent=(
            "Help me get back to logging meals and workouts after several quiet days. "
            "Keep calorie advice within Innerarc safety limits and the daily floor."
        ),
        coach_prompt=(
            f"Write a short proactive coach note. Behavioral fact only: the user has had "
            f"{streak} consecutive calendar days with no food log and no workout log. "
            "Be actionable about logging meals and/or training consistency. "
            "Do not discuss body appearance, body shape, or body ratios. "
            "Do not recommend aggressive calorie cuts."
        ),
    )


def _workouts_in_range(db: Session, user_id: UUID, start: date, end_exclusive: date) -> int:
    start_dt = datetime(start.year, start.month, start.day, tzinfo=timezone.utc)
    end_dt = datetime(end_exclusive.year, end_exclusive.month, end_exclusive.day, tzinfo=timezone.utc)
    return (
        db.scalar(
            select(func.count())
            .select_from(WorkoutLog)
            .where(
                WorkoutLog.user_id == user_id,
                WorkoutLog.completed_at >= start_dt,
                WorkoutLog.completed_at < end_dt,
            )
        )
        or 0
    )


def progress_trend_flat_or_declining(db: Session, user_id: UUID) -> bool:
    """
    Internal gate only. Requires ≥2 photos; otherwise False (never error, never default declining).
    Flat/declining = waist_to_hip not improving (not decreased) OR shoulder_to_waist not improving
    (not increased).
    """
    photos = db.scalars(
        select(ProgressPhoto)
        .where(ProgressPhoto.user_id == user_id)
        .order_by(ProgressPhoto.taken_at.desc())
        .limit(2)
    ).all()
    if len(photos) < 2:
        return False
    latest, previous = photos[0], photos[1]
    lr = latest.computed_ratios_json or {}
    pr = previous.computed_ratios_json or {}
    try:
        l_wth = float(lr["waist_to_hip"])
        p_wth = float(pr["waist_to_hip"])
        l_stw = float(lr["shoulder_to_waist"])
        p_stw = float(pr["shoulder_to_waist"])
    except (KeyError, TypeError, ValueError):
        return False
    wth_not_improving = l_wth >= p_wth  # lower is better
    stw_not_improving = l_stw <= p_stw  # higher is better
    return wth_not_improving or stw_not_improving


def detect_adherence_progress(db: Session, user_id: UUID, today: date | None = None) -> PatternMatch | None:
    today = today or _utc_today()
    this_week = _week_start(today)
    prior_2_start = this_week - timedelta(days=14)

    this_week_count = _workouts_in_range(db, user_id, this_week, today + timedelta(days=1))
    prior_count = _workouts_in_range(db, user_id, prior_2_start, this_week)
    prior_avg = prior_count / 2.0

    behavior_half = this_week_count == 0 and prior_avg >= 3.0
    ratio_half = progress_trend_flat_or_declining(db, user_id)
    if not (behavior_half and ratio_half):
        return None

    return PatternMatch(
        code=PATTERN_ADHERENCE_PROGRESS,
        synthetic_intent=(
            "Help me rebuild a consistent workout logging habit this week. "
            "Keep calorie advice within Innerarc safety limits and the daily floor. "
            "Do not discuss body appearance."
        ),
        # Behavioral fact ONLY — no ratio / appearance language.
        coach_prompt=(
            "Write a short proactive coach note. Behavioral fact only: "
            "0 workouts logged this week vs a 3+/week average the prior two weeks. "
            "Be actionable about training consistency and logging workouts. "
            "Do not discuss body appearance, body shape, or visual progress. "
            "Do not recommend aggressive calorie cuts."
        ),
    )


def first_matching_pattern(db: Session, user_id: UUID, today: date | None = None) -> PatternMatch | None:
    """Prefer logging gap, then adherence+progress."""
    gap = detect_logging_gap(db, user_id, today)
    if gap:
        return gap
    return detect_adherence_progress(db, user_id, today)


def response_violates_deficit_policy(text: str, floor: int = COACH_FLOOR) -> bool:
    if not text:
        return True
    for pattern in _AGGRESSIVE_DEFICIT:
        if pattern.search(text):
            return True
    # Absolute daily targets below floor
    for m in re.finditer(r"\b(\d{3,4})\s*(kcal|calories)\b", text, re.I):
        if int(m.group(1)) < floor:
            return True
    return False


def response_mentions_appearance_or_ratios(text: str) -> bool:
    for pattern in _APPEARANCE_LANGUAGE:
        if pattern.search(text):
            return True
    return False


_SAFE_FALLBACK = (
    "You've gone quiet on logging lately — a single meal or short workout log "
    "today is enough to restart the habit. Keep any calorie changes within a "
    "modest deficit and never below a safe daily floor."
)

_SAFE_ADHERENCE_FALLBACK = (
    "Your workout logging dropped off this week after a steadier prior stretch. "
    "Pick one session you can actually do and log it — consistency beats volume."
)


def maybe_create_nudge(db: Session, user: User, today: date | None = None) -> AIConversation | None:
    """
    Return today's proactive nudge (existing or newly created). Rate limit: one per UTC day.
    """
    today = today or _utc_today()
    existing = proactive_nudge_today(db, user.id, today)
    if existing is not None:
        return existing

    match = first_matching_pattern(db, user.id, today)
    if match is None:
        return None

    snapshot = build_user_snapshot(db, user)
    blocked = safety_precheck(match.synthetic_intent)
    snapshot = {
        **snapshot,
        "safety_precheck": "blocked" if blocked else "passed",
        "proactive_pattern": match.code,
    }

    if blocked is not None:
        reply = blocked
        safety_blocked = True
    else:
        safety_blocked = False
        try:
            reply = generate_coach_reply(match.coach_prompt, snapshot)
        except Exception:  # noqa: BLE001
            reply = (
                _SAFE_ADHERENCE_FALLBACK
                if match.code == PATTERN_ADHERENCE_PROGRESS
                else _SAFE_FALLBACK
            )

        if response_violates_deficit_policy(reply):
            reply = (
                _SAFE_ADHERENCE_FALLBACK
                if match.code == PATTERN_ADHERENCE_PROGRESS
                else _SAFE_FALLBACK
            )
            snapshot = {**snapshot, "safety_postcheck": "deficit_policy_replaced"}

        if match.code == PATTERN_ADHERENCE_PROGRESS and response_mentions_appearance_or_ratios(reply):
            reply = _SAFE_ADHERENCE_FALLBACK
            snapshot = {**snapshot, "safety_postcheck": "appearance_language_replaced"}

    row = AIConversation(
        user_id=user.id,
        message=None,
        response=reply,
        referenced_data_snapshot={
            **snapshot,
            "safety_precheck": "blocked" if safety_blocked else snapshot.get("safety_precheck", "passed"),
        },
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def nudge_payload(row: AIConversation) -> dict[str, Any]:
    snap = row.referenced_data_snapshot or {}
    return {
        "id": row.id,
        "response": row.response,
        "created_at": row.created_at,
        "pattern_code": snap.get("proactive_pattern") or "unknown",
    }
