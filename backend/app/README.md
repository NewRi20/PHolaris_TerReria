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
**Description:** Authenticate a teacher or admin using a single identifier field (`email`, `teacher_id_number`, or `admin_id`) and return JWT tokens  
**Authentication:** Not required

**Request Body:**

```json
{
  "identifier": "teacher1@example.com",
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
    "user_id": "<uuid>",
    "teacher_id_number": "PSA-2026-001",
    "school": "Manila Science High School",
    "region": "NCR",
    "province": "National Capital Region",
    "grade_level_taught": "Grade 9",
    "current_subject": "Physics",
    "specialization": "Physics",
    "teaching_outside_specialization": false,
    "years_experience": 5,
    "num_classes": 3,
    "students_per_class": [35, 40, 38],
    "working_hours_per_week": 40.0,
    "last_training_date": "2026-03-15",
    "created_at": "2026-03-01T10:00:00Z",
    "updated_at": "2026-04-03T15:30:00Z"
  },
  "trainings": [
    {
      "id": "<uuid>",
      "training_name": "Physics Pedagogy Workshop",
      "training_type": "Workshop",
      "subject_area": "Physics",
      "date_attended": "2026-03-15",
      "duration_days": null,
      "location": null
    }
  ],
  "badges": [
    {
      "id": "<uuid>",
      "badge_name": "Completed: Physics Pedagogy Workshop",
      "description": "Completed training on 2026-03-15",
      "awarded_at": "2026-03-15T10:00:00Z"
    }
  ],
  "email": "teacher1@example.com",
  "full_name": "Teacher One"
}
```

### Update own teacher profile

**Endpoint:** `PUT /teachers/me`  
**Description:** Update the current teacher profile (supports partial updates)  
**Authentication:** Teacher

**Request Body (all fields optional):**

```json
{
  "teacher_id_number": "PSA-2026-001",
  "school": "Manila Science High School",
  "region": "NCR",
  "province": "National Capital Region",
  "grade_level_taught": "Grade 9",
  "current_subject": "Physics",
  "specialization": "Physics",
  "teaching_outside_specialization": false,
  "years_experience": 5,
  "num_classes": 3,
  "students_per_class": [35, 40, 38],
  "working_hours_per_week": 40.0,
  "last_training_date": "2026-03-15"
}
```

**Response (200 OK):**

```json
{
  "id": "<uuid>",
  "user_id": "<uuid>",
  "teacher_id_number": "PSA-2026-001",
  "school": "Manila Science High School",
  "region": "NCR",
  "province": "National Capital Region",
  "grade_level_taught": "Grade 9",
  "current_subject": "Physics",
  "specialization": "Physics",
  "teaching_outside_specialization": false,
  "years_experience": 5,
  "num_classes": 3,
  "students_per_class": [35, 40, 38],
  "working_hours_per_week": 40.0,
  "last_training_date": "2026-03-15",
  "created_at": "2026-03-01T10:00:00Z",
  "updated_at": "2026-04-03T15:30:00Z"
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
  "date_attended": "2026-03-15",
  "duration_days": null,
  "location": null
}
```

**Response (201 Created):**

```json
{
  "id": "<uuid>",
  "teacher_id": "<uuid>",
  "training_name": "Physics Pedagogy Workshop",
  "training_type": "Workshop",
  "subject_area": "Physics",
  "date_attended": "2026-03-15",
  "duration_days": null,
  "location": null,
  "created_at": "2026-04-03T15:30:00Z"
}
```

### List own trainings

**Endpoint:** `GET /teachers/me/trainings`  
**Description:** List all trainings for the authenticated teacher  
**Authentication:** Teacher

**Response (200 OK):**

```json
[
  {
    "id": "<uuid>",
    "teacher_id": "<uuid>",
    "training_name": "Physics Pedagogy Workshop",
    "training_type": "Workshop",
    "subject_area": "Physics",
    "date_attended": "2026-03-15",
    "duration_days": null,
    "location": null,
    "created_at": "2026-04-03T15:30:00Z"
  }
]
```

