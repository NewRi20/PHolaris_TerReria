# PHOLARIS Backend API Documentation

## Summary

Built to support teacher profiling, regional analytics, event generation and approval flows, targeted invitations, map-based underserved-area views, and admin workflows for bulk teacher import and stale-event cleanup.

### Main Backend Modules

- `main.py` - FastAPI application entrypoint, middleware, lifespan, and router wiring
- `config.py` - environment settings
- `database.py` - async SQLAlchemy engine and session factory
- `core/` - auth dependencies, security utilities, rate limiting, structured logging, and exception handlers
- `models/` - ORM tables for users, teachers, trainings, badges, events, sentiments, and email logs
- `schemas/` - request and response models
- `routers/` - API endpoints
- `services/` - analytics, caching, event lifecycle, and email helpers
- `utils/` - CSV/Excel import parser and pagination helpers

### Core Features

- JWT authentication with teacher/admin roles
- Route-level and default API rate limiting (SlowAPI)
- Structured JSON request logging with request correlation IDs
- Standardized API error envelope via custom exception handling
- Teacher onboarding and profile updates
- Training records with automatic badge awarding
- Event lifecycle support: create, update, approve, vote, RSVP, sentiment, invitation sending, and voiding
- Analytics engine for regional workforce and readiness insights
- **AI-powered event generation** using Google Gemini: generates 5 recommendations based on regional metrics
- **Fuzzy semantic deduplication** for AI recommendations against recent events to reduce near-duplicate proposals
- **Personalized invitation drafting**: generates customized email invitations for matched teachers
- **Sentiment scoring**: AI-based batch scoring of teacher feedback (-1.0 to 1.0 scale)
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

Auth endpoints are rate limited:

- `POST /auth/register` - `5/minute`
- `POST /auth/login` - `10/minute`
- `POST /auth/refresh` - `30/minute`

When a rate limit is exceeded, API returns `429 Too Many Requests`.

## Error and Logging Conventions

