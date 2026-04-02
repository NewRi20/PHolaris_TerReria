# PHOLARIS Backend API Documentation

## Summary

Built to support teacher profiling, regional analytics, event generation and approval flows, targeted invitations, map-based underserved-area views, and admin workflows for bulk teacher import and stale-event cleanup.

### Main Backend Modules

- `main.py` - FastAPI application entrypoint, middleware, lifespan, and router wiring
- `config.py` - environment settings
- `database.py` - async SQLAlchemy engine and session factory
- `models/` - ORM tables for users, teachers, trainings, badges, events, sentiments, and email logs
- `schemas/` - request and response models
- `routers/` - API endpoints
- `services/` - analytics, caching, event lifecycle, and email helpers
- `utils/` - CSV and Excel import parser

### Core Features

- JWT authentication with teacher/admin roles
- Teacher onboarding and profile updates
- Training records with automatic badge awarding
- Event lifecycle support: create, update, approve, vote, RSVP, sentiment, invitation sending, and voiding
- Analytics engine for regional workforce and readiness insights
- Map views for regions and upcoming events
- Admin teacher import from CSV, XLS, and XLSX
- Manual stale-event cleanup for deployments without cron jobs
- In-memory analytics snapshot cache with stale marking on writes

## Base URL

```text
http://localhost:8000/api
```

## Authentication

This API uses JWT bearer tokens.
Include the access token in the Authorization header:

```text
Authorization: Bearer <access_token>
```

## Environment Notes

- Scheduler-style background jobs exist in code, but are disabled by default through environment flags.
- Admin teacher import accepts `.csv`, `.xls`, and `.xlsx` files.
- Analytics are served from an in-memory snapshot cache.
- The predictive workforce model is currently a baseline heuristic using region headcount.

## Auth Endpoints

### Register a teacher

**Endpoint:** `POST /auth/register`  
**Description:** Register a new teacher account and return JWT tokens  
**Authentication:** Not required

**Request Body:**

```json
{
  "email": "teacher1@example.com",
  "password": "Password123!",
  "full_name": "Teacher One"
}
```

**Response (201 Created):**

```json
{
  "access_token": "<jwt>",
  "refresh_token": "<jwt>",
  "token_type": "bearer"
}
```

### Login

**Endpoint:** `POST /auth/login`  
**Description:** Authenticate a user and return JWT tokens  
**Authentication:** Not required

**Request Body:**

```json
{
  "email": "teacher1@example.com",
  "password": "Password123!"
}
```

**Response (200 OK):**

```json
{
  "access_token": "<jwt>",
  "refresh_token": "<jwt>",
  "token_type": "bearer"
}
```

### Refresh access token

**Endpoint:** `POST /auth/refresh`  
**Description:** Exchange a refresh token for a new access token  
**Authentication:** Not required

**Request Body:**

```json
{
  "refresh_token": "<refresh_token>"
}
```

**Response (200 OK):**

```json
{
  "access_token": "<jwt>",
  "refresh_token": "<jwt>",
  "token_type": "bearer"
}
```

### Get current user

**Endpoint:** `GET /auth/me`  
**Description:** Return the current authenticated user  
**Authentication:** Required

**Response (200 OK):**

```json
{
  "id": "<uuid>",
  "email": "teacher1@example.com",
  "full_name": "Teacher One",
  "role": "teacher",
  "is_active": true
}
```

## Teacher Endpoints

### Get own teacher profile

**Endpoint:** `GET /teachers/me`  
**Description:** Return own teacher profile, trainings, and badges  
**Authentication:** Teacher

**Response (200 OK):**

```json
{
  "profile": {
    "id": "<uuid>",
    "region": "Region IV-A"
  },
  "trainings": [],
  "badges": [],
  "email": "teacher1@example.com",
  "full_name": "Teacher One"
}
```

### Update own teacher profile

**Endpoint:** `PUT /teachers/me`  
**Description:** Update the current teacher profile  
**Authentication:** Teacher

**Request Body:**

```json
{
  "region": "Region IV-A",
  "division": "Laguna",
  "current_subject": "Physics"
}
```

**Response (200 OK):**

