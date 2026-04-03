from __future__ import annotations

import json
import re
from datetime import datetime, timedelta

from google import genai
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.event import Event
from app.models.sentiment import EventSentiment


# Initialize Gemini
if settings.GEMINI_API_KEY:
    client = genai.Client(api_key=settings.GEMINI_API_KEY)

def build_event_generation_prompt(snapshot: dict, existing_events: list[dict]) -> str:
    """
    Build a prompt for Gemini to generate event recommendations based on regional analytics.
    
    Args:
        snapshot: Analytics snapshot with regional metrics
        existing_events: List of recent events for dedup context
    
    Returns:
        Formatted prompt string for Gemini
    """
    regional_readiness = snapshot.get("regional_readiness", [])
    training_drought = snapshot.get("training_drought", [])
    experience_void = snapshot.get("experience_void", [])
    subject_gap = snapshot.get("subject_gap", [])
    uplift_priority = snapshot.get("uplift_priority", [])
    
    # Top priority regions
    priority_regions = [item.get("region") for item in uplift_priority[:10]]
    
    # Existing event subjects for dedup
    existing_subjects = set()
    existing_regions_by_subject = {}
    for event in existing_events:
        if event.get("target_subject"):
            existing_subjects.add(event["target_subject"])
            region_key = f"{event['target_subject']}_regions"
            if region_key not in existing_regions_by_subject:
                existing_regions_by_subject[region_key] = set()
            for region in event.get("target_regions", []):
                existing_regions_by_subject[region_key].add(region)
    
    critical_regions_str = "\n".join([
        f"  - {item['region']}: readiness={item['regional_readiness_score']}, "
        f"metrics_flagged={item['metrics_flagged_count']}, color={item['color_code']}"
        for item in regional_readiness[:15]
    ])
    
    drought_str = "\n".join([
        f"  - {item['region']}/{item['province']}: drought_index={item['training_drought_index']}, "
        f"zero_training_rate={item['zero_training_rate']}%"
        for item in training_drought[:10]
    ])
    
    shortage_subjects = {}
    for item in subject_gap:
        subject = item.get("subject", "unknown")
        region = item.get("region", "unknown")
        shortage = item.get("shortage", 0)
        if shortage > 0:
            region_key = f"{subject}_{region}"
            if region_key not in shortage_subjects:
                shortage_subjects[region_key] = {"subject": subject, "region": region, "shortage": shortage}
    
    shortage_str = "\n".join([
        f"  - {v['subject']} in {v['region']}: {v['shortage']} teacher shortage"
        for v in sorted(shortage_subjects.values(), key=lambda x: x['shortage'], reverse=True)[:10]
    ])
    
    # Build existing events context
    existing_events_context = json.dumps([
        {"title": e.get("title"), "subject": e.get("target_subject"), "regions": e.get("target_regions", [])}
        for e in existing_events[:10]
    ], indent=2)
    
    prompt = f"""You are an expert in teacher professional development and regional education planning for the Philippines.

Based on regional workforce analytics, generate 5 unique, actionable professional development events.

REGIONAL READINESS (Critical Regions - Lower Score = More Critical):
{critical_regions_str}

TRAINING DROUGHT (Regions with stale training dates):
{drought_str}

SUBJECT SHORTAGES (Teacher demand by subject):
{shortage_str}

PRIORITY UNDERLIFT REGIONS:
{', '.join(priority_regions[:5])}

ALREADY PLANNED EVENTS (to avoid duplication):
{existing_events_context}

FOR EACH EVENT, generate a JSON object with these fields (no markdown, pure JSON):
{{
    "title": "Descriptive event title (avoid generic names)",
    "slug": "short-kebab-case-slug",
    "description": "2-3 sentence description of what teachers will learn",
    "event_type": "Workshop|Seminar|Twinning|Training Camp|Online Course|Roundtable",
    "target_subject": "One primary subject area (e.g., Mathematics, Science, English)",
    "target_subject_branch": "Optional specialization (e.g., Advanced Calculus, Physics, British Literature)",
    "target_grade_levels": ["Grade 7", "Grade 8", "Grade 9"],
    "target_regions": ["Region name 1", "Region name 2"],
    "target_provinces": ["Province 1", "Province 2"],
    "target_audience_criteria": {{
        "max_years_experience": 5,
        "teaching_outside_specialization": true,
        "subjects": ["Mathematics", "Science"]
    }},
    "recommended_format": "In-person|Hybrid|Online",
    "priority_timeline": "Urgent|High|Medium|Low",
    "suggested_duration_days": 3,
    "suggested_date_earliest": "YYYY-MM-DD",
    "suggested_date_latest": "YYYY-MM-DD",
    "location": "City, Province or Online",
    "expected_impact": {{"attendance_estimate": 150, "impact_type": "upskilling|certification|mentorship"}},
    "learning_objectives": ["Teachers will implement X in their classrooms", "Teachers will understand Y"],
    "suggested_topics": ["Topic 1", "Topic 2"],
    "format_justification": "Why this format is appropriate for this audience",
    "tags": ["tag1", "tag2"]
}}

RETURN ONLY a JSON array of 5 event objects. No markdown, no explanation. Start with '[' and end with ']'.
"""
    
    return prompt


