from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.security import hash_password
from app.core.dependencies import require_admin
from app.database import get_db
from app.models.badge import Badge
from app.models.teacher_profile import TeacherProfile
from app.models.user import User
from app.services.analytics_cache import get_analytics_snapshot, get_cache_meta, mark_analytics_cache_stale
from app.services.analytics_engine import analytics_overview, uplift_priority_queue
from app.services.event_service import void_stale_events
from app.core.rate_limiter import RATE_LIMITS, limiter
from app.utils.csv_parser import parse_teacher_upload

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.post("/upload-teachers")
@limiter.limit(RATE_LIMITS["ADMIN_UPLOAD"])
async def upload_teachers(
    request: Request,
    file: UploadFile = File(...),
    _: object = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    file_bytes = await file.read()

    # Accept both CSV and Excel uploads (.xls/.xlsx).
    try:
        rows = parse_teacher_upload(file_bytes=file_bytes, filename=file.filename or "")
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    imported = 0
    skipped_existing = 0

    # Pre-fetch all existing emails in ONE query to avoid N+1 DB roundtrips
    upload_emails = [row["email"] for row in rows]
    existing_q = await db.execute(select(User.email).where(User.email.in_(upload_emails)))
    existing_emails = set(existing_q.scalars().all())

    for row in rows:
        if row["email"] in existing_emails:
            skipped_existing += 1
            continue

        user = User(
            email=row["email"],
            hashed_password=hash_password("ChangeMe123!"),
            full_name=row["full_name"],
            role="teacher",
        )
        db.add(user)
        await db.flush()  # flush user to get user.id before creating profile

        profile = TeacherProfile(
            user_id=user.id,
            teacher_id_number=row.get("teacher_id_number"),
            school=row.get("school"),
            region=row.get("region"),
            province=row.get("province"),
            grade_level_taught=row.get("grade_level_taught"),
            current_subject=row.get("current_subject"),
            specialization=row.get("specialization"),
            teaching_outside_specialization=row.get("teaching_outside_specialization") or False,
            years_experience=row.get("years_experience"),
            num_classes=row.get("num_classes"),
            students_per_class=row.get("students_per_class"),
            working_hours_per_week=row.get("working_hours_per_week"),
        )
        db.add(profile)
        await db.flush()  # flush profile to get profile.id for badge FK

        # Auto-badge on import so ingest activity is auditable in teacher profile.
        db.add(
            Badge(
                teacher_id=profile.id,
                badge_name="Imported: Teacher Registry Onboarding",
                description="Granted automatically during admin teacher import",
            )
        )
        imported += 1

    await db.commit()
    mark_analytics_cache_stale()

    return {
        "message": "Teacher import complete",
        "filename": file.filename,
        "rows_received": len(rows),
        "imported": imported,
        "skipped_existing": skipped_existing,
        "temporary_password_notice": "Imported users were initialized with a temporary password and must rotate on first login.",
    }


@router.get("/dashboard")
async def admin_dashboard(
    _: object = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    snapshot = await get_analytics_snapshot(db)
    overview = await analytics_overview(db)

    return {
        "generated_at": overview.get("generated_at"),
        "total_regions": overview.get("total_regions", 0),
        "critical_regions": overview.get("critical_regions", 0),
        "shortage_regions": overview.get("shortage_regions", 0),
        "top_uplift_priorities": snapshot.get("uplift_priority", [])[:5],
        "cache": get_cache_meta(),
    }


@router.get("/underserved-areas")
async def underserved_areas(
    limit: int = 10,
    _: object = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    top_n = max(1, min(limit, 50))
    priorities = await uplift_priority_queue(db, top_n=top_n)
    return {
        "count": len(priorities),
        "items": priorities,
    }


@router.post("/void-stale-events")
async def void_stale_events_manual(
    _: object = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Manually void stale events for deployments without scheduled jobs."""
    voided_count = await void_stale_events(db, lead_days=settings.STALE_EVENT_VOIDING_LEAD_DAYS)
    await db.commit()

    return {
        "message": "Stale event cleanup completed",
        "voided_count": voided_count,
        "lead_days": settings.STALE_EVENT_VOIDING_LEAD_DAYS,
    }
