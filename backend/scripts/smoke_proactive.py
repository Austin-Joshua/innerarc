"""Module 9 verification: logging gap + rate limit, deficit safety, adherence language, 0/1 photo."""

from __future__ import annotations

import re
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from uuid import UUID
from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlalchemy import delete, select
from sqlalchemy.orm import selectinload

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db import SessionLocal  # noqa: E402
from app.main import app  # noqa: E402
from app.models.engagement import AIConversation  # noqa: E402
from app.models.enums import (
    ActivityLevel,
    BiologicalSex,
    EquipmentAccess,
    Goal,
)  # noqa: E402
from app.models.food import Dish, FoodLog  # noqa: E402
from app.models.progress import ProgressPhoto  # noqa: E402
from app.models.user import User, UserProfile  # noqa: E402
from app.models.workout import Workout, WorkoutLog  # noqa: E402
from app.services import proactive as proactive_mod  # noqa: E402
from app.services.coach import SYSTEM_INSTRUCTION, safety_precheck  # noqa: E402
from app.services.proactive import (  # noqa: E402
    PATTERN_ADHERENCE_PROGRESS,
    PATTERN_LOGGING_GAP,
    detect_adherence_progress,
    detect_logging_gap,
    maybe_create_nudge,
    progress_trend_flat_or_declining,
    response_mentions_appearance_or_ratios,
    response_violates_deficit_policy,
)

_APPEARANCE_BAN = re.compile(
    r"\b(waist|hip|shoulder|ratio|shape|appearance|physique|silhouette|"
    r"waist[- ]?to[- ]?hip|shoulder[- ]?to[- ]?waist)\b",
    re.I,
)


def _auth(client: TestClient, email: str) -> dict[str, str]:
    reg = client.post(
        "/auth/register", json={"email": email, "password": "password123"}
    )
    if reg.status_code == 409:
        reg = client.post(
            "/auth/login", json={"email": email, "password": "password123"}
        )
    return {"Authorization": f"Bearer {reg.json()['access_token']}"}


def _ensure_profile(db, user_id: UUID) -> User:
    user = db.scalar(
        select(User).options(selectinload(User.profile)).where(User.id == user_id)
    )
    assert user is not None
    if user.profile is None:
        user.profile = UserProfile(
            user_id=user.id,
            height_cm=175,
            weight_kg=72,
            biological_sex=BiologicalSex.male,
            goal=Goal.fat_loss,
            activity_level=ActivityLevel.moderately_active,
            equipment_access=EquipmentAccess.home_gym,
        )
        db.add(user.profile)
        db.commit()
        db.refresh(user)
    return user


def _clear_activity(db, user_id: UUID) -> None:
    db.execute(delete(FoodLog).where(FoodLog.user_id == user_id))
    db.execute(delete(WorkoutLog).where(WorkoutLog.user_id == user_id))
    db.execute(delete(ProgressPhoto).where(ProgressPhoto.user_id == user_id))
    db.execute(delete(AIConversation).where(AIConversation.user_id == user_id))
    db.commit()


def _add_workout(db, user_id: UUID, when: datetime) -> None:
    workout = db.scalars(select(Workout).limit(1)).first()
    assert workout is not None
    db.add(
        WorkoutLog(
            user_id=user_id,
            workout_id=workout.id,
            completed_at=when,
            duration_min=30,
            calories_burned_est=180,
        )
    )


def _add_photo(db, user_id: UUID, when: datetime, wth: float, stw: float) -> None:
    db.add(
        ProgressPhoto(
            user_id=user_id,
            image_url=f"seed://m9/{when.isoformat()}",
            taken_at=when,
            pose_landmarks_json={"seed": True},
            computed_ratios_json={
                "waist_to_hip": wth,
                "shoulder_to_waist": stw,
                "confidence": "medium",
            },
        )
    )


def _week_monday(d: date) -> date:
    return d - timedelta(days=d.weekday())