### List own badges

**Endpoint:** `GET /teachers/me/badges`  
**Description:** List all badges for the authenticated teacher  
**Authentication:** Teacher

**Response (200 OK):**

```json
[
  {
    "id": "<uuid>",
    "teacher_id": "<uuid>",
    "training_id": "<uuid>",
    "badge_name": "Completed: Physics Pedagogy Workshop",
    "description": "Completed training on 2026-03-15",
    "awarded_at": "2026-03-15T10:00:00Z"
  }
]
```

### List all teachers

**Endpoint:** `GET /teachers/`  
**Description:** List teachers, filterable by region and subject  
**Authentication:** Admin

**Query Parameters:**

- `region` - optional region filter
- `subject` - optional current subject filter
- `skip` - pagination offset (default: 0)
- `limit` - pagination limit (default: 50)

**Response (200 OK):**

```json
[
  {
    "id": "<uuid>",
    "user_id": "<uuid>",
    "teacher_id_number": "PSA-2026-001",
    "school": "Manila Science High School",
    "region": "NCR",
    "province": "National Capital Region",
    "grade_level_taught": "Grade 9",
    "current_subject": "Physics",
    "specialization": "Physics",
    "teaching_outside_specialization": false,
    "years_experience": 5,
    "num_classes": 3,
    "students_per_class": [35, 40, 38],
    "working_hours_per_week": 40.0,
    "last_training_date": "2026-03-15",
    "created_at": "2026-03-01T10:00:00Z",
    "updated_at": "2026-04-03T15:30:00Z"
  }
]
```

### Get any teacher profile

**Endpoint:** `GET /teachers/{teacher_id}`  
**Description:** Return any teacher profile, trainings, and badges  
**Authentication:** Admin

**Response (200 OK):**

Same as `GET /teachers/me` response format above.

## Event Endpoints

### List events

**Endpoint:** `GET /events/`  
**Description:** List events, filterable by status, region, and timeline  
**Authentication:** Not required

**Query Parameters:**

- `status` - optional (draft, voting, approved, completed, voided)
- `region` - optional region filter
- `timeline` - optional (past, upcoming, all)
- `skip` - pagination offset (default: 0)
- `limit` - pagination limit (default: 50)

**Response (200 OK):**

```json
{
  "total": 10,
  "items": [
    {
      "id": "<uuid>",
      "title": "Physics Teachers Workshop",
      "slug": "physics-workshop-2026",
      "description": "Advanced pedagogy for physics",
      "status": "approved",
      "target_subject": "Physics",
      "target_regions": ["NCR"],
      "target_provinces": ["National Capital Region"],
      "event_date": "2026-05-15T09:00:00Z",
      "location": "Manila Convention Center",
      "created_at": "2026-04-01T10:00:00Z"
    }
  ]
}
```

### Get a specific event

**Endpoint:** `GET /events/{event_id}`  
**Description:** Return full event details  
**Authentication:** Not required

**Response (200 OK):**

```json
{
  "id": "<uuid>",
  "title": "Physics Teachers Workshop",
  "slug": "physics-workshop-2026",
  "description": "Advanced pedagogy for physics",
  "event_type": "Workshop",
  "status": "approved",
  "target_subject": "Physics",
  "target_subject_branch": null,
  "target_grade_levels": ["Grade 9", "Grade 10"],
  "target_regions": ["NCR"],
  "target_provinces": ["National Capital Region"],
  "target_audience_criteria": null,
  "recommended_format": "In-person",
  "priority_timeline": "immediate",
  "learning_objectives": ["Master modern physics teaching techniques"],
  "suggested_topics": ["Quantum mechanics", "Thermodynamics"],
  "event_date": "2026-05-15T09:00:00Z",
  "location": "Manila Convention Center",
  "rsvp_deadline": "2026-05-08T23:59:59Z",
  "created_at": "2026-04-01T10:00:00Z",
  "updated_at": "2026-04-03T15:30:00Z"
}
```

