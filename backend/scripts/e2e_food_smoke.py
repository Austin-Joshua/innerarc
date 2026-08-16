"""Smoke: login → classify sample images → log → dashboard."""

from __future__ import annotations

import json
import sys
from pathlib import Path

from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))

from app.main import app  # noqa: E402

SAMPLES = [
    ROOT / "ml" / "data" / "processed" / "innerarc_27" / "pizza",
    ROOT / "ml" / "data" / "processed" / "innerarc_27" / "biryani",
    ROOT / "ml" / "data" / "processed" / "innerarc_27" / "samosa",
]


def first_image(folder: Path) -> Path:
    for path in sorted(folder.iterdir()):
        if path.suffix.lower() in {".jpg", ".jpeg", ".png"}:
            return path
    raise FileNotFoundError(folder)


def main() -> None:
    client = TestClient(app)
    email = "module2.e2e@gmail.com"
    password = "password1"
    reg = client.post("/auth/register", json={"email": email, "password": password})
    if reg.status_code == 409:
        reg = client.post("/auth/login", json={"email": email, "password": password})
    assert reg.status_code == 200, reg.text
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    profile = client.put(
        "/auth/me/profile",
        headers=headers,
        json={
            "height_cm": 175,
            "weight_kg": 72,
            "biological_sex": "male",
            "goal": "fat_loss",
            "activity_level": "moderately_active",
            "equipment_access": "none",
        },
    )
    assert profile.status_code == 200, profile.text

    meals = []
    for folder in SAMPLES:
        image = first_image(folder)
        with image.open("rb") as handle:
            classified = client.post(
                "/food/classify",
                headers=headers,
                files={"file": (image.name, handle, "image/jpeg")},
            )
        assert classified.status_code == 200, classified.text
        body = classified.json()
        logged = client.post(
            "/food/logs",
            headers=headers,
            json={
                "dish_id": body["id"],
                "confidence_score": body["confidence_score"],
                "serving_size_g": body["default_serving_g"],
                "image_url": body["image_url"],
            },
        )
        assert logged.status_code == 200, logged.text
        meals.append(
            {
                "photo": str(image),
                "true_folder": folder.name,
                "predicted": body["name"],
                "class_name": body.get("class_name"),
                "confidence": body["confidence_score"],
                "nutrition_source": body["nutrition_source"],
                "ingredients": [item["name"] for item in body["ingredients"][:5]],
                "serving_g": body["default_serving_g"],
                "nutrition_per_100g": body["nutrition_per_100g"],
            }
        )

    dash = client.get("/dashboard/today", headers=headers)
    assert dash.status_code == 200, dash.text
    report = {"meals": meals, "dashboard": dash.json()}
    out = ROOT / "ml" / "reports" / "e2e_food_smoke.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
