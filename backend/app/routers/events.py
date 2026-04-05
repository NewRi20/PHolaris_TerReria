from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.models.event import Event, EventRSVP, EventVote
from app.models.sentiment import EventSentiment
from app.models.user import User
from app.models.teacher_profile import TeacherProfile
from app.core.rate_limiter import RATE_LIMITS, limiter
from app.services.email_service import send_event_invitations
from app.schemas.event import EventCreate, EventResponse, EventRSVPCreate, EventRSVPResponse, EventUpdate, EventVoteCreate, EventVoteResponse
from app.schemas.sentiment import SentimentCreate, SentimentResponse

router = APIRouter(prefix="/api/events", tags=["events"])


@router.get("/", response_model=list[EventResponse])
async def list_events(
    event_status: str | None = None,
    region: str | None = None,
    timeline: str | None = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    skip = max(skip, 0)
    limit = max(min(limit, 100), 1)

    query = select(Event)

    if event_status:
        query = query.where(Event.status == event_status)
    if region:
        # target_regions is stored as a JSON array of region strings.
        query = query.where(Event.target_regions.contains([region]))
    if timeline:
        query = query.where(Event.priority_timeline == timeline)

    query = query.order_by(Event.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(event_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.post("/", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    body: EventCreate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    event = Event(**body.model_dump(), created_by=admin.id)
    db.add(event)
    await db.flush()
    return event


@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: UUID,
    body: EventUpdate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(event, key, value)

    await db.flush()
    return event


@router.delete("/{event_id}", response_model=EventResponse)
async def delete_event(
    event_id: UUID,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    event.status = "void"
    event.voided_at = datetime.utcnow()
    await db.flush()
    return event


@router.post("/{event_id}/approve", response_model=EventResponse)
async def approve_event(
    event_id: UUID,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.status not in {"draft", "voting"}:
        raise HTTPException(status_code=409, detail=f"Cannot approve event with status '{event.status}'")

    event.status = "approved"
    await db.flush()
    return event


@router.post("/{event_id}/send-invitations")
@limiter.limit(RATE_LIMITS["INVITATIONS_SEND"])
async def send_invitations(
    request: Request,
    event_id: UUID,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    sent_count = await send_event_invitations(db, event)
    return {"event_id": str(event.id), "sent_count": sent_count, "status": "queued"}


@router.post("/{event_id}/vote", response_model=EventVoteResponse)
@limiter.limit("30/minute")
async def vote_event(
    request: Request,
    event_id: UUID,
    body: EventVoteCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.role != "teacher":
        raise HTTPException(status_code=403, detail="Teacher access required")

    vote_value = body.vote
    if vote_value not in {"approve", "reject"}:
        raise HTTPException(status_code=400, detail="Vote must be approve or reject")

    event_result = await db.execute(select(Event).where(Event.id == event_id))
    event = event_result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.status != "voting":
        raise HTTPException(status_code=409, detail="Event is not currently open for voting")

    result = await db.execute(select(EventVote).where(EventVote.event_id == event_id, EventVote.user_id == user.id))
    vote = result.scalar_one_or_none()
    if not vote:
        vote = EventVote(event_id=event_id, user_id=user.id, vote=vote_value)
        db.add(vote)
    else:
        vote.vote = vote_value

    await db.flush()
    return vote


@router.post("/{event_id}/rsvp", response_model=EventRSVPResponse)
@limiter.limit("30/minute")
async def rsvp_event(
    request: Request,
    event_id: UUID,
    body: EventRSVPCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.role != "teacher":
        raise HTTPException(status_code=403, detail="Teacher access required")

    interested = body.interested

    event_result = await db.execute(select(Event).where(Event.id == event_id))
    event = event_result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.status not in {"approved", "scheduled"}:
        raise HTTPException(status_code=409, detail="RSVPs are only accepted for approved or scheduled events")

    profile_result = await db.execute(select(TeacherProfile).where(TeacherProfile.user_id == user.id))
    profile = profile_result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Teacher profile not found")

    result = await db.execute(select(EventRSVP).where(EventRSVP.event_id == event_id, EventRSVP.teacher_id == profile.id))
    rsvp = result.scalar_one_or_none()
    if not rsvp:
        rsvp = EventRSVP(event_id=event_id, teacher_id=profile.id, interested=interested)
        db.add(rsvp)
    else:
        rsvp.interested = interested

    await db.flush()
    return rsvp


@router.get("/{event_id}/votes", response_model=list[EventVoteResponse])
async def get_event_votes(
    event_id: UUID,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(EventVote).where(EventVote.event_id == event_id).order_by(EventVote.created_at.desc()))
    return result.scalars().all()


@router.get("/{event_id}/rsvps", response_model=list[EventRSVPResponse])
async def get_event_rsvps(
    event_id: UUID,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(EventRSVP).where(EventRSVP.event_id == event_id).order_by(EventRSVP.created_at.desc()))
    return result.scalars().all()


@router.post("/{event_id}/sentiments", response_model=SentimentResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute")
async def submit_sentiment(
    request: Request,
    event_id: UUID,
    body: SentimentCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.role != "teacher":
        raise HTTPException(status_code=403, detail="Teacher access required")

    event_result = await db.execute(select(Event).where(Event.id == event_id))
    event = event_result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.status != "completed":
        raise HTTPException(status_code=409, detail="Sentiment feedback is only accepted for completed events")

    profile_result = await db.execute(select(TeacherProfile).where(TeacherProfile.user_id == user.id))
    profile = profile_result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Teacher profile not found")

    sentiment = EventSentiment(
        event_id=event_id,
        teacher_id=profile.id,
        sentiment_text=body.sentiment_text,
    )
    db.add(sentiment)
    await db.flush()
    return sentiment


@router.get("/{event_id}/sentiments", response_model=list[SentimentResponse])
async def get_event_sentiments(
    event_id: UUID,
    skip: int = 0,
    limit: int = 50,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    skip = max(skip, 0)
    limit = max(min(limit, 100), 1)

    event_result = await db.execute(select(Event).where(Event.id == event_id))
    event = event_result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    result = await db.execute(
        select(EventSentiment)
        .where(EventSentiment.event_id == event_id)
        .order_by(EventSentiment.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()