### Create an event

**Endpoint:** `POST /events/`  
**Description:** Create a new event manually  
**Authentication:** Admin

**Request Body:**

```json
{
  "title": "Physics Teachers Workshop",
  "slug": "physics-workshop-2026",
  "description": "Advanced pedagogy for physics",
  "event_type": "Workshop",
  "target_subject": "Physics",
  "target_grade_levels": ["Grade 9", "Grade 10"],
  "target_regions": ["NCR"],
  "target_provinces": ["National Capital Region"],
  "recommended_format": "In-person",
  "priority_timeline": "immediate",
  "learning_objectives": ["Master modern physics teaching techniques"],
  "suggested_topics": ["Quantum mechanics", "Thermodynamics"],
  "event_date": "2026-05-15T09:00:00Z",
  "location": "Manila Convention Center",
  "rsvp_deadline": "2026-05-08T23:59:59Z"
}
```

**Response (201 Created):**

Same structure as Get a specific event above.

### Update an event

**Endpoint:** `PUT /events/{event_id}`  
**Description:** Update event fields (supports partial updates)  
**Authentication:** Admin

**Request Body (all fields optional):**

```json
{
  "title": "Physics Teachers Advanced Workshop",
  "description": "Updated description",
  "status": "voting",
  "target_provinces": ["National Capital Region", "Laguna"],
  "event_date": "2026-05-20T09:00:00Z"
}
```

**Response (200 OK):**

Same structure as Get a specific event above.

### Void an event

**Endpoint:** `DELETE /events/{event_id}`  
**Description:** Void an event (mark as voided)  
**Authentication:** Admin

**Response (204 No Content)**

### Approve an event

**Endpoint:** `POST /events/{event_id}/approve`  
**Description:** Mark an event as approved  
**Authentication:** Admin

**Response (200 OK):**

Same structure as Get a specific event above.

### Send invitations

**Endpoint:** `POST /events/{event_id}/send-invitations`  
**Description:** Trigger targeted invitation delivery for an event  
**Authentication:** Admin

**Response (200 OK):**

```json
{
  "message": "Invitations sent",
  "event_id": "<uuid>",
  "recipients_count": 42,
  "failed_count": 0
}
```

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

**Response (200 OK):**

```json
[
  {
    "id": "<uuid>",
    "event_id": "<uuid>",
    "user_id": "<uuid>",
    "vote": "approve",
    "created_at": "2026-04-03T15:30:00Z"
  }
]
```

### List RSVPs

**Endpoint:** `GET /events/{event_id}/rsvps`  
**Description:** Return RSVP records for an event  
**Authentication:** Admin

**Response (200 OK):**

```json
[
  {
    "id": "<uuid>",
    "event_id": "<uuid>",
    "teacher_id": "<uuid>",
    "interested": true,
    "attended": false,
    "created_at": "2026-04-03T15:30:00Z",
    "updated_at": "2026-04-03T15:30:00Z"
  }
]
```

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

**Response (200 OK):**

```json
[
  {
    "id": "<uuid>",
    "event_id": "<uuid>",
    "teacher_id": "<uuid>",
    "sentiment_text": "This event is highly needed for Grade 9.",
    "sentiment_score": 0.85,
    "created_at": "2026-04-03T15:30:00Z"
  }
]
```

## AI Endpoints

### Generate AI Event Proposals

**Endpoint:** `POST /ai/generate-events`  
**Description:** Analyze metrics and generate event recommendations using Gemini  
**Authentication:** Admin

**Response (200 OK):**

