# Integrations

## Database
- Primary data store: PostgreSQL using async SQLAlchemy engine (`backend/app/database.py`).
- Driver: `asyncpg` with explicit SSL context in connect args.
- Migration system: Alembic (`backend/alembic/`, `backend/alembic/versions/`).

## AI Provider
- Provider: Google Gemini via `google-genai` (`backend/app/services/ai_service.py`).
- Features using AI:
  - Event recommendation generation.
  - Personalized invitation draft generation.
  - Sentiment scoring.
- Config key: `GEMINI_API_KEY` from settings (`backend/app/config.py`).
- Exposure point: `backend/app/routers/ai.py` (admin-only endpoints).

## Email Provider
- Provider: Resend Python SDK (`backend/app/services/email_service.py`).
- Config key: `RESEND_API_KEY`.
- Main flow: event invite dispatch + send logging to `EmailLog` model.
- Endpoint trigger: `/api/events/{event_id}/send-invitations` in `backend/app/routers/events.py`.

## Authentication and Authorization
- JWT creation/verification: `backend/app/core/security.py`.
- Token shapes: access + refresh with `type` claims.
- Auth endpoints: `backend/app/routers/auth.py`.
- Role enforcement dependencies: `backend/app/core/dependencies.py` and router-level guards.

## Browser/Frontend Integration
- Frontend stores tokens in localStorage and calls backend REST APIs (`frontend/src/setup/auth/authContext.tsx`).
- CORS origins configured by env list (`backend/app/config.py`, middleware in `backend/app/main.py`).

## File Import and Tabular Data
- Teacher import accepts CSV/XLS/XLSX files (`backend/app/routers/admin.py`).
- Parsing stack includes pandas/openpyxl in `backend/requirements.txt`.

## Environment and Runtime Integrations
- `.env` file loading handled by pydantic-settings (`backend/app/config.py`).
- Optional periodic jobs integrated via FastAPI lifespan task loops (`backend/app/main.py`).

## Observed External Surfaces
- No message broker integration observed.
- No object storage integration observed.
- No payment/notification queue integration observed.