```json
{
  "id": "<uuid>",
  "region": "Region IV-A",
  "division": "Laguna",
  "current_subject": "Physics"
}
```

### Add a training record

**Endpoint:** `POST /teachers/me/trainings`  
**Description:** Add a training record and automatically award a badge  
**Authentication:** Teacher

**Request Body:**

```json
{
  "training_name": "Physics Pedagogy Workshop",
  "training_type": "Workshop",
  "subject_area": "Physics",
  "date_attended": "2026-03-15"
}
```

**Response (201 Created):**

```json
{
  "id": "<uuid>",
  "training_name": "Physics Pedagogy Workshop",
  "subject_area": "Physics"
}
```

### List own trainings

**Endpoint:** `GET /teachers/me/trainings`  
**Description:** List all trainings for the authenticated teacher  
**Authentication:** Teacher

### List own badges

**Endpoint:** `GET /teachers/me/badges`  
**Description:** List all badges for the authenticated teacher  
**Authentication:** Teacher

### List all teachers

**Endpoint:** `GET /teachers/`  
**Description:** List teachers, filterable by region and subject  
**Authentication:** Admin

**Query Parameters:**

- `region` - optional region filter
- `subject` - optional current subject filter
- `skip` - pagination offset
- `limit` - pagination limit

### Get any teacher profile

**Endpoint:** `GET /teachers/{teacher_id}`  
**Description:** Return any teacher profile, trainings, and badges  
**Authentication:** Admin

## Event Endpoints

### List events

**Endpoint:** `GET /events/`  
**Description:** List events, filterable by status, region, and timeline  
**Authentication:** Not required

**Query Parameters:**

- `status`
- `region`
- `timeline`
- `skip`
- `limit`

### Get a specific event

**Endpoint:** `GET /events/{event_id}`  
**Description:** Return full event details  
**Authentication:** Not required

### Create an event

**Endpoint:** `POST /events/`  
**Description:** Create a new event manually  
**Authentication:** Admin

### Update an event

**Endpoint:** `PUT /events/{event_id}`  
**Description:** Update event fields  
**Authentication:** Admin

### Void an event

**Endpoint:** `DELETE /events/{event_id}`  
**Description:** Void an event  
**Authentication:** Admin

### Approve an event

**Endpoint:** `POST /events/{event_id}/approve`  
**Description:** Mark an event as approved  
**Authentication:** Admin

### Send invitations

**Endpoint:** `POST /events/{event_id}/send-invitations`  
**Description:** Trigger targeted invitation delivery for an event  
**Authentication:** Admin

### Vote on an event

**Endpoint:** `POST /events/{event_id}/vote`  
**Description:** Cast an approve/reject vote  
**Authentication:** Any authenticated user

**Request Body:**

```json
{
  "vote": "approve"
}
```

**Response (200 OK):**

```json
{
  "id": "<uuid>",
  "event_id": "<uuid>",
  "user_id": "<uuid>",
  "vote": "approve"
}
```

### RSVP to an event

**Endpoint:** `POST /events/{event_id}/rsvp`  
**Description:** Register interest in an event  
**Authentication:** Teacher

**Request Body:**

```json
{
  "interested": true
}
```

**Response (200 OK):**

```json
{
  "id": "<uuid>",
  "event_id": "<uuid>",
  "teacher_id": "<uuid>",
  "interested": true,
  "attended": false
}
```

### List votes

**Endpoint:** `GET /events/{event_id}/votes`  
**Description:** Return vote records for an event  
**Authentication:** Admin

### List RSVPs

**Endpoint:** `GET /events/{event_id}/rsvps`  
**Description:** Return RSVP records for an event  
**Authentication:** Admin

### Submit event sentiment

**Endpoint:** `POST /events/{event_id}/sentiments`  
**Description:** Submit free-form feedback for an event  
**Authentication:** Teacher

**Request Body:**

```json
{
  "sentiment_text": "This event is highly needed for Grade 9."
}
```

**Response (201 Created):**

```json
{
  "id": "<uuid>",
  "event_id": "<uuid>",
  "teacher_id": "<uuid>",
  "sentiment_text": "This event is highly needed for Grade 9.",
  "sentiment_score": null
}
```