```json
{
  "generated_events": [
    {
      "title": "Physics Teachers Workshop",
      "slug": "physics-workshop-2026",
      "description": "Workshop to address physics teaching gaps",
      "target_subject": "Physics",
      "target_regions": ["NCR"],
      "target_provinces": ["National Capital Region"],
      "ai_rationale": {
        "reason": "High specialization gap identified",
        "confidence": 0.92
      }
    }
  ],
  "analysis_timestamp": "2026-04-03T15:30:00Z"
}
```

### Get AI Recommendations

**Endpoint:** `GET /ai/recommendations`  
**Description:** Return the latest cached AI recommendations  
**Authentication:** Admin

**Response (200 OK):**

Same structure as Generate AI Event Proposals above.

### Generate Invitation Emails

**Endpoint:** `POST /ai/generate-invitations/{event_id}`  
**Description:** Draft customized invitation emails using AI based on event constraints  
**Authentication:** Admin

**Response (200 OK):**

```json
{
  "event_id": "<uuid>",
  "invitations_generated": 42,
  "sample_invitation": {
    "recipient": "teacher1@example.com",
    "subject": "You're invited: Physics Teachers Workshop",
    "body": "Dear Physics Teacher,\n\nWe would like to invite you to our upcoming Physics Teachers Workshop..."
  }
}
```

## Analytics Endpoints

### Get analytics overview

**Endpoint:** `GET /analytics/overview`  
**Description:** Return dashboard summary for all regions  
**Authentication:** Admin

**Response (200 OK):**

```json
{
  "total_teachers": 1250,
  "total_trainings": 356,
  "average_experience_years": 7.2,
  "regional_readiness": 0.72,
  "regional_summary": [
    {
      "region": "NCR",
      "teacher_count": 285,
      "readiness_score": 0.85,
      "specialization_proximity": 0.92
    }
  ]
}
```

### Get region metrics

**Endpoint:** `GET /analytics/region/{region}`  
**Description:** Return combined metrics for a single region  
**Authentication:** Admin

**Response (200 OK):**

```json
{
  "region": "NCR",
  "metrics": {
    "specialization_proximity": 0.92,
    "training_drought": 45,
    "experience_void": 0.15,
    "instructional_risk": 0.22,
    "burnout_capacity": 0.68,
    "subject_gaps": {"Physics": 12, "Chemistry": 8},
    "training_frequency": 3.2,
    "uplift_priority": 6.5,
    "predictive_workforce": 298,
    "regional_readiness": 0.85
  },
  "teacher_count": 285,
  "last_updated": "2026-04-03T15:30:00Z"
}
```

### Get metric-specific views

**Endpoints:**

- `GET /analytics/specialization-proximity` - ratio of teachers in field vs. out-of-field
- `GET /analytics/training-drought` - days since last training by region+province
- `GET /analytics/experience-void` - distribution of inexperienced teachers
- `GET /analytics/instructional-risk` - workload and burnout indicators
- `GET /analytics/burnout-capacity` - risk scores for teacher capacity
- `GET /analytics/subject-gaps` - shortage counts by subject area
- `GET /analytics/training-frequency` - average trainings per teacher by region
- `GET /analytics/uplift-priority` - composite priority scores for investment
- `GET /analytics/predictive-workforce` - projected teacher counts by region
- `GET /analytics/regional-readiness` - overall readiness aggregated by region
- `GET /analytics/cache-meta` - metadata about cache freshness and compute time

**Response (200 OK) - varies by metric, example:**

```json
{
  "metric_name": "specialization-proximity",
  "data": [
    {
      "region": "NCR",
      "province": "National Capital Region",
      "in_field_count": 250,
      "out_of_field_count": 35,
      "proximity_ratio": 0.92
    }
  ]
}
```

### Refresh analytics cache

**Endpoint:** `POST /analytics/refresh`  
**Description:** Force refresh the in-memory analytics snapshot  
**Authentication:** Admin

**Response (200 OK):**

```json
{
  "message": "Analytics cache refreshed",
  "computed_at": "2026-04-03T15:30:00Z",
  "cache_duration_ms": 1245
}
```

