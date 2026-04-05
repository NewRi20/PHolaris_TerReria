from __future__ import annotations

from typing import cast

from fastapi import FastAPI
from fastapi.responses import Response
from starlette.requests import Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from app.config import settings

# Baseline strict limits inspired by common API hardening tables.
RATE_LIMITS = {
    "AUTH_LOGIN": "10/minute",
    "AUTH_REGISTER": "5/minute",
    "AUTH_REFRESH": "30/minute",
    "AI_GENERATE": "5/minute",
    "AI_SCORE": "10/minute",
    "INVITATIONS_SEND": "10/minute",
    "ADMIN_UPLOAD": "5/minute",
}


def _rate_limit_key(request: Request) -> str:
    # Prefer explicit authenticated identifier if upstream middleware set it.
    user_id = getattr(request.state, "user_id", None)
    if user_id:
        return f"user:{user_id}"

    # Proxy-aware fallback.
    forwarded_for = request.headers.get("x-forwarded-for", "")
    if forwarded_for:
        first_ip = forwarded_for.split(",", 1)[0].strip()
        if first_ip:
            return f"ip:{first_ip}"

    real_ip = request.headers.get("x-real-ip", "").strip()
    if real_ip:
        return f"ip:{real_ip}"

    return f"ip:{get_remote_address(request)}"


limiter = Limiter(key_func=_rate_limit_key, default_limits=[settings.RATE_LIMIT_DEFAULT])


def _typed_rate_limit_handler(request: Request, exc: Exception) -> Response:
    return _rate_limit_exceeded_handler(request, cast(RateLimitExceeded, exc))


def init_rate_limiter(app: FastAPI) -> None:
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _typed_rate_limit_handler)
    app.add_middleware(SlowAPIMiddleware)
