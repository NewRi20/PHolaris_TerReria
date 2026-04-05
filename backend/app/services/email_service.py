from __future__ import annotations

import asyncio
import logging
import os
import uuid
import resend
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.models.email_log import EmailLog
from app.models.event import Event
from app.models.teacher_profile import TeacherProfile
from app.models.user import User
from app.utils.mappings import REGION_MAPPING, CODE_MAP, SUBJECT_CATEGORY_MAPPING

# Configure Resend API key
resend.api_key = settings.RESEND_API_KEY

logger = logging.getLogger("app.email")
_RESEND_TIMEOUT_SECONDS = 15
_RESEND_MAX_RETRIES = 3



def _region_matches(profile_region: str, event_regions: list[str]) -> bool:
    """Check if teacher's region matches any event target region."""
    if not event_regions:
        return True
    
    if not profile_region:
        return False
    
    # Normalize profile region for comparison
    profile_region = profile_region.strip()
    
    for event_region in event_regions:
        event_region = event_region.strip()
        
        # Exact match
        if profile_region == event_region:
            return True
        
        # Check if profile region code matches event region (e.g., "R2" matches "Region 2")
        if profile_region.upper() in CODE_MAP:
            code_num = CODE_MAP[profile_region.upper()]
            if event_region == f"Region {code_num}":
                return True
        
        # Check if both map to the same full name
        profile_full = REGION_MAPPING.get(profile_region)
        event_full = REGION_MAPPING.get(event_region)
        if profile_full and event_full and profile_full == event_full:
            return True
        
        # Check if event region code maps to profile region
        if event_region.upper() in CODE_MAP:
            event_code = f"R{CODE_MAP[event_region.upper()]}"
            if profile_region == event_code:
                return True
    
    return False


async def send_event_invitations(db: AsyncSession, event: Event) -> int:
    """
    Send email invitations for an event to all matching recipients.
    
    Validates event status, resolves recipients from targeting criteria,
    generates personalized HTML, and sends via Resend API.
    Logs all attempts including partial failures.
    
    Args:
        db: Async database session
        event: Event to send invitations for
        
    Returns:
        Total number of successfully sent emails
    """
    # Validate event status
    if event.status not in ("approved", "scheduled"):
        return 0
    
    # Resolve target recipients
    recipients = await _get_target_teachers(db, event)
    
    sent_count = 0
    
    # Send to each recipient
    for user, profile in recipients:
        try:
            # Generate email HTML
            teacher_payload = {
                "full_name": user.full_name or user.email.split("@")[0],
                "school": profile.school,
                "region": profile.region,
                "subject": profile.current_subject or profile.specialization,
            }
            html = _render_invitation_html(event, teacher_payload)
            
            # Send via Resend
            result = await _send_email_via_resend(
                to_email=user.email,
                subject=f"You're Invited: {event.title}",
                html=html
            )
            
            # Log successful send
            status = "sent"
            resend_message_id = result.get("id", str(uuid.uuid4()))
            sent_count += 1
            
        except Exception as exc:
            # Log failed send attempt
            status = "failed"
            resend_message_id = str(uuid.uuid4())
            logger.warning(
                "Invitation email send failed",
                extra={
                    "event": {
                        "event_id": str(event.id),
                        "teacher_id": str(profile.id),
                        "recipient": user.email,
                        "error": str(exc),
                    }
                },
            )
        
        # Always create log entry
        log = EmailLog(
            event_id=event.id,
            teacher_id=profile.id,
            recipient_email=user.email,
            resend_message_id=resend_message_id,
            status=status,
        )
        db.add(log)
    
    await db.flush()
    return sent_count