### List event sentiments

**Endpoint:** `GET /events/{event_id}/sentiments`  
**Description:** List sentiment entries for an event  
**Authentication:** Admin

## Analytics Endpoints

### Get analytics overview

**Endpoint:** `GET /analytics/overview`  
**Description:** Return dashboard summary for all regions  
**Authentication:** Admin

### Get region metrics

**Endpoint:** `GET /analytics/region/{region}`  
**Description:** Return combined metrics for a single region  
**Authentication:** Admin

### Get metric-specific views

**Endpoints:**

- `GET /analytics/specialization-proximity`
- `GET /analytics/training-drought`
- `GET /analytics/experience-void`
- `GET /analytics/instructional-risk`
- `GET /analytics/burnout-capacity`
- `GET /analytics/subject-gaps`
- `GET /analytics/training-frequency`
- `GET /analytics/uplift-priority`
- `GET /analytics/predictive-workforce`
- `GET /analytics/regional-readiness`
- `GET /analytics/cache-meta`

### Refresh analytics cache

**Endpoint:** `POST /analytics/refresh`  
**Description:** Force refresh the in-memory analytics snapshot  
**Authentication:** Admin

## Maps Endpoints

### Get regions map summary

**Endpoint:** `GET /maps/regions`  
**Description:** Return region-level map data including teacher counts, subject breakdown, color coding, readiness, and upcoming events  
**Authentication:** Not required

### Get detailed region map view

**Endpoint:** `GET /maps/regions/{region}`  
**Description:** Return detailed metrics and distributions for one region  
**Authentication:** Not required

### Get events grouped by region

**Endpoint:** `GET /maps/events-by-region`  
**Description:** Return upcoming events grouped by region  
**Authentication:** Not required

## Admin Endpoints

### Upload teachers from CSV or Excel

**Endpoint:** `POST /admin/upload-teachers`  
**Description:** Import teacher users and profiles from CSV, XLS, or XLSX and auto-award an import badge  
**Authentication:** Admin

**Upload Field:**

- `file`

**Response (200 OK):**

```json
{
  "message": "Teacher import complete",
  "filename": "teachers.xlsx",
  "rows_received": 100,
  "imported": 95,
  "skipped_existing": 5,
  "temporary_password": "ChangeMe123!"
}
```

### Get admin dashboard

**Endpoint:** `GET /admin/dashboard`  
**Description:** Return a compact analytics summary for admins  
**Authentication:** Admin

### Get underserved areas

**Endpoint:** `GET /admin/underserved-areas`  
**Description:** Return top underserved regions and divisions by uplift priority  
**Authentication:** Admin

### Manually void stale events

**Endpoint:** `POST /admin/void-stale-events`  
**Description:** Void draft or voting events that are close to their event date  
**Authentication:** Admin

## Important Notes

### Data Model Notes

- Teachers are stored in `users` and `teacher_profiles`.
- Trainings are stored in `trainings` and automatically create badges.
- Events are stored in `events` and support votes, RSVPs, and sentiments.
- Email logs are stored in `email_logs` for invitation tracking.

### Analytics Notes

- Specialization proximity measures out-of-field teaching.
- Training drought measures backlog severity over time.
- Training impact velocity measures recent trend direction.
- Predictive workforce is currently a baseline heuristic that only uses regional teacher counts plus fixed growth/retirement assumptions.

### Operational Notes

- Analytics cache refresh is available through the admin refresh endpoint.
- Scheduled job code remains in the project but should stay disabled unless the deployment plan supports it.
- Semantic duplicate detection for AI-generated events is planned, but slug uniqueness is currently the enforced guardrail.
- Imported teachers currently use a temporary password placeholder until a better onboarding flow is added.

## Getting Started

### Run locally

```bash
uvicorn app.main:app --reload
```

### Open API docs

- Swagger UI: `/docs`
- Health check: `/health`

### Example curl flow

```bash
# register
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher1@example.com","password":"Password123!","full_name":"Teacher One"}'

# login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher1@example.com","password":"Password123!"}'

# health
curl http://localhost:8000/health
```
