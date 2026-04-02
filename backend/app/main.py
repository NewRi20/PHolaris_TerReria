import asyncio
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import settings
from app.database import async_session, get_db
from app.routers import auth, teachers, events, analytics, maps, admin
from app.services.analytics_cache import get_analytics_snapshot, get_cache_meta
from app.services.event_service import void_stale_events


async def _analytics_auto_refresh_loop() -> None:
    while True:
        await asyncio.sleep(settings.ANALYTICS_REFRESH_INTERVAL_SECONDS)

        cache_meta = get_cache_meta()

        # Skip background work until cache has been used at least once.
        if not cache_meta.get("is_warm"):
            continue

        # Default behavior: recompute only when writes marked cache stale.
        if settings.ANALYTICS_AUTO_REFRESH_ONLY_WHEN_STALE and not cache_meta.get("is_stale"):
            continue

        try:
            async with async_session() as db:
                await get_analytics_snapshot(db, force_refresh=True)
        except Exception:
            # Keep loop alive; cache can still be refreshed by explicit admin endpoint.
            continue


async def _stale_event_voiding_loop() -> None:
    interval_seconds = max(300, settings.STALE_EVENT_VOIDING_INTERVAL_SECONDS)
    lead_days = max(1, settings.STALE_EVENT_VOIDING_LEAD_DAYS)

    while True:
        await asyncio.sleep(interval_seconds)

        try:
            async with async_session() as db:
                await void_stale_events(db, lead_days=lead_days)
                await db.commit()
        except Exception:
            # Keep loop alive even if one cycle fails.
            continue


@asynccontextmanager
async def lifespan(app: FastAPI):
    refresh_task = None
    stale_event_task = None

    if settings.ANALYTICS_AUTO_REFRESH_ENABLED:
        refresh_task = asyncio.create_task(_analytics_auto_refresh_loop())

    if settings.STALE_EVENT_VOIDING_ENABLED:
        stale_event_task = asyncio.create_task(_stale_event_voiding_loop())

    yield

    if refresh_task:
        refresh_task.cancel()
        with suppress(asyncio.CancelledError):
            await refresh_task

    if stale_event_task:
        stale_event_task.cancel()
        with suppress(asyncio.CancelledError):
            await stale_event_task


app = FastAPI(
    title="POLARIS API",
    description="POLARIS — Backend",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(teachers.router)
app.include_router(events.router)
app.include_router(analytics.router)
app.include_router(maps.router)
app.include_router(admin.router)


@app.get("/health")
async def health_check():
    """Quick check that the API and DB are alive."""
    try:
        async for db in get_db():
            await db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {e}"

    return {"status": "healthy", "database": db_status}
