from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


# --- Teacher Profile ---

class TeacherProfileUpdate(BaseModel):
    teacher_id_number: Optional[str] = None
    school: Optional[str] = None
    region: Optional[str] = None
    province: Optional[str] = None
    grade_level_taught: Optional[str] = None
    current_subject: Optional[str] = None
    specialization: Optional[str] = None
    teaching_outside_specialization: Optional[bool] = None
    years_experience: Optional[int] = None
    num_classes: Optional[int] = None
    students_per_class: Optional[list[int]] = None
    working_hours_per_week: Optional[float] = None
    last_training_date: Optional[date] = None


class TeacherProfileResponse(BaseModel):
    id: str
    user_id: str
    teacher_id_number: Optional[str] = None
    school: Optional[str] = None
    region: Optional[str] = None
    province: Optional[str] = None
    grade_level_taught: Optional[str] = None
    current_subject: Optional[str] = None
    specialization: Optional[str] = None
    teaching_outside_specialization: bool = False
    years_experience: Optional[int] = None
    num_classes: Optional[int] = None
    students_per_class: Optional[list[int]] = None
    working_hours_per_week: Optional[float] = None
    last_training_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- Training ---

class TrainingCreate(BaseModel):
    training_name: str
    training_type: Optional[str] = None
    subject_area: Optional[str] = None
    date_attended: Optional[date] = None
    duration_days: Optional[int] = None
    provider: Optional[str] = None
    certificate_url: Optional[str] = None


class TrainingResponse(BaseModel):
    id: str
    teacher_id: str
    training_name: str
    training_type: Optional[str] = None
    subject_area: Optional[str] = None
    date_attended: Optional[date] = None
    duration_days: Optional[int] = None
    provider: Optional[str] = None
    certificate_url: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Badge ---

class BadgeResponse(BaseModel):
    id: str
    badge_name: str
    description: Optional[str] = None
    event_id: Optional[str] = None
    training_id: Optional[str] = None
    awarded_at: datetime

    model_config = {"from_attributes": True}


# --- Combined profile view ---

class TeacherFullResponse(BaseModel):
    profile: TeacherProfileResponse
    trainings: list[TrainingResponse] = []
    badges: list[BadgeResponse] = []
    email: str
    full_name: Optional[str] = None
