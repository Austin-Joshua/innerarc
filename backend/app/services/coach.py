"""AI Coach: snapshot retrieval, keyword safety precheck, Gemini reply."""

from __future__ import annotations

import json
import re
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.config import settings
from app.models.food import CalorieTarget, Dish, FoodLog
from app.models.progress import ProgressPhoto
from app.models.user import User
from app.models.workout import WorkoutLog
from app.services.calorie import MAX_DEFICIT_FRACTION, calculate_targets

WINDOW_DAYS = 7
MIN_CALORIES_FLOOR = 1200

SYSTEM_INSTRUCTION = """You are Innerarc's on-demand health coach.

Hard rules (never break these):
1. Ground every answer ONLY in the USER_DATA_SNAPSHOT JSON provided in the user message. If data_sufficiency is empty or sparse, say so clearly — do not invent meals, workouts, or trends.
2. Never recommend a calorie deficit larger than 20% below TDEE / more aggressive than the user's calculated target path. Never recommend daily intake below min_calories_floor in the snapshot safety block (typically 1200). If the user asks for something more aggressive (including a very low absolute calorie target), decline and explain the 20% / floor policy. Do not comply.
3. Never recommend excessive training volume or training through injury, pain, or sharp discomfort. Decline and suggest rest / professional care when relevant.
4. Never state body-fat percentage, BMI, or clinical diagnoses. Progress data means pose ratios only.
5. Stay neutral and non-moralising about food and missed workouts. Text-only suggestions are fine; do not claim you changed their targets.

Be concise and practical."""

PRECHECK_DECLINE = (
    "I can't help with that request. Innerarc caps calorie deficits at 20% below "
    "maintenance (and never below a safe floor), and won't support training through "
    "injury or extreme volume. Ask about your logged meals, workouts, or a plan "
    "within those limits and I'll help from your actual data."
)

# Keyword/phrase gate only — intentionally narrow so numeric probes like
# "900 calories a day" reach Gemini for system_instruction verification.
_DEFICIT_PATTERNS = [
    re.compile(r"\b\d{2,3}\s*%\s*(calorie\s+)?deficit\b", re.I),
    re.compile(r"\b(crash\s*diet|starve|starvation|fasting\s+to\s+lose)\b", re.I),
    re.compile(r"\b(500|extreme)\s+(calorie\s+)?(cut|deficit)\b", re.I),
    re.compile(r"\bcut\s+me\s+to\s+a\s+\d+%\s+deficit\b", re.I),
]
_INJURY_PATTERNS = [
    re.compile(r"\btrain\s+through\s+(the\s+)?(tear|pain|injury)\b", re.I),
    re.compile(r"\b(sharp\s+)?(knee|shoulder|back)\s+pain\s+every\s+day\b", re.I),
    re.compile(r"\btwo[- ]a[- ]days?\s+every\s+day\b", re.I),
    re.compile(r"\bpush\s+through\s+(the\s+)?(pain|injury)\b", re.I),
]


def safety_precheck(message: str) -> str | None:
    """Return fixed decline text if keywords match; otherwise None (call Gemini)."""
    text = message or ""
    for pattern in _DEFICIT_PATTERNS + _INJURY_PATTERNS:
        if pattern.search(text):
            return PRECHECK_DECLINE
    return None


def _macros_for_log(dish: Dish, serving_size_g: float) -> dict[str, float]:
    per = dish.nutrition_per_100g or {}
    scale = serving_size_g / 100.0
    return {
        "calories": round(float(per.get("calories", 0)) * scale, 1),
        "protein": round(float(per.get("protein", 0)) * scale, 1),
        "carbs": round(float(per.get("carbs", 0)) * scale, 1),
        "fat": round(float(per.get("fat", 0)) * scale, 1),
    }


