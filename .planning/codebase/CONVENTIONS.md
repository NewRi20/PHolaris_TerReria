# Conventions

## Python Style and Typing
- Uses modern Python typing syntax (`str | None`, `list[dict]`) across routers/services.
- Async-first backend style: route handlers and service functions are `async def` when DB/network involved.
- `from __future__ import annotations` appears in several modules for forward typing.

## FastAPI Patterns
- Routers split by domain and registered in one place (`backend/app/main.py`).
- Dependency injection via `Depends(...)` for DB sessions and auth checks.
- Errors represented with `HTTPException` and explicit status codes.
- Response models defined in router decorators where stable contracts are expected.

## Database and Transaction Practices
- DB session dependency handles commit/rollback centrally (`backend/app/database.py`).
- Many handlers call `await db.flush()` after inserts/updates to materialize DB-assigned fields before return.
- Explicit `await db.commit()` used in selected flows that require clear transactional boundaries.

## Security Conventions
- Password hashing and JWT token logic centralized in `backend/app/core/security.py`.
- Role checks are enforced in dependencies/router guards, commonly `require_admin` and user-role checks.
- Refresh token route validates token `type` claim before issuing new tokens.

## Service Layer Conventions
- Cross-cutting operations extracted into services (`analytics_cache`, `event_service`, `email_service`, `ai_service`).
- Utility functions support normalization/mapping logic (`backend/app/utils/mappings.py`).
- In-memory process state used for caches and last AI recommendation set.

## Frontend Conventions
- React hooks expose context wrappers and throw if provider missing (`frontend/src/hooks/useAuth.ts`, `frontend/src/hooks/useOnboard.ts`).
- Auth provider encapsulates token persistence and `/api/auth/*` calls.
- TypeScript interfaces/types are colocated in context module for auth domain.

## Documentation Conventions
- Backend has endpoint-centric docs in `backend/app/README.md`.
- Task/integration notes are documented as markdown in `backend/tasks/`.

## Potential Inconsistencies to Monitor
- Mixed quote and indentation styles in frontend files (single vs double quotes; spacing style differences).
- Some modules use broad exception handling (`except Exception`) to keep loops/flows alive; this should be paired with logging policy.
