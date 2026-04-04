from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.email_log import EmailLog
from app.models.event import Event
from app.models.teacher_profile import TeacherProfile
from app.models.user import User


# Region code to full name mapping
REGION_MAPPING = {
    "R1": "Region I (Ilocos Region)",
    "R2": "Region II (Cagayan Valley)",
    "R3": "Region III (Central Luzon)",
    "R4": "Region IV-A (CALABARZON)",
    "R5": "Region V (Bicol Region)",
    "R6": "Region VI (Western Visayas)",
    "R7": "Region VII (Central Visayas)",
    "R8": "Region VIII (Eastern Visayas)",
    "R9": "Region IX (Zamboanga Peninsula)",
    "R10": "Region X (Northern Mindanao)",
    "R11": "Region XI (Davao Region)",
    "R12": "Region XII (SOCCSKSARGEN)",
    "NCR": "National Capital Region",
}


def _region_matches(profile_region: str, event_regions: list[str]) -> bool:
    """Check if teacher's region matches any event target region."""
    if not event_regions:
        return True
    
    # Check for exact match
    if profile_region in event_regions:
        return True
    
    # Check if profile_region code maps to any event region
    full_name = REGION_MAPPING.get(profile_region)
    if full_name and full_name in event_regions:
        return True
    
    # Check if any event region maps to profile_region code
    for event_region in event_regions:
        for code, name in REGION_MAPPING.items():
            if name == event_region and code == profile_region:
                return True
    
    return False


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

    # Check region with mapping support (handle NULL target_regions)
    # Convert dict/list to list format
    target_regions = event.target_regions or []
    if isinstance(target_regions, dict):
        target_regions = list(target_regions.values()) if target_regions.values() else []
    elif not isinstance(target_regions, list):
        target_regions = []
    
    if target_regions and not _region_matches(profile.region, target_regions):
        return False
    
    # Check provinces (handle NULL target_provinces)
    target_provinces = event.target_provinces or []
    if isinstance(target_provinces, dict):
        target_provinces = list(target_provinces.values()) if target_provinces.values() else []
    elif not isinstance(target_provinces, list):
        target_provinces = []
    
    if target_provinces and profile.province not in target_provinces:
        return False
    
    # Check subject (Cross-Curricular matches any subject)
    target_subject = event.target_subject
    if target_subject and target_subject != "Cross-Curricular":
        if profile.current_subject != target_subject and profile.specialization != target_subject:
            return False

    # Check criteria subjects (Any subject matches any teacher)
    subjects = criteria.get("subjects")
    if subjects and "Any subject" not in subjects:
        if profile.current_subject not in subjects and profile.specialization not in subjects:
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