def _render_invitation_html(event: Event, teacher_payload: dict) -> str:
    """
    Generate personalized HTML email body for event invitation.
    
    Args:
        event: Event to invite to
        teacher_payload: Teacher data dict with full_name, school, region, subject
        
    Returns:
        HTML string for email body
    """
    full_name = teacher_payload.get("full_name", "Teacher")
    school = teacher_payload.get("school", "")
    subject = teacher_payload.get("subject", "")
    
    school_text = f"<p>School: <strong>{school}</strong></p>" if school else ""
    subject_text = f"<p>Subject: <strong>{subject}</strong></p>" if subject else ""
    
    html = f"""
    <html>
    <head>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }}
            .content {{ line-height: 1.6; margin: 20px 0; }}
            .footer {{ color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>You're Invited to {event.title}</h1>
            </div>
            
            <div class="content">
                <p>Dear {full_name},</p>
                
                <p>We are pleased to invite you to participate in <strong>{event.title}</strong>.</p>
                
                {school_text}
                {subject_text}
                
                <h3>Event Details</h3>
                <p><strong>Description:</strong> {event.description or 'Professional development opportunity'}</p>
                
                {f'<p><strong>Event Date:</strong> {event.event_date.strftime("%B %d, %Y")}</p>' if event.event_date else ''}
                
                {f'<p><strong>Location:</strong> {event.location}</p>' if event.location else ''}
                
                {f'<p><strong>RSVP Deadline:</strong> {event.rsvp_deadline.strftime("%B %d, %Y")}</p>' if event.rsvp_deadline else ''}
                
                <p>We look forward to your participation.</p>
            </div>
            
            <div class="footer">
                <p>This is an automated invitation from POLARIS. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return html


async def _send_email_via_resend(to_email: str, subject: str, html: str):
    """
    Send email via Resend API using the Resend Python SDK.
    
    Args:
        to_email: Recipient email address
        subject: Email subject line
        html: HTML body content
        
    Returns:
        SendResponse from Resend API containing message ID
        
    Raises:
        Exception: If Resend API call fails
    """
    api_key = settings.RESEND_API_KEY or os.getenv("RESEND_API_KEY", "")
    if not api_key:
        raise ValueError("RESEND_API_KEY not configured")

    resend.api_key = api_key

    if api_key.startswith("test-"):
        return {"id": str(uuid.uuid4())}
    
    params: resend.Emails.SendParams = {
        "from": "POLARIS <noreply@resend.beemaniago.me>",
        "to": [to_email],
        "subject": subject,
        "html": html,
        "reply_to": "support@resend.beemaniago.me",
    }

    last_error: Exception | None = None
    for attempt in range(1, _RESEND_MAX_RETRIES + 1):
        try:
            response = await asyncio.wait_for(
                asyncio.to_thread(resend.Emails.send, params),
                timeout=_RESEND_TIMEOUT_SECONDS,
            )
            return response
        except (TimeoutError, asyncio.TimeoutError, Exception) as exc:
            last_error = exc
            logger.warning(
                "Resend call failed",
                extra={"event": {"attempt": attempt, "recipient": to_email, "error": str(exc)}},
            )
            if attempt < _RESEND_MAX_RETRIES:
                await asyncio.sleep(min(2**attempt, 5))

    raise RuntimeError(f"Resend send failed after {_RESEND_MAX_RETRIES} retries: {last_error}")


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
        # Get acceptable subjects for target subject category
        acceptable_subjects = SUBJECT_CATEGORY_MAPPING.get(target_subject, [target_subject])
        if profile.current_subject not in acceptable_subjects and profile.specialization not in acceptable_subjects:
            return False

    # Check criteria subjects (Any subject matches any teacher)
    subjects = criteria.get("subjects")
    if subjects and "Any subject" not in subjects:
        # Build full list of acceptable subjects from all criteria subjects
        all_acceptable_subjects = []
        for subject in subjects:
            all_acceptable_subjects.extend(SUBJECT_CATEGORY_MAPPING.get(subject, [subject]))
        
        if profile.current_subject not in all_acceptable_subjects and profile.specialization not in all_acceptable_subjects:
            return False

    max_years_experience = criteria.get("max_years_experience")
    if max_years_experience is not None and profile.years_experience is not None and profile.years_experience > max_years_experience:
        return False

    min_months_since_last_training = criteria.get("min_months_since_last_training")
    if min_months_since_last_training is not None and profile.last_training_date is not None:
        months_since = (datetime.utcnow().date() - profile.last_training_date).days / 30
        if months_since < min_months_since_last_training:
            return False

    teaching_outside_specialization = criteria.get("teaching_outside_specialization")
    if teaching_outside_specialization is not None and profile.teaching_outside_specialization != teaching_outside_specialization:
        return False

    return True