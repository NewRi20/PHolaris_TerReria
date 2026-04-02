# Part mo anthon, ikaw bahala if buburahin mo to, pinageneate ko lang to e, may tinest lang ako
from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.email_log import EmailLog
from app.models.event import Event
from app.models.teacher_profile import TeacherProfile
from app.models.user import User


async def send_event_invitations(db: AsyncSession, event: Event) -> int:
    recipients = await _get_target_teachers(db, event)

    for user, profile in recipients:
        log = EmailLog(
            event_id=event.id,
            teacher_id=profile.id,
            recipient_email=user.email,
            resend_message_id=str(uuid.uuid4()),
            status="sent",
        )
        db.add(log)

    await db.flush()
    return len(recipients)


async def _get_target_teachers(db: AsyncSession, event: Event) -> list[tuple[User, TeacherProfile]]:
    result = await db.execute(
        select(TeacherProfile, User)
        .join(User, User.id == TeacherProfile.user_id)
        .options(selectinload(TeacherProfile.user))
    )

    recipients: list[tuple[User, TeacherProfile]] = []
    for profile, user in result.all():
        if _matches_event(event, profile):
            recipients.append((user, profile))
    return recipients


def _matches_event(event: Event, profile: TeacherProfile) -> bool:
    criteria = event.target_audience_criteria or {}

    if event.target_regions and profile.region not in event.target_regions:
        return False
    if event.target_divisions and profile.division not in event.target_divisions:
        return False
    if event.target_subject and profile.current_subject not in {event.target_subject, profile.current_subject}:
        return False

    subjects = criteria.get("subjects")
    if subjects and profile.current_subject not in subjects and profile.specialization not in subjects:
        return False

    max_years_experience = criteria.get("max_years_experience")
    if max_years_experience is not None and profile.years_experience is not None and profile.years_experience > max_years_experience:
        return False

    min_months_since_last_training = criteria.get("min_months_since_last_training")
    if min_months_since_last_training is not None and profile.last_training_date is not None:
        return False

    teaching_outside_specialization = criteria.get("teaching_outside_specialization")
    if teaching_outside_specialization is not None and profile.teaching_outside_specialization != teaching_outside_specialization:
        return False

    return True