def generate_event_recommendations(
    snapshot: dict,
    existing_events: list[dict],
    limit: int = 5
) -> list[dict]:
    """
    Generate event recommendations using Gemini based on analytics snapshot.
    
    Args:
        snapshot: Analytics snapshot with regional metrics
        existing_events: List of recent events for context and dedup
        limit: Number of recommendations to generate
    
    Returns:
        List of event dicts (not yet saved to DB)
    """
    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not configured")
    
    prompt = build_event_generation_prompt(snapshot, existing_events)
    
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        if not response or not response.text:
            raise ValueError("Empty response from Gemini API")
        raw_text = response.text.strip()
        
        # Extract JSON from response (handle markdown code blocks)
        if "```json" in raw_text:
            raw_text = raw_text.split("```json")[1].split("```")[0].strip()
        elif "```" in raw_text:
            raw_text = raw_text.split("```")[1].split("```")[0].strip()
        
        events = json.loads(raw_text)
        
        # Ensure it's a list
        if not isinstance(events, list):
            events = [events]
        
        # Mark as AI-generated, add rationale
        for event in events[:limit]:
            event["ai_generated"] = True
            event["ai_rationale"] = {
                "generated_at": datetime.utcnow().isoformat(),
                "method": "regional_analytics_targeting",
                "snapshot_timestamp": snapshot.get("generated_at", None)
            }
            event["ai_analysis_snapshot"] = {
                "priority_regions": [item.get("region") for item in snapshot.get("uplift_priority", [])[:5]],
                "critical_regions": len([r for r in snapshot.get("regional_readiness", []) if r.get("color_code") in {"red", "orange"}]),
                "subject_shortages": len([s for s in snapshot.get("subject_gap", []) if s.get("shortage", 0) > 0])
            }
        
        return events[:limit]
    
    except (json.JSONDecodeError, AttributeError, KeyError) as e:
        raise ValueError(f"Failed to parse Gemini event recommendations: {e}")


