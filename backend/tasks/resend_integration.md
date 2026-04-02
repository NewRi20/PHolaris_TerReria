# Resend Integration Handoff (For Anthon)

## Objective
Replace stub invitation flow with real Resend delivery and maintain clean backend boundaries.

## File to edit
1. `app/services/email_service.py`

## Files to read for integration
1. `app/models/event.py`
2. `app/models/teacher_profile.py`
3. `app/models/user.py`
4. `app/models/email_log.py`
5. `app/routers/events.py`
6. `tasks/ai_integration.md`

## Required functions in `email_service.py`
1. `resolve_target_recipients(db: AsyncSession, event: Event) -> list[dict]`
2. `render_invitation_html(event: Event, teacher_payload: dict, ai_draft: dict | None = None) -> str`
3. `send_email_via_resend(to_email: str, subject: str, html: str) -> dict`
4. `send_event_invitations(db: AsyncSession, event: Event) -> int`

## Delivery flow requirements
1. Validate event is `approved` or `scheduled` before sending.
2. Resolve recipients via target filters (`region`, `division`, `subject`, audience criteria).
3. Generate final subject + HTML per teacher.
4. Call Resend API.
5. Save one `email_logs` row per recipient with:
	- event_id
	- teacher_id
	- recipient_email
	- resend_message_id
	- status

## Failure handling requirements
1. One failed recipient must not stop remaining sends.
2. Log `status="failed"` when Resend request errors.
3. Return total success count from `send_event_invitations`.

## Router boundary rule
1. `events.py` route only calls `send_event_invitations`.
2. No Resend request code in router.
3. No HTML template building in router.

## Acceptance checklist
1. Existing endpoint `POST /api/events/{id}/send-invitations` sends real emails.
2. Every send attempt creates a log row in `email_logs`.
3. Recipients are selected from event targeting fields.
4. Code handles partial failures safely.
5. Logic is isolated enough to swap templates later.
