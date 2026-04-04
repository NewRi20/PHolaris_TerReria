# Testing

## Test Framework and Runtime
- Test runner: pytest (`backend/pytest.ini`).
- Async test support: pytest-asyncio with `asyncio_mode = auto`.
- Tests are located under `backend/tests/`.

## Current Test Inventory
- `backend/tests/test_auth_routes.py`
- `backend/tests/test_event_routes.py`
- `backend/tests/test_ai_routes.py`
- `backend/tests/test_seed_demo_data.py`
- `backend/tests/test_service_helpers.py`
- Shared setup/helpers: `backend/tests/conftest.py`, `backend/tests/fakes.py`

## Test Style
- Route handlers are tested as callable functions with fake sessions instead of full HTTP client integration.
- Fake DB result/session abstractions simulate SQLAlchemy behavior (`FakeSession`, `FakeResult`).
- Monkeypatching is used for isolating token generation and external side effects.

## Coverage Characteristics
- Good focus on auth and event route behaviors (happy path + selected failures).
- AI routes and helper services have dedicated tests.
- Seed script behavior has direct tests.

## What Is Not Evident Yet
- No explicit frontend tests found in `frontend/`.
- No end-to-end API tests using actual app instance and ASGI test client observed in sampled files.
- No explicit mutation/performance/load tests observed.

## Data and Env Isolation
- `backend/tests/conftest.py` sets deterministic env defaults for DB URL, secrets, and integration keys.
- Test strategy appears to avoid live external API/network calls by stubbing boundaries.

## Reliability Considerations
- Fake-session strategy is fast and deterministic, but may miss integration regressions in SQLAlchemy query composition and transaction semantics.
- Consider adding a small set of integration tests with a test database for critical flows (auth login/register, event invite path, AI approval persistence).

## Suggested Next Testing Steps
- Add backend integration tests around auth and event workflows with FastAPI TestClient/AsyncClient.
- Add smoke tests for admin upload edge cases (file format errors, malformed rows).
- Introduce frontend component/context tests once UI implementation expands beyond scaffold state.
