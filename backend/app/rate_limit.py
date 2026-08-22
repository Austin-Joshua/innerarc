"""User-keyed rate limits (slowapi). Key = authenticated user id from JWT."""

from __future__ import annotations

import jwt
from fastapi import Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.config import settings

DETAIL = "Too many requests — try again later."


def rate_limit_key(request: Request) -> str:
    auth = request.headers.get("Authorization") or ""
    if auth.lower().startswith("bearer "):
        token = auth.split(" ", 1)[1].strip()
        try:
            payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
            sub = payload.get("sub")
            if sub:
                return f"user:{sub}"
        except jwt.PyJWTError:
            pass
    return f"ip:{get_remote_address(request)}"


limiter = Limiter(key_func=rate_limit_key, default_limits=[])


def rate_limit_exceeded_handler(
    request: Request, exc: RateLimitExceeded
) -> JSONResponse:
    return JSONResponse(status_code=429, content={"detail": DETAIL})
