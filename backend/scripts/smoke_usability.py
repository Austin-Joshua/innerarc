"""Module 11 verification: usability events land in the DB for the three
logging flows (food, workout, progress), and feedback stores rating+comment.
"""

from __future__ import annotations

import sys
import time
from pathlib import Path
from uuid import UUID

from fastapi.testclient import TestClient
from sqlalchemy import select

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db import SessionLocal  # noqa: E402
from app.main import app  # noqa: E402
from app.models.food import Dish  # noqa: E402
from app.models.usability import Feedback, UsabilityEvent  # noqa: E402
from app.models.workout import Workout  # noqa: E402

GOOD_PHOTO = (
    Path(__file__).resolve().parents[1]
    / "scripts"
    / "fixtures"
    / "progress"
    / "good_standing.jpg"
)
if not GOOD_PHOTO.is_file():
    GOOD_PHOTO = (
        ROOT / "ml" / "data" / "raw" / "progress_samples" / "good_standing.jpg"
    )


def _auth(client: TestClient, email: str) -> dict[str, str]:
    reg = client.post(
        "/auth/register", json={"email": email, "password": "password123"}
    )
    if reg.status_code == 409:
        reg = client.post(
            "/auth/login", json={"email": email, "password": "password123"}
        )
    assert reg.status_code == 200, reg.text
    return {"Authorization": f"Bearer {reg.json()['access_token']}"}


def _log_event(client, headers, event_type: str, task: str, screen: str) -> None:
    resp = client.post(
        "/usability/events",
        headers=headers,
        json={"event_type": event_type, "task": task, "screen": screen},
    )
    assert resp.status_code == 200, resp.text


def main() -> None:
    stamp = time.strftime("%Y%m%d%H%M%S")
    client = TestClient(app)
    headers = _auth(client, f"usability_{stamp}@example.com")
    me = client.get("/auth/me", headers=headers).json()
    user_id = UUID(me["id"])

    db = SessionLocal()
    try:
        dish = db.scalars(select(Dish).limit(1)).first()
        workout = db.scalars(select(Workout).limit(1)).first()
        assert (
            dish and workout
        ), "seed data required (run seed_food.py / seed_workouts.py)"
        dish_id, workout_id = dish.id, workout.id
    finally:
        db.close()

    print("=== E2E: food log started/completed ===")
    _log_event(client, headers, "task_started", "food_log", "FoodCapture")
    meal = client.post(
        "/food/logs",
        headers=headers,
        json={
            "dish_id": str(dish_id),
            "confidence_score": 0.9,
            "serving_size_g": 200,
            "image_url": "seed://usability",
        },
    )
    assert meal.status_code == 200, meal.text
    _log_event(client, headers, "task_completed", "food_log", "FoodNutrition")
    print("food_log events posted")

    print("=== E2E: workout session started/completed ===")
    _log_event(client, headers, "task_started", "workout_session", "WorkoutDetail")
    workout_log = client.post(
        "/workout/logs",
        headers=headers,
        json={"workout_id": str(workout_id), "duration_min": 15},
    )
    assert workout_log.status_code == 200, workout_log.text
    _log_event(client, headers, "task_completed", "workout_session", "WorkoutSession")
    print("workout_session events posted")

    print("=== E2E: progress photo started/completed ===")
    assert GOOD_PHOTO.is_file(), GOOD_PHOTO
    _log_event(client, headers, "task_started", "progress_photo", "ProgressCapture")
    photo = client.post(
        "/progress/photos",
        headers=headers,
        files={"file": ("good.jpg", GOOD_PHOTO.read_bytes(), "image/jpeg")},
    )
    assert photo.status_code == 200, photo.text
    _log_event(client, headers, "task_completed", "progress_photo", "ProgressCapture")
    print("progress_photo events posted")

    print("=== E2E: feedback rating+comment ===")
    fb = client.post(
        "/feedback",
        headers=headers,
        json={
            "rating": 4,
            "comment": "Logging felt quick.",
            "screen": "WorkoutSession",
        },
    )
    assert fb.status_code == 200, fb.text
    fb_id = UUID(fb.json()["id"])

    print("=== DB CHECK: events + feedback landed correctly ===")
    db = SessionLocal()
    try:
        events = db.scalars(
            select(UsabilityEvent)
            .where(UsabilityEvent.user_id == user_id)
            .order_by(UsabilityEvent.created_at)
        ).all()
        by_task = {(e.task, e.event_type) for e in events}
        expected = {
            ("food_log", "task_started"),
            ("food_log", "task_completed"),
            ("workout_session", "task_started"),
            ("workout_session", "task_completed"),
            ("progress_photo", "task_started"),
            ("progress_photo", "task_completed"),
        }
        assert expected.issubset(by_task), f"missing events: {expected - by_task}"
        assert all(e.created_at is not None for e in events)
        print(
            f"{len(events)} usability_events rows found, all {len(expected)} expected pairs present"
        )

        row = db.get(Feedback, fb_id)
        assert row is not None
        assert row.rating == 4
        assert row.comment == "Logging felt quick."
        assert row.screen == "WorkoutSession"
        print("feedback row stored with matching rating+comment+screen")
    finally:
        db.close()

    print("ALL MODULE 11 VERIFICATION CHECKS PASSED")


if __name__ == "__main__":
    main()
