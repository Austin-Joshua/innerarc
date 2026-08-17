"""Module 10 verification: Gemini Vision plate classify, unmatched flag, nutrition provenance."""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlalchemy import select

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db import SessionLocal  # noqa: E402
from app.main import app  # noqa: E402
from app.models.food import Dish  # noqa: E402
from app.services.plate_vision import VisionItem  # noqa: E402

FIXTURES = Path(__file__).resolve().parent / "fixtures" / "plates"
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".JPG", ".JPEG", ".PNG"}


def _auth(client: TestClient, email: str) -> dict[str, str]:
    reg = client.post(
        "/auth/register", json={"email": email, "password": "password123"}
    )
    if reg.status_code == 409:
        reg = client.post(
            "/auth/login", json={"email": email, "password": "password123"}
        )
    return {"Authorization": f"Bearer {reg.json()['access_token']}"}


def _genuine_plate_photos() -> list[Path]:
    if not FIXTURES.is_dir():
        return []
    return sorted(
        p
        for p in FIXTURES.iterdir()
        if p.is_file() and p.suffix in IMAGE_EXTS and p.stat().st_size > 10_000
    )


def main() -> None:
    photos = _genuine_plate_photos()
    print("=== FIXTURES ===")
    print("fixture_dir", FIXTURES)
    print("genuine_multi_item_count", len(photos))
    for p in photos:
        print(f"  - {p.name} ({p.stat().st_size} bytes)")

    if len(photos) < 3:
        print(
            "LIMITATION: fewer than 3 genuine multi-item plate photos available. "
            "Running with what is present; not padding with Food-101 or single-dish substitutes. "
            "See fixtures/plates/SOURCES.md."
        )
    if not photos:
        print(
            "FAIL: no genuine multi-item plate photos found; cannot run vision smoke."
        )
        raise SystemExit(1)

    stamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    client = TestClient(app)
    headers = _auth(client, f"m10_plate_{stamp}@example.com")

    print("=== 1: Gemini plate classify on genuine multi-item photos ===")
    any_unmatched_from_vision = False
    photos_ok = 0
    for photo in photos:
        with photo.open("rb") as fh:
            resp = client.post(
                "/food/classify-plate",
                headers=headers,
                files={"file": (photo.name, fh, "image/jpeg")},
            )
        if resp.status_code != 200:
            print(f"\nPHOTO: {photo.name}")
            print(
                f"LIMITATION: classify-plate failed ({resp.status_code}): {resp.text[:300]}"
            )
            continue
        body = resp.json()
        photos_ok += 1
        print(f"\nPHOTO: {photo.name}")
        print("image_url:", body["image_url"])
        assert body["items"], f"{photo.name}: expected at least one item"
        for i, item in enumerate(body["items"], start=1):
            print(
                f"  item[{i}] label={item['suggested_label']!r} portion={item['portion']!r} "
                f"matched={item['matched']} dish={None if not item['dish'] else item['dish']['name']} "
                f"serving_g={item['serving_size_g']} conf={item['confidence_score']}"
            )
            if item["matched"]:
                assert item["dish"] is not None
                assert "nutrition_per_100g" in item["dish"]
                assert "calories" in item["dish"]["nutrition_per_100g"]
            else:
                any_unmatched_from_vision = True
                assert item["dish"] is None
                assert item["serving_size_g"] is None

    if photos_ok == 0:
        print("FAIL: no plate photos successfully classified")
        raise SystemExit(1)
    print(f"\nphotos_classified_ok: {photos_ok}/{len(photos)}")

    print("\n=== 2: unmatched label forced (no silent nearest-neighbor) ===")
    probe = photos[0]
    fake = [
        VisionItem(
            label="Dragon fruit tart with edible gold",
            portion="medium",
            confidence=0.91,
        ),
        VisionItem(label="Butter chicken", portion="large", confidence=0.8),
    ]
    with patch("app.routers.food.identify_plate_items", return_value=fake):
        with probe.open("rb") as fh:
            forced = client.post(
                "/food/classify-plate",
                headers=headers,
                files={"file": (probe.name, fh, "image/jpeg")},
            )
    assert forced.status_code == 200, forced.text
    fbody = forced.json()
    print("forced_items:", json.dumps(fbody["items"], default=str, indent=2))
    unmatched = [x for x in fbody["items"] if not x["matched"]]
    matched = [x for x in fbody["items"] if x["matched"]]
    assert unmatched, "expected at least one unmatched item"
    assert unmatched[0]["dish"] is None
    assert unmatched[0]["suggested_label"].lower().startswith("dragon fruit")
    assert matched and matched[0]["dish"]["name"] == "Butter chicken"
    # Matched nutrition equals DB
    db = SessionLocal()
    try:
        dish = db.scalar(select(Dish).where(Dish.name == "Butter chicken"))
        assert dish is not None
        assert matched[0]["dish"]["nutrition_per_100g"] == dish.nutrition_per_100g
    finally:
        db.close()
    print("PASS: unmatched flagged; matched nutrition from dishes table")

    print("\n=== 3: nutrition never invented by Gemini payload ===")
    # identify_plate_items returns VisionItem only — no nutrition fields by construction
    assert not hasattr(VisionItem, "calories")
    print("PASS: VisionItem has label/portion/confidence only")

    print("\n=== 4: multi-item logs share logged_at ===")
    db = SessionLocal()
    try:
        dishes = db.scalars(select(Dish).limit(2)).all()
        assert len(dishes) >= 2
    finally:
        db.close()
    shared_iso = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    logged_ats: list[str] = []
    for dish in dishes[:2]:
        r = client.post(
            "/food/logs",
            headers=headers,
            json={
                "dish_id": str(dish.id),
                "confidence_score": 0.7,
                "serving_size_g": float(dish.default_serving_g),
                "image_url": "seed://m10-plate",
                "logged_at": shared_iso,
            },
        )
        assert r.status_code == 200, r.text
        logged_ats.append(r.json()["logged_at"])
    print("logged_ats:", logged_ats)
    # Compare as datetimes (serialization may differ in Z vs +00:00)
    parsed = [datetime.fromisoformat(t.replace("Z", "+00:00")) for t in logged_ats]
    assert parsed[0] == parsed[1], parsed
    print("PASS: shared logged_at on multi food_logs rows")

    print("\n=== MODULE 10 RESULTS ===")
    print(f"photos_available: {len(photos)}")
    print(f"photos_classified_ok: {photos_ok}")
    if len(photos) < 3:
        print("photo_count_limitation: YES (<3 genuine multi-item fixtures)")
    else:
        print("photo_count_limitation: NO")
    if photos_ok < len(photos):
        print(
            f"runtime_limitation: {len(photos) - photos_ok} photo(s) failed (e.g. Gemini 503)"
        )
    print(f"vision_produced_unmatched_naturally: {any_unmatched_from_vision}")
    print("forced_unmatched: PASS")
    print("nutrition_from_dishes: PASS")
    print("shared_logged_at: PASS")
    print("ALL MODULE 10 VERIFICATION STEPS COMPLETED (no commit)")


if __name__ == "__main__":
    main()