def main() -> None:
    results: dict[str, str] = {}
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    client = TestClient(app)
    today = datetime.now(timezone.utc).date()

    print("=== UNIT: safety layer reuse ===")
    src = Path(proactive_mod.__file__).read_text(encoding="utf-8")
    assert "safety_precheck" in src
    assert "generate_coach_reply" in src
    assert "build_user_snapshot" in src
    assert "20%" in SYSTEM_INSTRUCTION
    assert safety_precheck("cut me to a 40% deficit") is not None
    assert response_violates_deficit_policy("Try an 800 kcal day")
    assert response_violates_deficit_policy("Aim for a 35% deficit")
    assert not response_violates_deficit_policy(
        "Log one meal and keep a modest deficit."
    )
    print("safety path wired; deficit post-check unit OK")

    # --- 1. Logging gap + rate limit ---
    print("=== 1: logging gap + UTC-day rate limit ===")
    headers_gap = _auth(client, f"m9_gap_{stamp}@example.com")
    me_gap = client.get("/auth/me", headers=headers_gap).json()
    gap_uid = UUID(me_gap["id"])
    db = SessionLocal()
    try:
        _ensure_profile(db, gap_uid)
        _clear_activity(db, gap_uid)
        # Explicit empty days: nothing seeded → ≥3 day gap from today backward
        match = detect_logging_gap(db, gap_uid, today)
        assert match is not None and match.code == PATTERN_LOGGING_GAP, match
        user = db.scalar(
            select(User).options(selectinload(User.profile)).where(User.id == gap_uid)
        )
        assert user is not None
        with patch(
            "app.services.proactive.generate_coach_reply",
            return_value="Quiet week on logging — add one meal or a short session today.",
        ):
            first = maybe_create_nudge(db, user, today)
        assert first is not None
        assert first.message is None
        first_id = first.id
        snap = first.referenced_data_snapshot or {}
        assert snap.get("proactive_pattern") == PATTERN_LOGGING_GAP
        second = maybe_create_nudge(db, user, today)
        assert second is not None
        assert second.id == first_id, "same-day second call must not create another row"
        count = db.scalars(
            select(AIConversation).where(
                AIConversation.user_id == gap_uid,
                AIConversation.message.is_(None),
            )
        ).all()
        assert len(count) == 1, len(count)
    finally:
        db.close()

    r1 = client.get("/coach/nudge", headers=headers_gap)
    assert r1.status_code == 200, r1.text
    n1 = r1.json()["nudge"]
    assert n1 is not None
    r2 = client.get("/coach/nudge", headers=headers_gap)
    assert r2.status_code == 200, r2.text
    n2 = r2.json()["nudge"]
    assert n2 is not None and n2["id"] == n1["id"]
    results["1_gap_rate_limit"] = "PASS"
    print("PASS: gap nudge created; second same-day check reuses row", n1["id"])

    # --- 2. Deficit / floor safety ---
    print("=== 2: deficit/floor safety (same coach path) ===")
    headers_safe = _auth(client, f"m9_safe_{stamp}@example.com")
    me_safe = client.get("/auth/me", headers=headers_safe).json()
    safe_uid = UUID(me_safe["id"])
    db = SessionLocal()
    try:
        user = _ensure_profile(db, safe_uid)
        _clear_activity(db, safe_uid)
        with patch(
            "app.services.proactive.generate_coach_reply",
            return_value="Since you've been quiet, drop to 800 calories and a 40% deficit tomorrow.",
        ):
            row = maybe_create_nudge(db, user, today)
        assert row is not None
        assert not response_violates_deficit_policy(row.response), row.response
        assert "800" not in row.response
        assert "40%" not in row.response
        assert (row.referenced_data_snapshot or {}).get(
            "safety_postcheck"
        ) == "deficit_policy_replaced"
    finally:
        db.close()
    # Same Module 5 safety path: keyword precheck (no model) + SYSTEM_INSTRUCTION still present
    pre = client.post(
        "/coach/chat",
        headers=headers_safe,
        json={"message": "Please cut me to a 40% deficit starting today."},
    )
    assert pre.status_code == 200, pre.text
    assert pre.json()["safety_precheck_blocked"] is True
    assert (
        "20%" in pre.json()["response"] or "deficit" in pre.json()["response"].lower()
    )
    results["2_deficit_floor"] = "PASS"
    print("PASS: aggressive model output replaced; Module 5 precheck/floor path intact")

    # --- 3. Adherence language (behavioral only) ---
    print("=== 3: adherence+progress language check ===")
    headers_adh = _auth(client, f"m9_adh_{stamp}@example.com")
    me_adh = client.get("/auth/me", headers=headers_adh).json()
    adh_uid = UUID(me_adh["id"])
    db = SessionLocal()
    try:
        user = _ensure_profile(db, adh_uid)
        _clear_activity(db, adh_uid)
        monday = _week_monday(today)
        # Break logging-gap so adherence can be selected
        dish = db.scalars(select(Dish).limit(1)).first()
        assert dish is not None
        db.add(
            FoodLog(
                user_id=adh_uid,
                dish_id=dish.id,
                image_url="seed://m9adh",
                confidence_score=0.9,
                serving_size_g=200,
                logged_at=datetime.combine(
                    today - timedelta(days=1), datetime.min.time(), tzinfo=timezone.utc
                ),
            )
        )
        # Prior 2 weeks: ≥3/week average → at least 6 workouts before this Monday
        for i in range(6):
            day = monday - timedelta(days=1 + i * 2)
            _add_workout(
                db,
                adh_uid,
                datetime.combine(day, datetime.min.time(), tzinfo=timezone.utc)
                + timedelta(hours=12),
            )
        # This week: zero workouts (do not add any on/after monday)
        # ≥2 photos flat/declining: later WTH higher (worse), STW lower (worse)
        _add_photo(
            db,
            adh_uid,
            datetime.combine(
                today - timedelta(days=20), datetime.min.time(), tzinfo=timezone.utc
            ),
            wth=0.72,
            stw=1.45,
        )
        _add_photo(
            db,
            adh_uid,
            datetime.combine(
                today - timedelta(days=2), datetime.min.time(), tzinfo=timezone.utc
            ),
            wth=0.75,  # not improving
            stw=1.40,  # not improving
        )
        db.commit()
        assert progress_trend_flat_or_declining(db, adh_uid)
        match = detect_adherence_progress(db, adh_uid, today)
        assert match is not None and match.code == PATTERN_ADHERENCE_PROGRESS
        assert "0 workouts" in match.coach_prompt.lower()
        assert "waist-to-hip" not in match.coach_prompt.lower()
        assert "shoulder-to-waist" not in match.coach_prompt.lower()
        assert "ratio" not in match.coach_prompt.lower()
        assert "declin" not in match.coach_prompt.lower()
        assert "progress photo" not in match.coach_prompt.lower()

        with patch(
            "app.services.proactive.generate_coach_reply",
            return_value=(
                "You've logged 0 workouts this week after averaging 3+ the prior two weeks. "
                "Schedule one session you can finish and log it."
            ),
        ):
            row = maybe_create_nudge(db, user, today)
        assert row is not None
        text = row.response
        assert not _APPEARANCE_BAN.search(text), text
        assert not response_mentions_appearance_or_ratios(text)
        # Also: if model leaks appearance, post-check replaces
        db.execute(delete(AIConversation).where(AIConversation.user_id == adh_uid))
        db.commit()
        with patch(
            "app.services.proactive.generate_coach_reply",
            return_value="Your waist-to-hip ratio and body shape look flat — fix your appearance.",
        ):
            row2 = maybe_create_nudge(db, user, today)
        assert row2 is not None
        assert not _APPEARANCE_BAN.search(row2.response), row2.response
        assert (row2.referenced_data_snapshot or {}).get(
            "safety_postcheck"
        ) == "appearance_language_replaced"
    finally:
        db.close()

    api_adh = client.get("/coach/nudge", headers=headers_adh)
    assert api_adh.status_code == 200, api_adh.text
    assert api_adh.json()["nudge"] is not None
    assert not _APPEARANCE_BAN.search(api_adh.json()["nudge"]["response"])
    results["3_adherence_language"] = "PASS"
    print("PASS: adherence nudge text has no ratio/shape/appearance jargon")

    # --- 4. 0/1 photo edge ---
    print("=== 4: 0/1 progress photo -> adherence does not fire ===")
    headers_edge = _auth(client, f"m9_edge_{stamp}@example.com")
    me_edge = client.get("/auth/me", headers=headers_edge).json()
    edge_uid = UUID(me_edge["id"])
    db = SessionLocal()
    try:
        user = _ensure_profile(db, edge_uid)
        _clear_activity(db, edge_uid)
        monday = _week_monday(today)
        dish = db.scalars(select(Dish).limit(1)).first()
        assert dish is not None
        db.add(
            FoodLog(
                user_id=edge_uid,
                dish_id=dish.id,
                image_url="seed://m9edge",
                confidence_score=0.9,
                serving_size_g=200,
                logged_at=datetime.combine(
                    today - timedelta(days=1), datetime.min.time(), tzinfo=timezone.utc
                ),
            )
        )
        for i in range(6):
            day = monday - timedelta(days=1 + i * 2)
            _add_workout(
                db,
                edge_uid,
                datetime.combine(day, datetime.min.time(), tzinfo=timezone.utc)
                + timedelta(hours=12),
            )
        db.commit()
        assert (
            detect_adherence_progress(db, edge_uid, today) is None
        ), "0 photos must not fire"
        assert not progress_trend_flat_or_declining(db, edge_uid)

        _add_photo(
            db,
            edge_uid,
            datetime.combine(
                today - timedelta(days=3), datetime.min.time(), tzinfo=timezone.utc
            ),
            wth=0.80,
            stw=1.20,
        )
        db.commit()
        assert (
            detect_adherence_progress(db, edge_uid, today) is None
        ), "1 photo must not fire"
        assert not progress_trend_flat_or_declining(db, edge_uid)

        # Gap should also not be the only story — with recent food, gap false; adherence false → no nudge
        assert detect_logging_gap(db, edge_uid, today) is None
        assert maybe_create_nudge(db, user, today) is None
    finally:
        db.close()
    edge_api = client.get("/coach/nudge", headers=headers_edge)
    assert edge_api.status_code == 200, edge_api.text
    assert edge_api.json()["nudge"] is None
    results["4_photo_edge"] = "PASS"
    print("PASS: 0/1 photo -> adherence+progress does not fire")

    # --- 5. Dismiss does not error / block (client contract) ---
    print("=== 5: dismiss is local-only; GET still returns nudge; nav not blocked ===")
    # Server row remains after "dismiss" — client only hides via AsyncStorage
    still = client.get("/coach/nudge", headers=headers_gap)
    assert still.status_code == 200
    assert still.json()["nudge"] is not None
    # HomeScreen dismiss: setNudge(null) then AsyncStorage.setItem — no API delete, no navigation
    home_src = (ROOT / "frontend" / "src" / "screens" / "HomeScreen.tsx").read_text(
        encoding="utf-8"
    )
    assert "coach_nudge_dismissed" in home_src
    assert "onDismissNudge" in home_src
    assert "setNudge(null)" in home_src
    assert "api.coachNudge()" in home_src or "api.coachNudge()" in (
        ROOT / "frontend" / "src" / "api.ts"
    ).read_text(encoding="utf-8")
    # Dismiss handler must not navigate
    dismiss_fn = home_src.split("onDismissNudge")[1].split("const byType")[0]
    assert "navigate" not in dismiss_fn
    assert "delete" not in dismiss_fn.lower()
    results["5_dismiss"] = "PASS"
    print(
        "PASS: dismiss is AsyncStorage-only; does not delete server row or call navigate"
    )

    print("=== MODULE 9 RESULTS ===")
    for key, val in results.items():
        print(f"{key}: {val}")
    print("ALL MODULE 9 VERIFICATION STEPS COMPLETED (no commit)")


if __name__ == "__main__":
    main()
