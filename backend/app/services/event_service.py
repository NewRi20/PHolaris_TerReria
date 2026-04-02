from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.event import Event


async def void_stale_events(db: AsyncSession, lead_days: int = 30) -> int:
    """
    Void events that are still unapproved when within the lead window.

    Unapproved statuses currently treated as: draft, voting.
    Condition: event_date <= now + lead_days.
    """
    cutoff = datetime.utcnow() + timedelta(days=lead_days)

    result = await db.execute(
        select(Event).where(
            Event.status.in_(["draft", "voting"]),
            Event.event_date.is_not(None),
            Event.event_date <= cutoff,
        )
    )
    events = result.scalars().all()

    now = datetime.utcnow()
    for event in events:
        event.status = "void"
        event.voided_at = now

    if events:
        await db.flush()

    return len(events)