## Maps Endpoints

### Get regions map summary

**Endpoint:** `GET /maps/regions`  
**Description:** Return region-level map data including teacher counts, subject breakdown, color coding, readiness, and upcoming events  
**Authentication:** Not required

**Response (200 OK):**

```json
{
  "regions": [
    {
      "code": "NCR",
      "name": "National Capital Region",
      "teacher_count": 285,
      "readiness_score": 0.85,
      "color": "green",
      "subject_breakdown": {
        "Physics": 45,
        "Chemistry": 38,
        "Biology": 42,
        "Mathematics": 60,
        "English": 55,
        "Other": 45
      },
      "upcoming_events_count": 3
    }
  ]
}
```

### Get detailed region map view

**Endpoint:** `GET /maps/regions/{region}`  
**Description:** Return detailed metrics and distributions for one region  
**Authentication:** Not required

**Response (200 OK):**

```json
{
  "region": "NCR",
  "teacher_count": 285,
  "readiness_score": 0.85,
  "metrics": {
    "specialization_proximity": 0.92,
    "training_drought": 45,
    "experience_void": 0.15
  },
  "subject_distribution": {
    "Physics": {"count": 45, "percent": 15.8},
    "Chemistry": {"count": 38, "percent": 13.3}
  },
  "provinces": [
    {
      "name": "National Capital Region",
      "teacher_count": 285,
      "readiness_score": 0.85
    }
  ]
}
```

### Get events grouped by region

**Endpoint:** `GET /maps/events-by-region`  
**Description:** Return upcoming events grouped by region  
**Authentication:** Not required

**Response (200 OK):**

```json
{
  "events_by_region": {
    "NCR": [
      {
        "id": "<uuid>",
        "title": "Physics Teachers Workshop",
        "event_date": "2026-05-15T09:00:00Z",
        "location": "Manila Convention Center",
        "rsvp_count": 42
      }
    ],
    "R1": [
      {
        "id": "<uuid>",
        "title": "Science Education Summit",
        "event_date": "2026-05-20T08:00:00Z",
        "location": "Dagupan City",
        "rsvp_count": 28
      }
    ]
  }
}
```

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

**Response (200 OK):**

```json
{
  "total_teachers": 1250,
  "total_trainings": 356,
  "pending_events": 8,
  "sent_invitations": 2341,
  "regional_readiness": 0.72,
  "top_underserved": [
    {
      "region": "TCL",
      "province": "Tarlac",
      "priority_score": 8.5,
      "specialization_gap": 12
    }
  ]
}
```

### Get underserved areas

**Endpoint:** `GET /admin/underserved-areas`  
**Description:** Return top underserved regions and provinces by uplift priority  
**Authentication:** Admin

**Response (200 OK):**

```json
{
  "top_underserved": [
    {
      "region": "TCL",
      "province": "Tarlac",
      "uplift_priority": 8.5,
      "specialization_gap": 12,
      "training_drought_days": 245,
      "teacher_count": 156
    },
    {
      "region": "ILO",
      "province": "Iloilo",
      "uplift_priority": 7.9,
      "specialization_gap": 8,
      "training_drought_days": 198,
      "teacher_count": 142
    }
  ]
}
```

### Manually void stale events

**Endpoint:** `POST /admin/void-stale-events`  
**Description:** Void draft or voting events that are close to their event date  
**Authentication:** Admin

**Request Body:**

```json
{
  "days_threshold": 7
}
```

**Response (200 OK):**

```json
{
  "message": "Stale events voided",
  "voided_count": 3
}
```

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
  -d '{"identifier":"teacher1@example.com","password":"Password123!"}'

# seed admin account (runs interactively, prompting for email, password, and full name)
python scripts/seed_admin.py
# You will be prompted to enter admin email, password, and full name
# Admin ID will be auto-generated

# health
curl http://localhost:8000/health
```
