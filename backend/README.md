# PHOLARIS Backend

Backend for the DOST STAR (Science Teacher Academy for the Regions) system hackathon.
This project focuses on teacher profiling, underserved-area analytics, event workflows, map views, and admin operations.

It is built with FastAPI, SQLAlchemy Async, Neon PostgreSQL, Alembic, and planned AI/email integrations.

## Setup

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
alembic upgrade head (DONT RUN THIS ON PRODUCTION!!!!)
uvicorn app.main:app --reload
```

## .env.example

Use `.env.example` as the local environment template.

Required values:

- `DATABASE_URL` - async PostgreSQL connection string
- `SECRET_KEY` - JWT signing secret

Auth values:

- `ALGORITHM` - JWT algorithm
- `ACCESS_TOKEN_EXPIRE_MINUTES` - access token lifetime
- `REFRESH_TOKEN_EXPIRE_DAYS` - refresh token lifetime

External integrations:

- `GEMINI_API_KEY` - planned AI integration key
- `RESEND_API_KEY` - email delivery key

App access:

- `CORS_ORIGINS` - allowed frontend origins
- `RATE_LIMIT_DEFAULT` - default limiter policy

Analytics cache:

- `ANALYTICS_CACHE_TTL_SECONDS` - in-memory analytics snapshot TTL
- `ANALYTICS_AUTO_REFRESH_ENABLED` - background refresh switch, disabled by default
- `ANALYTICS_REFRESH_INTERVAL_SECONDS` - refresh interval for the optional background loop
- `ANALYTICS_AUTO_REFRESH_ONLY_WHEN_STALE` - only refresh when the cache was marked stale

Stale-event cleanup:

- `STALE_EVENT_VOIDING_ENABLED` - optional background cleanup switch, disabled by default
- `STALE_EVENT_VOIDING_INTERVAL_SECONDS` - interval for the optional stale-event loop
- `STALE_EVENT_VOIDING_LEAD_DAYS` - how close an unapproved event must be before it is voided

## Notes

- The app includes scheduler code paths, but they are disabled by default for the current deployment setup.
- Admin teacher import supports CSV, XLS, and XLSX.
- The analytics cache is in-memory and can be refreshed manually through the API.
- Full endpoint documentation lives in [app/README.md](app/README.md).
