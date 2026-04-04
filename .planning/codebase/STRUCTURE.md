# Structure

## Top-Level Layout
- `backend/` FastAPI service, migrations, scripts, and tests.
- `frontend/` Vite React TypeScript client.
- `.planning/codebase/` generated architecture reference documents.

## Backend Directory Map
- `backend/app/main.py` application bootstrap and router wiring.
- `backend/app/config.py` environment settings model.
- `backend/app/database.py` engine/session/base definitions.
- `backend/app/core/` auth/dependency helpers.
- `backend/app/models/` SQLAlchemy model definitions.
- `backend/app/schemas/` API input/output contracts.
- `backend/app/routers/` REST endpoint modules by domain.
- `backend/app/services/` domain services and integration logic.
- `backend/app/utils/` import parsing and mapping helpers.

## Backend Operations and Data Lifecycle
- `backend/alembic/` migration environment and versions.
- `backend/scripts/` local seed helpers (admin/demo data).
- `backend/tests/` async unit-style route/service tests with fake DB session.
- `backend/tasks/` markdown task notes for integration planning.

## Frontend Directory Map
- `frontend/src/main.tsx` React root render.
- `frontend/src/App.tsx` current UI shell.
- `frontend/src/setup/auth/` auth context provider and types.
- `frontend/src/setup/app-context-manager/` onboarding context.
- `frontend/src/hooks/` custom hooks for auth/onboarding context access.
- `frontend/src/constant/regions/` regional JSON assets.

## Naming and Module Conventions
- Backend modules use snake_case filenames (`teacher_profile.py`, `analytics_cache.py`).
- Routers grouped by business capability and mounted with `/api/*` prefixes.
- Frontend uses camelCase hooks and PascalCase React context/component files.

## Notable Non-Source Artifacts
- Backend local env file exists (`backend/.env`) and should remain uncommitted.
- Backend virtual environment resides in repo folder (`backend/.venv/`).
- Existing planning/context notes under `backend/.context/`.

## Practical Navigation Shortcuts
- Start backend understanding at `backend/app/main.py`.
- Trace auth flow through `backend/app/routers/auth.py` and `backend/app/core/security.py`.
- Trace event lifecycle in `backend/app/routers/events.py`, `backend/app/services/event_service.py`, and `backend/app/services/email_service.py`.
- Trace frontend auth integration from `frontend/src/setup/auth/authContext.tsx`.
