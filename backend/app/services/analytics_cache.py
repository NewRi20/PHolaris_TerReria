from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.services.analytics_engine import build_analytics_snapshot

_cached_snapshot: dict[str, Any] | None = None
_cached_at: datetime | None = None
_is_stale: bool = True


def _cache_is_fresh() -> bool:
    if _cached_at is None:
        return False
    age = datetime.utcnow() - _cached_at
    return age <= timedelta(seconds=settings.ANALYTICS_CACHE_TTL_SECONDS)


async def get_analytics_snapshot(db: AsyncSession, force_refresh: bool = False) -> dict[str, Any]:
    global _cached_snapshot, _cached_at, _is_stale

    if not force_refresh and _cached_snapshot is not None and _cache_is_fresh() and not _is_stale:
        return _cached_snapshot

    snapshot = await build_analytics_snapshot(db)
    _cached_snapshot = snapshot
    _cached_at = datetime.utcnow()
    _is_stale = False
    return snapshot


def get_cache_meta() -> dict[str, Any]:
    return {
        "cached_at": _cached_at.isoformat() if _cached_at else None,
        "ttl_seconds": settings.ANALYTICS_CACHE_TTL_SECONDS,
        "is_warm": _cached_snapshot is not None,
        "is_stale": _is_stale,
    }


def mark_analytics_cache_stale() -> None:
    global _is_stale
    _is_stale = True


def clear_analytics_cache() -> None:
    global _cached_snapshot, _cached_at, _is_stale
    _cached_snapshot = None
    _cached_at = None
    _is_stale = True
