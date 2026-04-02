# AI Integration Handoff (For Anthon)

## Objective
Implement Gemini-powered features for POLARIS using existing backend metrics and models.

## Scope
1. AI event recommendation generation.
2. AI invitation draft generation.
3. AI sentiment scoring for teacher feedback.

## Files to edit
1. `app/services/ai_service.py`
2. `app/routers/ai.py`

## Files to read only (integration dependencies)
1. `app/services/analytics_engine.py`
2. `app/services/analytics_cache.py`
3. `app/schemas/event.py`
4. `app/schemas/sentiment.py`
5. `app/models/event.py`
6. `app/models/sentiment.py`
7. `app/routers/events.py`

## Non-negotiable rules
1. Do NOT compute analytics inside AI service.
2. Do NOT query raw teacher metrics when analytics snapshot already provides them.
3. Use cached analytics snapshot as first source.
4. Keep Gemini call logic in `ai_service.py` only.
5. Keep routers thin: validate, call service, return response.

## Required service functions (implement in `app/services/ai_service.py`)
1. `build_event_generation_prompt(snapshot: dict, existing_events: list[dict]) -> str`
2. `generate_event_recommendations(snapshot: dict, existing_events: list[dict], limit: int = 5) -> list[dict]`
3. `draft_invitation_email(event_payload: dict, teacher_payload: dict) -> dict`
4. `score_sentiment_text(text: str) -> float`
5. `score_pending_event_sentiments(db: AsyncSession, batch_size: int = 50) -> int`

## Router endpoints to implement in `app/routers/ai.py`
1. `POST /api/ai/generate-events`
	- Admin only
	- Pull snapshot from analytics cache
	- Pull recent events for dedup context
	- Return generated recommendations (do not auto-approve)
2. `GET /api/ai/recommendations`
	- Admin only
	- Return last generated recommendations (cached/in-memory is acceptable)
3. `POST /api/ai/generate-invitations/{event_id}`
	- Admin only
	- Generate invitation drafts for matched recipients
4. Optional admin utility endpoint:
	- `POST /api/ai/score-pending-sentiments`
	- Runs `score_pending_event_sentiments`

## Sentiment scoring contract
1. Read rows from `event_sentiments` where `sentiment_score` is null.
2. Score each text to range `[-1.0, 1.0]`.
3. Write score only to `sentiment_score`.
4. Must not block teacher submit flow in `events.py`.

## Dedup handling for AI-generated events
1. Pass recent events into prompt as already-covered references.
2. After Gemini output, perform lightweight duplicate check before returning:
	- normalized title
	- target subject
	- target regions overlap
3. Mark duplicates in response payload for admin review.

## Acceptance checklist
1. AI service uses analytics snapshot, not direct metric recomputation.
2. Router endpoints are admin-protected where required.
3. Event recommendations parse into shape compatible with `schemas/event.py`.
4. Sentiment scoring updates pending rows without endpoint timeout risk.
5. No email sending implementation inside AI service.