- API errors follow a consistent envelope:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "request_id": "<uuid-or-client-request-id>"
  }
}
```

- Validation failures include `error.details.issues`.
- Unhandled server exceptions are sanitized for clients and logged server-side.
- Request/response logging is structured JSON with `x-request-id` propagation for traceability.
- The current implementation uses an internal JSON formatter in `core/logging.py` (not `structlog`).

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
- `skip` - pagination offset (default: 0, clamped to `>= 0`)
- `limit` - pagination limit (default: 50, clamped to `1..100`)

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
- `skip` - pagination offset (default: 0, clamped to `>= 0`)
- `limit` - pagination limit (default: 50, clamped to `1..100`)

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
**Description:** Analyze metrics and generate event recommendations using Gemini with fuzzy deduplication against recent non-void events  
**Authentication:** Admin

**Response (200 OK):**

```json
{
  "status": "generated",
  "count": 5,
  "recommendations": [
    {
      "title": "Physics Teachers Workshop",
      "slug": "physics-workshop-2026",
      "description": "Workshop to address physics teaching gaps",
      "event_type": "Workshop",
      "target_subject": "Physics",
      "target_subject_branch": null,
      "target_grade_levels": ["Grade 9", "Grade 10"],
      "target_regions": ["NCR"],
      "target_provinces": ["National Capital Region"],
      "target_audience_criteria": {
        "max_years_experience": 5,
        "teaching_outside_specialization": true,
        "subjects": ["Physics"]
      },
      "recommended_format": "In-person",
      "priority_timeline": "High",
      "suggested_duration_days": 3,
      "suggested_date_earliest": "2026-05-15",
      "suggested_date_latest": "2026-05-31",
      "location": "Manila Convention Center",
      "expected_impact": {
        "attendance_estimate": 150,
        "impact_type": "upskilling"
      },
      "learning_objectives": ["Teachers will master modern physics pedagogy", "Teachers will understand inquiry-based learning"],
      "suggested_topics": ["Quantum mechanics fundamentals", "Thermodynamics applications"],
      "format_justification": "In-person format enables hands-on demonstrations and peer collaboration",
      "tags": ["physics", "pedagogy", "upskilling"],
      "ai_generated": true,
      "ai_rationale": {
        "generated_at": "2026-04-03T15:30:00Z",
        "method": "regional_analytics_targeting",
        "snapshot_timestamp": "2026-04-03T15:29:00Z"
      },
      "ai_analysis_snapshot": {
        "priority_regions": ["NCR", "R3", "R4"],
        "critical_regions": 3,
        "subject_shortages": 8
      }
    }
  ],
  "generated_at": "2026-04-03T15:30:00Z",
  "note": "Recommendations are NOT auto-approved. Review and approve manually."
}
```

### Get AI Recommendations

**Endpoint:** `GET /ai/recommendations`  
**Description:** Return the latest cached AI recommendations  
**Authentication:** Admin

**Response (200 OK):**

```json
{
  "count": 5,
  "recommendations": [
    {
      "title": "Physics Teachers Workshop",
      "slug": "physics-workshop-2026",
      "description": "Workshop to address physics teaching gaps",
      "event_type": "Workshop",
      "target_subject": "Physics",
      "target_subject_branch": null,
      "target_grade_levels": ["Grade 9", "Grade 10"],
      "target_regions": ["NCR"],
      "target_provinces": ["National Capital Region"],
      "target_audience_criteria": {
        "max_years_experience": 5,
        "teaching_outside_specialization": true,
        "subjects": ["Physics"]
      },
      "recommended_format": "In-person",
      "priority_timeline": "High",
      "suggested_duration_days": 3,
      "suggested_date_earliest": "2026-05-15",
      "suggested_date_latest": "2026-05-31",
      "location": "Manila Convention Center",
      "expected_impact": {
        "attendance_estimate": 150,
        "impact_type": "upskilling"
      },
      "learning_objectives": ["Teachers will master modern physics pedagogy"],
      "suggested_topics": ["Quantum mechanics", "Thermodynamics"],
      "format_justification": "In-person format enables hands-on demonstrations",
      "tags": ["physics", "pedagogy"],
      "ai_generated": true,
      "ai_rationale": {
        "generated_at": "2026-04-03T15:30:00Z",
        "method": "regional_analytics_targeting",
        "snapshot_timestamp": "2026-04-03T15:29:00Z"
      },
      "ai_analysis_snapshot": {
        "priority_regions": ["NCR", "R3", "R4"],
        "critical_regions": 3,
        "subject_shortages": 8
      }
    }
  ],
  "generated_at": "2026-04-03T15:30:00Z"
}
```

### Approve and Save Recommendations

**Endpoint:** `POST /ai/approve-events`  
**Description:** Approve selected cached recommendations and save them to database as draft events  
**Authentication:** Admin

**Request Body:**

```json
{
  "event_slugs": [
    "physics-workshop-2026",
    "science-camp-r1-2026"
  ]
}
```

**Response (200 OK):**

```json
{
  "saved": 2,
  "events": [
    {
      "id": "<uuid>",
      "title": "Physics Teachers Workshop",
      "slug": "physics-workshop-2026",
      "status": "draft",
      "ai_generated": true
    }
  ]
}
```

### Generate Personalized Invitations

**Endpoint:** `POST /ai/generate-invitations/{event_id}`  
**Description:** Draft customized invitation emails for teachers matching event criteria  
**Authentication:** Admin

**Response (200 OK):**

```json
{
  "event_id": "<uuid>",
  "event_title": "Physics Teachers Workshop",
  "matched_teachers": 42,
  "invitation_drafts": [
    {
      "teacher_id": "<uuid>",
      "teacher_name": "Maria Gonzales",
      "email": "maria.gonzales@school.ph",
      "subject": "You're invited: Advanced Physics Pedagogy Workshop",
      "body": "Dear Maria,\n\nWe are pleased to invite you to our Advanced Physics Pedagogy Workshop specifically designed for Grade 9-10 Physics teachers...\n\nBest regards,\nPHOLARIS Team"
    }
  ],
  "generated_at": "2026-04-03T15:35:00Z"
}
```

### Score Pending Sentiment Feedback

**Endpoint:** `POST /ai/score-pending-sentiments`  
**Description:** Batch process and score all unscored event sentiment submissions using AI  
**Authentication:** Admin

**Response (200 OK):**

```json
{
  "scored": 87,
  "summary": {
    "positive_count": 62,
    "neutral_count": 18,
    "negative_count": 7,
    "average_score": 0.68
  },
  "processed_at": "2026-04-03T15:40:00Z"
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
- AI event generation includes fuzzy semantic deduplication against recent events before recommendations are returned.
- Slug uniqueness is still enforced at save time as an additional guardrail.
- Public list endpoints currently use offset pagination (`skip` + `limit`); cursor helper utilities exist for phased migration paths.
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
