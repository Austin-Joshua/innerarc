"""Module 7 verification: wearable sync upsert + dedupe on double sync."""

from __future__ import annotations

import sys
from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID

from fastapi.testclient import TestClient
from sqlalchemy import func, select

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db import SessionLocal  # noqa: E402
from app.main import app  # noqa: E402
from app.models.enums import MetricType  # noqa: E402
from app.models.progress import WearableData  # noqa: E402


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
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    client = TestClient(app)
    headers = _auth(client, f"wearable_{stamp}@example.com")
    me = client.get("/auth/me", headers=headers).json()
    user_id = UUID(me["id"])

    recorded = datetime(2026, 8, 16, 8, 0, 0, tzinfo=timezone.utc)
    payload = {
        "readings": [
            {
                "metric_type": "steps",
                "value": 4200,
                "recorded_at": recorded.isoformat(),
            },
            {
                "metric_type": "heart_rate",
                "value": 72,
                "recorded_at": recorded.isoformat(),
            },
            {"metric_type": "sleep", "value": 7.5, "recorded_at": recorded.isoformat()},
        ]
    }

    first = client.post("/wearable/sync", headers=headers, json=payload)
    assert first.status_code == 200, first.text
    body1 = first.json()
    assert body1["inserted"] == 3 and body1["updated"] == 0
    assert all(r["source"] == "health_connect" for r in body1["readings"])
    print("first sync ok", body1["inserted"], "inserted")

    # Identical timestamps + types: must update, not insert duplicates
    payload["readings"][0]["value"] = 4500
    second = client.post("/wearable/sync", headers=headers, json=payload)
    assert second.status_code == 200, second.text
    body2 = second.json()
    assert body2["inserted"] == 0 and body2["updated"] == 3, body2
    print("second sync ok", body2["updated"], "updated (dedupe)")

    db = SessionLocal()
    try:
        count = db.scalar(
            select(func.count())
            .select_from(WearableData)
            .where(WearableData.user_id == user_id)
        )
        assert count == 3, f"expected 3 rows after double sync, got {count}"
        steps = db.scalars(
            select(WearableData).where(
                WearableData.user_id == user_id,
                WearableData.metric_type == MetricType.steps,
            )
        ).one()
        assert steps.value == 4500
        assert steps.source.value == "health_connect"
        print("db rows=3 steps=4500 source=health_connect")
    finally:
        db.close()

    recent = client.get("/wearable/recent", headers=headers)
    assert recent.status_code == 200, recent.text
    recent_body = recent.json()
    types = {r["metric_type"] for r in recent_body["readings"]}
    assert types == {"steps", "heart_rate", "sleep"}
    print("recent ok", sorted(types))
    print("SMOKE_WEARABLE_OK")


if __name__ == "__main__":
    main()
