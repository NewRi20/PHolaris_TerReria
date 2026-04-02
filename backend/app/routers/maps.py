from collections import defaultdict
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.event import Event, EventRSVP
from app.models.teacher_profile import TeacherProfile
from app.services.analytics_cache import get_analytics_snapshot
from app.services.analytics_engine import region_metric_detail

router = APIRouter(prefix="/api/maps", tags=["maps"])


def _is_upcoming_event(event: Event) -> bool:
    if event.status in {"void", "completed"}:
        return False
    if event.event_date is None:
        return event.status in {"approved", "scheduled", "voting", "draft"}
    return event.event_date >= datetime.utcnow()


@router.get("/regions")
async def get_regions_map(db: AsyncSession = Depends(get_db)):
    teacher_result = await db.execute(
        select(TeacherProfile.region, TeacherProfile.current_subject, TeacherProfile.years_experience)
        .where(TeacherProfile.region.is_not(None))
    )

    region_data: dict[str, dict] = defaultdict(
        lambda: {
            "teacher_count": 0,
            "total_years_experience": 0.0,
            "experience_samples": 0,
            "subject_specialization_breakdown": defaultdict(int),
            "upcoming_events_count": 0,
            "total_interested": 0,
        }
    )

    for region, subject, years_experience in teacher_result.all():
        data = region_data[region]
        data["teacher_count"] += 1
        if years_experience is not None:
            data["total_years_experience"] += float(years_experience)
            data["experience_samples"] += 1
        if subject:
            data["subject_specialization_breakdown"][subject] += 1

    rsvp_result = await db.execute(
        select(EventRSVP.event_id, func.count(EventRSVP.id))
        .where(EventRSVP.interested.is_(True))
        .group_by(EventRSVP.event_id)
    )
    interest_by_event = {event_id: count for event_id, count in rsvp_result.all()}

    event_result = await db.execute(select(Event))
    for event in event_result.scalars().all():
        if not _is_upcoming_event(event):
            continue
        interested_count = int(interest_by_event.get(event.id, 0))
        for region in event.target_regions or []:
            data = region_data[region]
            data["upcoming_events_count"] += 1
            data["total_interested"] += interested_count

    snapshot = await get_analytics_snapshot(db)
    readiness_map = {
        item["region"]: item
        for item in snapshot.get("regional_readiness", [])
    }

    rows: list[dict] = []
    for region, data in region_data.items():
        readiness = readiness_map.get(region, {})
        avg_exp = (
            data["total_years_experience"] / data["experience_samples"]
            if data["experience_samples"]
            else None
        )

        rows.append(
            {
                "region": region,
                "teacher_count": data["teacher_count"],
                "avg_years_experience": round(avg_exp, 2) if avg_exp is not None else None,
                "subject_specialization_breakdown": dict(data["subject_specialization_breakdown"]),
                "color_code": readiness.get("color_code", "green"),
                "metrics_flagged_count": readiness.get("metrics_flagged_count", 0),
                "upcoming_events_count": data["upcoming_events_count"],
                "total_interested": data["total_interested"],
                "readiness_score": readiness.get("regional_readiness_score"),
            }
        )

    return sorted(rows, key=lambda x: x["teacher_count"], reverse=True)


@router.get("/regions/{region}")
async def get_region_map_detail(region: str, db: AsyncSession = Depends(get_db)):
    teacher_result = await db.execute(
        select(TeacherProfile.current_subject, TeacherProfile.years_experience)
        .where(TeacherProfile.region == region)
    )
    rows = teacher_result.all()

    if not rows:
        raise HTTPException(status_code=404, detail="Region not found")

    subject_breakdown: dict[str, int] = defaultdict(int)
    experience_distribution = {"novice": 0, "intermediate": 0, "veteran": 0, "unknown": 0}

    for subject, years_experience in rows:
        if subject:
            subject_breakdown[subject] += 1

        if years_experience is None:
            experience_distribution["unknown"] += 1
        elif years_experience < 3:
            experience_distribution["novice"] += 1
        elif years_experience > 10:
            experience_distribution["veteran"] += 1
        else:
            experience_distribution["intermediate"] += 1

    metrics = await region_metric_detail(db, region)

    return {
        "region": region,
        "teacher_count": len(rows),
        "subject_breakdown": dict(subject_breakdown),
        "experience_distribution": experience_distribution,
        "metrics": metrics,
    }


@router.get("/events-by-region")
async def get_events_by_region(db: AsyncSession = Depends(get_db)):
    rsvp_result = await db.execute(
        select(EventRSVP.event_id, func.count(EventRSVP.id))
        .where(EventRSVP.interested.is_(True))
        .group_by(EventRSVP.event_id)
    )
    interest_by_event = {event_id: count for event_id, count in rsvp_result.all()}

    events_result = await db.execute(select(Event).order_by(Event.event_date.asc().nullslast()))

    grouped: dict[str, list[dict]] = defaultdict(list)
    for event in events_result.scalars().all():
        if not _is_upcoming_event(event):
            continue

        payload = {
            "event_id": str(event.id),
            "title": event.title,
            "status": event.status,
            "event_date": event.event_date,
            "interested_count": int(interest_by_event.get(event.id, 0)),
        }
        for region in event.target_regions or []:
            grouped[region].append(payload)

    return [{"region": region, "events": events} for region, events in grouped.items()]
