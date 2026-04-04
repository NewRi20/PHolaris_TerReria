# Architecture

## High-Level Pattern
- Layered monolith with clear module boundaries inside backend app package.
- Main layers:
  - API layer: routers in `backend/app/routers/`.
  - Domain/data layer: SQLAlchemy models in `backend/app/models/`.
  - Service layer: orchestration/business logic in `backend/app/services/`.
  - Contracts layer: Pydantic schemas in `backend/app/schemas/`.

## Backend Entry Points
- HTTP entry point: FastAPI app in `backend/app/main.py`.
- Router registration centralized in app bootstrap (`main.py`).
- Health endpoint performs DB probe via `SELECT 1`.

## Request Flow
- Request enters FastAPI route.
- Dependencies resolve auth and DB session (`backend/app/core/dependencies.py`, `backend/app/database.py`).
- Router executes SQLAlchemy queries or delegates to service functions.
- Response serialized through schema models where configured.

## Persistence and Transactions
- Async SQLAlchemy session factory in `backend/app/database.py`.
- Unit-of-work behavior: `get_db` yields session then commits, with rollback on exception.
- Some endpoints also perform explicit `commit()` operations for deterministic boundaries.

## Background Processing Model
- No worker queue found.
- In-process async loops created in lifespan for:
  - Analytics snapshot periodic refresh.
  - Stale-event voiding.
- Loops are feature-flagged from env settings (`backend/app/config.py`).

## Analytics and Caching
- Analytics snapshot computed by service layer and cached in-process (`backend/app/services/analytics_cache.py`).
- Cache has TTL + stale flag invalidation semantics.
- Admin routes expose cache diagnostics and refresh interactions.

## AI and Event Pipeline
- AI routes call AI service using analytics snapshot plus recent events.
- AI recommendations are staged in memory before optional approval persistence (`backend/app/routers/ai.py`).
- Event invitation flow resolves matching teachers and calls email integration.

## Frontend Architecture Snapshot
- Early-stage React app bootstrap in `frontend/src/main.tsx` and `frontend/src/App.tsx`.
- Context-driven auth setup implemented (`frontend/src/setup/auth/authContext.tsx`).
- Onboarding/auth hooks prepared but routing/UI composition appears incomplete.

## Deployment Shape (Implied)
- Single backend process with API + optional background loops.
- Separate static frontend build via Vite.
- Shared contract through REST and JWT bearer auth.
