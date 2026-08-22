"""Module 16 Part 4: user-keyed slowapi limits -> 200 then 429."""

from __future__ import annotations

import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

if not (os.environ.get("PHOTO_ENCRYPTION_KEY") or "").strip():
    from cryptography.fernet import Fernet

    os.environ["PHOTO_ENCRYPTION_KEY"] = Fernet.generate_key().decode()

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from app.rate_limit import DETAIL  # noqa: E402


def _auth(client: TestClient, email: str) -> dict[str, str]:
    reg = client.post(
        "/auth/register", json={"email": email, "password": "password123"}
    )
    if reg.status_code == 409:
        reg = client.post(
            "/auth/login", json={"email": email, "password": "password123"}
        )
    token = reg.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def main() -> None:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    client = TestClient(app)
    headers = _auth(client, f"rate_limit_{stamp}@example.com")

    # Avoid live Gemini — rate limit is what we prove.
    with patch("app.routers.coach.maybe_create_nudge", return_value=None):
        print("=== /coach/nudge 6/hour — first 6 -> 200 ===")
        for i in range(6):
            resp = client.get("/coach/nudge", headers=headers)
            assert resp.status_code == 200, (i, resp.status_code, resp.text)
            print(f"nudge #{i + 1} -> {resp.status_code}")
        print("=== 7th /coach/nudge -> 429 ===")
        limited = client.get("/coach/nudge", headers=headers)
        assert limited.status_code == 429, limited.text
        body = limited.json()
        assert body.get("detail") == DETAIL, body
        print("429 detail:", body["detail"])

    with patch(
        "app.routers.coach.generate_coach_reply",
        return_value="Rate-limit smoke reply.",
    ):
        print("=== /coach/chat 20/hour — first 20 -> 200 ===")
        for i in range(20):
            resp = client.post(
                "/coach/chat",
                headers=headers,
                json={"message": f"ping {i}"},
            )
            assert resp.status_code == 200, (i, resp.status_code, resp.text)
        print("20 OK")
        print("=== 21st /coach/chat -> 429 ===")
        chat_limited = client.post(
            "/coach/chat",
            headers=headers,
            json={"message": "should be limited"},
        )
        assert chat_limited.status_code == 429, chat_limited.text
        assert chat_limited.json().get("detail") == DETAIL
        print("chat 429 detail:", chat_limited.json()["detail"])

    print("ALL MODULE 16 RATE-LIMIT CHECKS PASSED")


if __name__ == "__main__":
    main()
