from __future__ import annotations

import logging
from uuid import UUID
from datetime import datetime, date
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.dependencies import require_admin
from app.core.exceptions import StarException
from app.core.rate_limiter import RATE_LIMITS, limiter
from app.database import get_db
from app.models.user import User
from app.models.event import Event
from app.models.teacher_profile import TeacherProfile
from app.services.ai_service import (
    generate_event_recommendations,
    draft_invitation_email,
    score_pending_event_sentiments,
)
from app.services.analytics_cache import get_analytics_snapshot
from app.services.email_service import _get_target_teachers


router = APIRouter(prefix="/api/ai", tags=["ai"])
logger = logging.getLogger("app.router.ai")

# In-memory cache for last generated recommendations
_last_recommendations: dict[str, Any] = {
    "recommendations": [],
    "generated_at": None,
}


class ApproveEventsRequest(BaseModel):
    """Request to approve and save cached event recommendations."""
    event_slugs: list[str] = Field(
        ...,
        title="Event Slugs",
        description="List of event slugs from cached recommendations to approve and save to database"
    )


@router.post("/generate-events")
@limiter.limit(RATE_LIMITS["AI_GENERATE"])
async def generate_events(
    request: Request,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate event recommendations based on regional analytics snapshot.
    
    Admin-only endpoint. Pulls current analytics snapshot, fetches recent events
    for dedup context, calls Gemini to generate 5 recommendations, and caches
    the result in memory.
    """
    try:
        # Get analytics snapshot
        snapshot = await get_analytics_snapshot(db)
        
        # Fetch recent events for dedup context (exclude void events)
        recent_result = await db.execute(
            select(Event)
            .where(Event.status != "void")
            .order_by(Event.created_at.desc())
            .limit(20)
        )
        recent_events = recent_result.scalars().all()
        
        # Convert to dicts for AI service
        recent_events_dicts = [
            {
                "id": str(e.id),
                "title": e.title,
                "target_subject": e.target_subject,
                "target_regions": e.target_regions or [],
            }
            for e in recent_events
        ]
        
        # Generate event recommendations
        recommendations = await generate_event_recommendations(
            snapshot=snapshot,
            existing_events=recent_events_dicts,
            limit=5
        )
        
        # Cache in memory
        _last_recommendations["recommendations"] = recommendations
        _last_recommendations["generated_at"] = datetime.utcnow().isoformat()
        
        return {
            "status": "generated",
            "count": len(recommendations),
            "recommendations": recommendations,
            "generated_at": _last_recommendations["generated_at"],
            "note": "Recommendations are NOT auto-approved. Review and approve manually.",
        }
    
    except ValueError as e:
        logger.warning(
            "AI event generation validation failure",
            extra={"event": {"error": str(e), "route": "generate-events", "admin_id": str(admin.id)}},
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event generation failed due to invalid AI output. Please retry."
        )
    except Exception:
        logger.exception(
            "AI event generation failed",
            extra={"event": {"route": "generate-events", "admin_id": str(admin.id)}},
        )
        raise StarException(
            error_code="AI_GENERATION_ERROR",
            message="Event generation failed",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@router.get("/recommendations")
async def get_recommendations(
    admin: User = Depends(require_admin),
):
    """
    Retrieve the last generated event recommendations from memory.
    
    Admin-only endpoint. Returns cached recommendations with timestamp.
    """
    if not _last_recommendations["recommendations"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No recommendations generated yet. Call POST /generate-events first."
        )
    
    return {
        "count": len(_last_recommendations["recommendations"]),
        "recommendations": _last_recommendations["recommendations"],
        "generated_at": _last_recommendations["generated_at"],
    }


@router.post("/generate-invitations/{event_id}")
@limiter.limit("10/minute")
async def generate_invitations(
    request: Request,
    event_id: UUID,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate personalized invitation email drafts for matched teachers.
    
    Admin-only endpoint. Fetches event, identifies matching teachers based on
    event criteria, and generates personalized draft emails using Gemini.
    """
    try:
        # Fetch event
        result = await db.execute(
            select(Event)
            .where(Event.id == event_id)
        )
        event = result.scalar_one_or_none()
        
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        
        # Get matching teachers
        matched_teachers = await _get_target_teachers(db, event)
        
        if not matched_teachers:
            return {
                "event_id": str(event_id),
                "status": "no_matches",
                "matched_count": 0,
                "drafts": [],
                "message": "No teachers matched the event criteria."
            }
        
        # Generate drafts
        drafts = []
        for user, profile in matched_teachers:
            try:
                event_payload = {
                    "title": event.title,
                    "description": event.description,
                    "event_date": event.event_date.isoformat() if event.event_date else None,
                    "location": event.location,
                    "learning_objectives": event.learning_objectives or [],
                }
                
                teacher_payload = {
                    "full_name": user.full_name or "Teacher",
                    "current_subject": profile.current_subject or "your subject area",
                }
                
                draft = await draft_invitation_email(event_payload, teacher_payload)
                drafts.append({
                    "teacher_id": str(profile.id),
                    "teacher_name": user.full_name,
                    "email": user.email,
                    "subject": draft.get("subject"),
                    "body": draft.get("body"),
                })
            except ValueError:
                # Continue on individual draft failures
                continue
        
        return {
            "event_id": str(event_id),
            "event_title": event.title,
            "status": "generated",
            "matched_count": len(matched_teachers),
            "drafts_generated": len(drafts),
            "drafts": drafts,
        }
    
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(
            "AI invitation generation validation failure",
            extra={"event": {"error": str(e), "route": "generate-invitations", "event_id": str(event_id), "admin_id": str(admin.id)}},
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation generation failed due to invalid AI output. Please retry."
        )
    except Exception:
        logger.exception(
            "AI invitation generation failed",
            extra={"event": {"route": "generate-invitations", "event_id": str(event_id), "admin_id": str(admin.id)}},
        )
        raise StarException(
            error_code="AI_INVITATION_ERROR",
            message="Invitation generation failed",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@router.post("/score-pending-sentiments")
@limiter.limit(RATE_LIMITS["AI_SCORE"])
async def score_pending_sentiments(
    request: Request,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Batch score all pending event sentiment rows using Gemini.
    
    Admin-only endpoint. Scores sentiments in batches (50 at a time) with
    error handling to prevent blocking the teacher submit flow.
    """
    try:
        scored_count = await score_pending_event_sentiments(db, batch_size=50)
        
        return {
            "status": "completed",
            "scored_count": scored_count,
            "message": f"Scored {scored_count} pending sentiment(s)" if scored_count > 0 else "No pending sentiments to score",
        }
    
    except ValueError as e:
        logger.warning(
            "AI sentiment scoring validation failure",
            extra={"event": {"error": str(e), "route": "score-pending-sentiments", "admin_id": str(admin.id)}},
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sentiment scoring failed due to invalid AI output. Please retry."
        )
    except Exception:
        logger.exception(
            "AI sentiment scoring failed",
            extra={"event": {"route": "score-pending-sentiments", "admin_id": str(admin.id)}},
        )
        raise StarException(
            error_code="AI_SENTIMENT_ERROR",
            message="Sentiment scoring failed",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    
@router.post("/approve-events")
async def approve_events(
    request: ApproveEventsRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Save approved recommendations to database."""
    if not request.event_slugs:
        raise HTTPException(status_code=400, detail="event_slugs cannot be empty")

    try:
        saved_events = []
        
        # Get cached recommendations
        cached = _last_recommendations.get("recommendations", [])
        
        # Filter to approved slugs
        to_save = [e for e in cached if e.get("slug") in request.event_slugs]

        # Dedup against slugs already in the database to avoid UniqueConstraint crashes
        candidate_slugs = [e.get("slug") for e in to_save if e.get("slug")]
        if candidate_slugs:
            existing_slugs_q = await db.execute(select(Event.slug).where(Event.slug.in_(candidate_slugs)))
            existing_slugs_in_db = set(existing_slugs_q.scalars().all())
            to_save = [e for e in to_save if e.get("slug") not in existing_slugs_in_db]
        
        for event_data in to_save:
            # Parse date fields if they're strings
            suggested_date_earliest = event_data.get("suggested_date_earliest")
            if suggested_date_earliest and isinstance(suggested_date_earliest, str):
                suggested_date_earliest = datetime.fromisoformat(suggested_date_earliest).date()
            
            suggested_date_latest = event_data.get("suggested_date_latest")
            if suggested_date_latest and isinstance(suggested_date_latest, str):
                suggested_date_latest = datetime.fromisoformat(suggested_date_latest).date()
            
            # Create Event instance
            new_event = Event(
                title=event_data.get("title"),
                slug=event_data.get("slug"),
                description=event_data.get("description"),
                event_type=event_data.get("event_type"),
                target_subject=event_data.get("target_subject"),
                target_subject_branch=event_data.get("target_subject_branch"),
                target_grade_levels=event_data.get("target_grade_levels"),
                target_regions=event_data.get("target_regions"),
                target_provinces=event_data.get("target_provinces"),
                target_audience_criteria=event_data.get("target_audience_criteria"),
                recommended_format=event_data.get("recommended_format"),
                priority_timeline=event_data.get("priority_timeline"),
                expected_impact=event_data.get("expected_impact"),
                learning_objectives=event_data.get("learning_objectives"),
                suggested_topics=event_data.get("suggested_topics"),
                format_justification=event_data.get("format_justification"),
                tags=event_data.get("tags"),
                suggested_duration_days=event_data.get("suggested_duration_days"),
                suggested_date_earliest=suggested_date_earliest,
                suggested_date_latest=suggested_date_latest,
                location=event_data.get("location"),
                ai_generated=event_data.get("ai_generated", True),
                ai_rationale=event_data.get("ai_rationale"),
                ai_analysis_snapshot=event_data.get("ai_analysis_snapshot"),
                status="draft",
                created_by=admin.id,
            )
            
            db.add(new_event)
            saved_events.append(new_event)
        
        await db.commit()
        
        return {
            "saved": len(saved_events),
            "events": [
                {
                    "id": str(e.id),
                    "title": e.title,
                    "slug": e.slug,
                    "status": e.status,
                    "ai_generated": e.ai_generated
                }
                for e in saved_events
            ],
        }
    
    except Exception:
        await db.rollback()
        logger.exception(
            "AI approve events failed",
            extra={
                "event": {
                    "route": "approve-events",
                    "admin_id": str(admin.id),
                    "requested_slug_count": len(request.event_slugs),
                }
            },
        )
        raise StarException(
            error_code="AI_APPROVE_ERROR",
            message="Failed to persist approved events",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )