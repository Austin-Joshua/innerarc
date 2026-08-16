"""Module 4 verification: good pose, bad pose 422, consistency metrics, cross-user 404."""

from __future__ import annotations

import sys
from datetime import datetime, timezone
from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import select

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db import SessionLocal  # noqa: E402
from app.main import app  # noqa: E402
from app.models.progress import ProgressPhoto  # noqa: E402
from app.models.workout import Workout, WorkoutLog  # noqa: E402
from app.services.pose import PoseFailure, PoseSuccess, estimate_pose  # noqa: E402

SAMPLES = ROOT / "ml" / "data" / "raw" / "progress_samples"
GOOD = SAMPLES / "good_standing.jpg"
BAD = SAMPLES / "bad_dark.jpg"


def _auth(client: TestClient, email: str) -> dict[str, str]:
    reg = client.post("/auth/register", json={"email": email, "password": "password123"})
    if reg.status_code == 409:
        reg = client.post("/auth/login", json={"email": email, "password": "password123"})
    token = reg.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def main() -> None:
    assert GOOD.is_file(), f"missing {GOOD}"
    assert BAD.is_file(), f"missing {BAD}"

    print("=== 1) Direct pose on good sample ===")
    good = estimate_pose(GOOD)
    assert isinstance(good, PoseSuccess), good
    print("mean_visibility", good.pose_landmarks_json["mean_visibility"])
    print("required_visibility", good.pose_landmarks_json["required_visibility"])
    print("ratios", good.computed_ratios_json)

    print("=== 2) Direct pose on bad sample ===")
    bad = estimate_pose(BAD)
    assert isinstance(bad, PoseFailure), bad
    print("failure", bad.message)

    stamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    client = TestClient(app)
    headers_a = _auth(client, f"progress_a_{stamp}@example.com")
    headers_b = _auth(client, f"progress_b_{stamp}@example.com")

    client.put(
        "/auth/me/profile",
        headers=headers_a,
        json={
            "height_cm": 175,
            "weight_kg": 72,
            "biological_sex": "male",
            "goal": "general_fitness",
            "activity_level": "moderately_active",
            "equipment_access": "home_gym",
        },
    )

    # Seed a workout log for consistency window
    db = SessionLocal()
    try:
        workout = db.scalars(select(Workout).limit(1)).first()
        assert workout is not None, "seed workouts first"
        me = client.get("/auth/me", headers=headers_a).json()
        from uuid import UUID

        user_id = UUID(me["id"])
        db.add(
            WorkoutLog(
                user_id=user_id,
                workout_id=workout.id,
                completed_at=datetime.now(timezone.utc),
                duration_min=25,
                calories_burned_est=150,
            )
        )
        db.commit()
    finally:
        db.close()

    print("=== API bad upload -> 422, no DB row ===")
    before = client.get("/progress/photos", headers=headers_a).json()
    bad_resp = client.post(
        "/progress/photos",
        headers=headers_a,
        files={"file": ("bad_dark.jpg", BAD.read_bytes(), "image/jpeg")},
    )
    assert bad_resp.status_code == 422, bad_resp.text
    print("422 detail:", bad_resp.json()["detail"])
    after_bad = client.get("/progress/photos", headers=headers_a).json()
    assert len(after_bad) == len(before), "failed pose must not insert progress_photos"

    print("=== API good upload #1 (baseline) ===")
    first = client.post(
        "/progress/photos",
        headers=headers_a,
        files={"file": ("good1.jpg", GOOD.read_bytes(), "image/jpeg")},
    )
    assert first.status_code == 200, first.text
    body1 = first.json()
    assert body1["previous"] is None
    assert body1["current"]["image_url"] == f"/progress/photos/{body1['current']['id']}/image"
    assert "waist_to_hip" in body1["current"]["ratios"]
    print("baseline ratios", body1["current"]["ratios"])
    print("baseline consistency", body1["consistency"])
    print("milestone", body1["milestone"])

    # Activity inside the upcoming previous→current window
    db = SessionLocal()
    try:
        workout = db.scalars(select(Workout).limit(1)).first()
        me = client.get("/auth/me", headers=headers_a).json()
        from uuid import UUID

        db.add(
            WorkoutLog(
                user_id=UUID(me["id"]),
                workout_id=workout.id,
                completed_at=datetime.now(timezone.utc),
                duration_min=20,
                calories_burned_est=120,
            )
        )
        db.commit()
    finally:
        db.close()

    print("=== API good upload #2 (compare + consistency) ===")
    second = client.post(
        "/progress/photos",
        headers=headers_a,
        files={"file": ("good2.jpg", GOOD.read_bytes(), "image/jpeg")},
    )
    assert second.status_code == 200, second.text
    body2 = second.json()
    assert body2["previous"] is not None
    assert body2["consistency"]["workouts_logged"] >= 1
    print("compare consistency", body2["consistency"])
    print("trend points", len(body2["trend"]))
    assert body2["consistency"]["workouts_logged"] >= 1
    assert body2["consistency"]["days_active"] >= 1
    print("OK consistency metrics present: workouts_logged + days_active")

    photo_id = body2["current"]["id"]
    print("=== Owner image fetch ===")
    img_ok = client.get(f"/progress/photos/{photo_id}/image", headers=headers_a)
    assert img_ok.status_code == 200, img_ok.status_code
    assert img_ok.headers["content-type"].startswith("image/")
    assert len(img_ok.content) > 100
    print("owner bytes", len(img_ok.content))

    print("=== Cross-user image fetch -> 404 ===")
    img_other = client.get(f"/progress/photos/{photo_id}/image", headers=headers_b)
    assert img_other.status_code == 404, img_other.status_code
    assert img_other.status_code != 403
    print("cross-user status", img_other.status_code)

    # Confirm row count for user A
    db = SessionLocal()
    try:
        me = client.get("/auth/me", headers=headers_a).json()
        from uuid import UUID

        photos = db.scalars(select(ProgressPhoto).where(ProgressPhoto.user_id == UUID(me["id"]))).all()
        print("stored photos for A", len(photos))
        assert len(photos) == 2
    finally:
        db.close()

    print("ALL MODULE 4 VERIFICATION CHECKS PASSED")


if __name__ == "__main__":
    main()
