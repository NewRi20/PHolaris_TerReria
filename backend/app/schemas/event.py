from datetime import date, datetime
from typing import Optional, Union
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class EventCreate(BaseModel):
    title: str
    slug: str
    description: Optional[str] = None
    event_type: Optional[str] = None
    target_subject: Optional[str] = None
    target_subject_branch: Optional[str] = None
    target_grade_levels: Optional[list[str]] = None
    target_regions: Optional[list[str]] = None
    target_provinces: Optional[list[str]] = None
    target_audience_criteria: Optional[dict] = None
    recommended_format: Optional[str] = None
    priority_timeline: Optional[str] = None
    ai_generated: bool = False
    ai_rationale: Optional[dict] = None
    ai_analysis_snapshot: Optional[dict] = None
    expected_impact: Optional[dict] = None
    learning_objectives: Optional[list[str]] = None
    suggested_topics: Optional[list[str]] = None
    suggested_speakers: Optional[list[str]] = None
    format_justification: Optional[str] = None
    tags: Optional[list[str]] = None
    suggested_duration_days: Optional[int] = None
    suggested_date_earliest: Optional[date] = None
    suggested_date_latest: Optional[date] = None
    event_date: Optional[datetime] = None
    location: Optional[str] = None
    rsvp_deadline: Optional[datetime] = None


class EventUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[str] = None
    target_subject: Optional[str] = None
    target_subject_branch: Optional[str] = None
    target_grade_levels: Optional[list[str]] = None
    target_regions: Optional[list[str]] = None
    target_provinces: Optional[list[str]] = None
    target_audience_criteria: Optional[dict] = None
    recommended_format: Optional[str] = None
    priority_timeline: Optional[str] = None
    status: Optional[str] = None
    ai_generated: Optional[bool] = None
    ai_rationale: Optional[dict] = None
    ai_analysis_snapshot: Optional[dict] = None
    expected_impact: Optional[dict] = None
    learning_objectives: Optional[list[str]] = None
    suggested_topics: Optional[list[str]] = None
    suggested_speakers: Optional[list[str]] = None
    format_justification: Optional[str] = None
    tags: Optional[list[str]] = None
    suggested_duration_days: Optional[int] = None
    suggested_date_earliest: Optional[date] = None
    suggested_date_latest: Optional[date] = None
    event_date: Optional[datetime] = None
    location: Optional[str] = None
    rsvp_deadline: Optional[datetime] = None
    voided_at: Optional[datetime] = None


class EventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: Union[UUID, str]
    title: str
    slug: str
    description: Optional[str] = None
    event_type: Optional[str] = None
    target_subject: Optional[str] = None
    target_subject_branch: Optional[str] = None
    target_grade_levels: Optional[list[str]] = None
    target_regions: Optional[list[str]] = None
    target_provinces: Optional[list[str]] = None
    target_audience_criteria: Optional[dict] = None
    recommended_format: Optional[str] = None
    priority_timeline: Optional[str] = None
    status: str
    ai_generated: bool
    ai_rationale: Optional[dict] = None
    ai_analysis_snapshot: Optional[dict] = None
    expected_impact: Optional[dict] = None
    learning_objectives: Optional[list[str]] = None
    suggested_topics: Optional[list[str]] = None
    suggested_speakers: Optional[list[str]] = None
    format_justification: Optional[str] = None
    tags: Optional[list[str]] = None
    suggested_duration_days: Optional[int] = None
    suggested_date_earliest: Optional[date] = None
    suggested_date_latest: Optional[date] = None
    event_date: Optional[datetime] = None
    location: Optional[str] = None
    rsvp_deadline: Optional[datetime] = None
    created_by: Optional[Union[UUID, str]] = None
    created_at: datetime
    updated_at: datetime
    voided_at: Optional[datetime] = None


class AIEventRecommendation(BaseModel):
    title: str
    description: str
    event_type: str
    target_subject: Optional[str] = None
    target_subject_branch: Optional[str] = None
    target_grade_levels: list[str] = []
    target_regions: list[str] = []
    target_provinces: list[str] = []
    target_audience_criteria: dict = {}
    recommended_format: str
    priority_timeline: str
    ai_rationale: dict
    ai_analysis_snapshot: dict
    expected_impact: dict
    learning_objectives: list[str] = []
    suggested_topics: list[str] = []
    suggested_speakers: list[str] = []
    format_justification: Optional[str] = None
    tags: list[str] = []
    suggested_duration_days: Optional[int] = None
    suggested_date_earliest: Optional[date] = None
    suggested_date_latest: Optional[date] = None


class EventVoteCreate(BaseModel):
    vote: str  # approve / reject


class EventVoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: Union[UUID, str]
    event_id: Union[UUID, str]
    user_id: Union[UUID, str]
    vote: str
    created_at: datetime


class EventRSVPCreate(BaseModel):
    interested: bool = True


class EventRSVPResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: Union[UUID, str]
    event_id: Union[UUID, str]
    teacher_id: Union[UUID, str]
    interested: bool
    attended: bool
    created_at: datetime
