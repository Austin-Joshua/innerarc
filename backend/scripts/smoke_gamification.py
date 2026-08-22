"""Module 6 verification: streak gap reset, badge e2e, real milestone streak."""

from __future__ import annotations

import os
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from uuid import UUID

if not (os.environ.get("PHOTO_ENCRYPTION_KEY") or "").strip():
    from cryptography.fernet import Fernet

    os.environ["PHOTO_ENCRYPTION_KEY"] = Fernet.generate_key().decode()

from fastapi.testclient import TestClient
from sqlalchemy import select

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db import SessionLocal  # noqa: E402
from app.main import app  # noqa: E402
from app.models.engagement import Gamification  # noqa: E402
from app.models.food import Dish, FoodLog  # noqa: E402
from app.models.workout import Workout, WorkoutLog  # noqa: E402
from app.services.gamification import compute_streak, eligible_badges  # noqa: E402

GOOD = (
    Path(__file__).resolve().parents[1]
    / "scripts"
    / "fixtures"
    / "progress"
    / "good_standing.jpg"
)
if not GOOD.is_file():
    GOOD = ROOT / "ml" / "data" / "raw" / "progress_samples" / "good_standing.jpg"


def _auth(client: TestClient, email: str) -> dict[str, str]:
    reg = client.post(
        "/auth/register", json={"email": email, "password": "password123"}
    )
    if reg.status_code == 409:
        reg = client.post(
            "/auth/login", json={"email": email, "password": "password123"}
        )
    return {"Authorization": f"Bearer {reg.json()['access_token']}"}


def main() -> None:
    print("=== UNIT: streak gap resets ===")
    today = date(2026, 8, 16)
    consecutive = {today - timedelta(days=i) for i in range(3)}  # 14,15,16
    assert compute_streak(consecutive, today) == 3
    with_gap = {
        today - timedelta(days=5),
        today - timedelta(days=4),
        today,
    }  # gap then today
    assert compute_streak(with_gap, today) == 1, "gap must reset streak to 1"
    broken = {today - timedelta(days=5), today - timedelta(days=4)}  # ended 2+ days ago
    assert compute_streak(broken, today) == 0
    print("streak unit ok")

    print("=== UNIT: badges consistency-only ===")
    assert "first_meal_logged" in eligible_badges(
        meal_count=1,
        workout_count=0,
        progress_photo_count=0,
        streak_count=0,
        already=set(),
    )
    assert (
        eligible_badges(
            meal_count=0,
            workout_count=0,
            progress_photo_count=0,
            streak_count=3,
            already=set(),
        )
        == []
    )
    assert "7_day_streak" in eligible_badges(
        meal_count=1,
        workout_count=0,
        progress_photo_count=0,
        streak_count=7,
        already=set(),
    )
    print("badge unit ok")

    stamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    client = TestClient(app)
    headers = _auth(client, f"game_{stamp}@example.com")
    me = client.get("/auth/me", headers=headers).json()
    user_id = UUID(me["id"])
    client.put(
        "/auth/me/profile",
        headers=headers,
        json={
            "height_cm": 175,
            "weight_kg": 72,
            "biological_sex": "male",
            "goal": "general_fitness",
            "activity_level": "moderately_active",
            "equipment_access": "none",
        },
    )

    db = SessionLocal()
    try:
        dish = db.scalars(select(Dish).limit(1)).first()
        workout = db.scalars(select(Workout).limit(1)).first()
        assert dish and workout
        dish_id = dish.id
        workout_id = workout.id
    finally:
        db.close()

    print("=== E2E: first meal badge ===")
    meal = client.post(
        "/food/logs",
        headers=headers,
        json={
            "dish_id": str(dish_id),
            "confidence_score": 0.9,
            "serving_size_g": 200,
            "image_url": "seed://game",
        },
    )
    assert meal.status_code == 200, meal.text
    g = meal.json()["gamification"]
    assert g is not None
    assert any(b["id"] == "first_meal_logged" for b in g["new_badges"]), g
    assert g["points"] == 10
    assert g["streak_count"] >= 1
    print(
        "badge first_meal_logged earned; streak=",
        g["streak_count"],
        "points=",
        g["points"],
    )

    status = client.get("/gamification/status", headers=headers)
    assert status.status_code == 200
    assert "first_meal_logged" in status.json()["badges_earned"]
    print("GET /gamification/status shows badge")

    print("=== E2E: multi-day gap resets streak in DB path ===")
    db = SessionLocal()
    try:
        # Backdate one meal to 5 days ago and one to 4 days ago (build old streak),
        # then ensure today is isolated after clearing intermediate... Actually:
        # Insert activity on day-5 and day-4 only by backdating existing + adding,
        # remove "today" from active by... easier: set FoodLog timestamps.
        logs = db.scalars(select(FoodLog).where(FoodLog.user_id == user_id)).all()
        assert logs
        # Move the first meal to 5 days ago; add another 4 days ago; leave no today/yesterday.
        old = datetime.now(timezone.utc) - timedelta(days=5)
        mid = datetime.now(timezone.utc) - timedelta(days=4)
        logs[0].logged_at = old
        db.add(
            FoodLog(
                user_id=user_id,
                dish_id=dish_id,
                image_url="seed://gap",
                confidence_score=0.9,
                serving_size_g=150,
                logged_at=mid,
            )
        )
        db.commit()
    finally:
        db.close()

    # New workout "today" after a gap — streak should be 1 not 2+
    workout_log = client.post(
        "/workout/logs",
        headers=headers,
        json={"workout_id": str(workout_id), "duration_min": 20},
    )
    assert workout_log.status_code == 200, workout_log.text
    wg = workout_log.json()["gamification"]
    assert wg["streak_count"] == 1, wg
    assert any(b["id"] == "first_workout_completed" for b in wg["new_badges"])
    print("after gap, streak reset to", wg["streak_count"])

    print("=== E2E: progress milestone uses real streak ===")
    assert GOOD.is_file(), GOOD
    photo = client.post(
        "/progress/photos",
        headers=headers,
        files={"file": ("good.jpg", GOOD.read_bytes(), "image/jpeg")},
    )
    assert photo.status_code == 200, photo.text
    body = photo.json()
    assert body["gamification"] is not None
    assert body["milestone"]["streak_count"] == body["gamification"]["streak_count"]
    assert body["milestone"]["streak_count"] >= 1
    db = SessionLocal()
    try:
        row = db.get(Gamification, user_id)
        assert row is not None
        assert row.streak_count == body["milestone"]["streak_count"]
        assert "first_progress_photo" in (row.badges_earned or [])
        print(
            "milestone.streak_count=",
            body["milestone"]["streak_count"],
            "matches gamification row (not else-0 stub)",
        )
    finally:
        db.close()

    print("ALL MODULE 6 VERIFICATION CHECKS PASSED")
    print(
        "CORE STATUS: M1 scaffold+schema, M2 food/nutrition, M3 workouts, "
        "M4 progress pose, M5 AI coach, M6 gamification — Core tier complete."
    )


if __name__ == "__main__":
    main()