def build_user_snapshot(db: Session, user: User) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    since = now - timedelta(days=WINDOW_DAYS)

    food_rows = db.scalars(
        select(FoodLog)
        .where(FoodLog.user_id == user.id, FoodLog.logged_at >= since)
        .options(selectinload(FoodLog.dish))
        .order_by(FoodLog.logged_at.desc())
    ).all()
    food_logs = [
        {
            "dish": row.dish.name if row.dish else "Unknown",
            "logged_at": row.logged_at.isoformat(),
            "serving_size_g": row.serving_size_g,
            **_macros_for_log(row.dish, row.serving_size_g),
        }
        for row in food_rows
        if row.dish is not None
    ]

    workout_rows = db.scalars(
        select(WorkoutLog)
        .where(WorkoutLog.user_id == user.id, WorkoutLog.completed_at >= since)
        .options(selectinload(WorkoutLog.workout))
        .order_by(WorkoutLog.completed_at.desc())
    ).all()
    workout_logs = [
        {
            "workout": row.workout.name if row.workout else "Unknown",
            "completed_at": row.completed_at.isoformat(),
            "duration_min": row.duration_min,
            "calories_burned_est": row.calories_burned_est,
        }
        for row in workout_rows
    ]

    target_row = db.scalar(
        select(CalorieTarget)
        .where(CalorieTarget.user_id == user.id)
        .order_by(CalorieTarget.date.desc(), CalorieTarget.created_at.desc())
        .limit(1)
    )
    calorie_target: dict[str, Any] | None
    if target_row is not None:
        calorie_target = {
            "date": target_row.date.isoformat(),
            "target_calories": target_row.target_calories,
            "target_protein_g": target_row.target_protein_g,
            "target_carbs_g": target_row.target_carbs_g,
            "target_fat_g": target_row.target_fat_g,
            "source": target_row.source,
        }
    elif user.profile is not None:
        computed = calculate_targets(user.profile)
        calorie_target = {**computed, "source": "calculated_on_the_fly"}
    else:
        calorie_target = None

    progress = db.scalar(
        select(ProgressPhoto)
        .where(ProgressPhoto.user_id == user.id)
        .order_by(ProgressPhoto.taken_at.desc())
        .limit(1)
    )
    progress_ratios = None
    if progress is not None:
        progress_ratios = {
            "taken_at": progress.taken_at.isoformat(),
            "ratios": progress.computed_ratios_json,
            "mean_visibility": (progress.pose_landmarks_json or {}).get(
                "mean_visibility"
            ),
        }

    profile = None
    if user.profile is not None:
        profile = {
            "goal": user.profile.goal.value,
            "activity_level": user.profile.activity_level.value,
            "equipment_access": user.profile.equipment_access.value,
            "weight_kg": user.profile.weight_kg,
        }

    n_food = len(food_logs)
    n_work = len(workout_logs)
    if n_food == 0 and n_work == 0:
        sufficiency = "empty"
    elif n_food + n_work < 3:
        sufficiency = "sparse"
    else:
        sufficiency = "adequate"

    current_target_calories = None
    if calorie_target is not None:
        current_target_calories = calorie_target.get("target_calories")

    return {
        "window_days": WINDOW_DAYS,
        "as_of": now.isoformat(),
        "profile": profile,
        "calorie_target": calorie_target,
        "food_logs": food_logs,
        "workout_logs": workout_logs,
        "progress_ratios": progress_ratios,
        "safety": {
            "max_deficit_fraction": MAX_DEFICIT_FRACTION,
            "min_calories_floor": MIN_CALORIES_FLOOR,
            "current_target_calories": current_target_calories,
        },
        "data_sufficiency": sufficiency,
    }


def _user_turn(message: str, snapshot: dict[str, Any]) -> str:
    return (
        "USER_DATA_SNAPSHOT (JSON):\n"
        f"{json.dumps(snapshot, default=str)}\n\n"
        f"USER_MESSAGE:\n{message}"
    )


def generate_coach_reply(message: str, snapshot: dict[str, Any]) -> str:
    """Call Gemini with hard rules via system_instruction (not user-turn prepend)."""
    api_key = (settings.gemini_api_key or "").strip()
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=_user_turn(message, snapshot),
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
            temperature=0.4,
            max_output_tokens=1024,
        ),
    )
    text = (response.text or "").strip()
    if not text:
        raise RuntimeError("Gemini returned an empty response")
    return text


def snapshot_summary(snapshot: dict[str, Any]) -> dict[str, Any]:
    return {
        "data_sufficiency": snapshot.get("data_sufficiency"),
        "food_log_count": len(snapshot.get("food_logs") or []),
        "workout_log_count": len(snapshot.get("workout_logs") or []),
        "has_calorie_target": snapshot.get("calorie_target") is not None,
        "has_progress_ratios": snapshot.get("progress_ratios") is not None,
    }
