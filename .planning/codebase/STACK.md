# Stack

## Languages and Runtime
- Backend: Python 3.13 (local venv in `backend/.venv`).
- Frontend: TypeScript + React 19 on Node ecosystem.
- Database: PostgreSQL (async access via `asyncpg`).

## Backend Frameworks and Core Libraries
- Web API: FastAPI (`backend/app/main.py`).
- ASGI server: Uvicorn (`backend/requirements.txt`).
- ORM: SQLAlchemy 2.x async (`backend/app/database.py`).
- Migrations: Alembic (`backend/alembic/`, `backend/alembic.ini`).
- Validation/settings: Pydantic v2 + pydantic-settings (`backend/app/config.py`).
- Auth crypto: passlib[bcrypt], python-jose.
- Rate limiting: `slowapi` present in dependencies.

## Backend Domain Modules
- Routers: `backend/app/routers/` (`auth.py`, `teachers.py`, `events.py`, `analytics.py`, `maps.py`, `admin.py`, `ai.py`).
- Services: `backend/app/services/` (analytics cache/engine, AI, email, event jobs).
- ORM models: `backend/app/models/`.
- Schemas: `backend/app/schemas/`.

## Frontend Frameworks and Tooling
- Build/dev: Vite 8 (`frontend/vite.config.ts`, `frontend/package.json`).
- UI library: React 19 + ReactDOM.
- Styling: Tailwind CSS v4 (`frontend/src/index.css`).
- Type checking/build: TypeScript (`frontend/tsconfig*.json`).
- Linting: ESLint 9 + TypeScript ESLint (`frontend/eslint.config.js`).

## Configuration Surfaces
- Backend env-based settings: `backend/app/config.py`.
- API runtime wiring + lifespan jobs: `backend/app/main.py`.
- Frontend API URL and env usage in auth context: `frontend/src/setup/auth/authContext.tsx`.

## Operational Characteristics
- Async DB sessions are per-request with commit/rollback in dependency (`backend/app/database.py`).
- Optional background loops for analytics refresh and stale-event voiding via lifespan flags (`backend/app/main.py`).
- In-memory caches used for analytics snapshot and AI recommendation staging (`backend/app/services/analytics_cache.py`, `backend/app/routers/ai.py`).

## Data and Assets
- Region constants/json data in `frontend/src/constant/regions/`.
- Upload parsing supports CSV/XLS/XLSX (`backend/app/utils/csv_parser.py`, `backend/app/routers/admin.py`).

## Repository Shape
- Monorepo split: `backend/` and `frontend/` top-level folders.
- Backend includes tests (`backend/tests/`) and migration history (`backend/alembic/versions/`).