def draft_invitation_email(event_payload: dict, teacher_payload: dict) -> dict:
    """
    Generate a personalized invitation email draft for a teacher and event.
    
    Args:
        event_payload: Event dict with title, description, date, location, etc.
        teacher_payload: Teacher dict with full_name, current_subject, etc.
    
    Returns:
        Dict with email draft fields: subject, body
    """
    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not configured")
    
    event_title = event_payload.get("title", "Professional Development Event")
    event_date = event_payload.get("event_date") or event_payload.get("suggested_date_earliest", "TBD")
    event_location = event_payload.get("location", "TBD")
    learning_objectives = event_payload.get("learning_objectives", [])
    
    teacher_name = teacher_payload.get("full_name", "Teacher")
    teacher_subject = teacher_payload.get("current_subject", "your subject area")
    
    prompt = f"""You are a professional email drafter for teacher training program invitations.

Write a personalized, warm, and professional invitation email for a teacher to attend a professional development event.

TEACHER CONTEXT:
- Name: {teacher_name}
- Current Subject: {teacher_subject}

EVENT DETAILS:
- Title: {event_title}
- Date: {event_date}
- Location: {event_location}
- Learning Objectives: {', '.join(learning_objectives[:3])}

REQUIREMENTS:
1. Keep subject line under 50 characters
2. Email body should be 3-4 paragraphs
3. Use a warm, encouraging tone
4. Briefly mention relevance to the teacher's subject area
5. Include a call-to-action (RSVP by date)
6. Sign off professionally

Return ONLY a valid JSON object with this format (no markdown, no explanation):
{{
    "subject": "Invitation subject line",
    "body": "Full email body with paragraphs separated by \\n\\n"
}}
"""
    
    try:
        response = client.models.generate_content(
            model="2",
            contents=prompt
        )
        if not response or not response.text:
            raise ValueError("Empty response from Gemini API")
        raw_text = response.text.strip()
        
        # Extract JSON from response
        if "```json" in raw_text:
            raw_text = raw_text.split("```json")[1].split("```")[0].strip()
        elif "```" in raw_text:
            raw_text = raw_text.split("```")[1].split("```")[0].strip()
        
        draft = json.loads(raw_text)
        draft["generated_at"] = datetime.utcnow().isoformat()
        
        return draft
    
    except (json.JSONDecodeError, AttributeError, KeyError) as e:
        raise ValueError(f"Failed to parse Gemini invitation draft: {e}")


# ─── Sentiment Scoring Functions ──────────────────────────────────────────


def score_sentiment_text(text: str) -> float:
    """
    Score sentiment text on a scale from -1.0 (negative) to 1.0 (positive).
    
    Args:
        text: Sentiment text to score
    
    Returns:
        Float between -1.0 and 1.0
    """
    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not configured")
    
    prompt = f"""Analyze the sentiment of this teacher feedback on a professional development event.

FEEDBACK:
"{text}"

Rate the sentiment on a scale from -1.0 to 1.0:
- -1.0 = Extremely negative
- -0.5 = Negative
- 0.0 = Neutral
- 0.5 = Positive
- 1.0 = Extremely positive

RESPOND WITH ONLY A SINGLE DECIMAL NUMBER between -1.0 and 1.0. No explanation, no punctuation.
Example: 0.75
"""
    
    try:
        response = client.models.generate_content(
            model="2",
            contents=prompt
        )
        if not response or not response.text:
            raise ValueError("Empty response from Gemini API")
        score_text = response.text.strip()
        
        # Extract number from response
        match = re.search(r"-?\d+\.?\d*", score_text)
        if match:
            score = float(match.group())
            return max(-1.0, min(1.0, score))  # Clamp to [-1, 1]
        
        raise ValueError(f"Could not extract score from response: {score_text}")
    
    except (ValueError, AttributeError) as e:
        raise ValueError(f"Failed to score sentiment: {e}")


async def score_pending_event_sentiments(db: AsyncSession, batch_size: int = 50) -> int:
    """
    Score all pending sentiment rows (sentiment_score is NULL) using Gemini.
    
    Args:
        db: AsyncSession for database access
        batch_size: Number of sentiments to process per batch
    
    Returns:
        Count of rows scored
    """
    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not configured")
    
    scored_count = 0
    skip = 0
    
    while True:
        # Fetch batch of unscored sentiments
        result = await db.execute(
            select(EventSentiment)
            .where(EventSentiment.sentiment_score.is_(None))
            .limit(batch_size)
            .offset(skip)
        )
        batch = result.scalars().all()
        
        if not batch:
            break
        
        # Score each sentiment
        for sentiment in batch:
            try:
                score = score_sentiment_text(sentiment.sentiment_text)
                sentiment.sentiment_score = score
                scored_count += 1
            except ValueError:
                # Log error but continue (prevent blocking teacher submit flow)
                continue
        
        # Commit batch
        await db.flush()
        
        skip += batch_size
    
    if scored_count > 0:
        await db.commit()
    
    return scored_count