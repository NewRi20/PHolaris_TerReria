from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class MetricFlagSummary(BaseModel):
    metrics_flagged_count: int
    color_code: str
    readiness_score: Optional[float] = None


class RegionalOverviewItem(BaseModel):
    region: str
    teacher_count: int
    avg_years_experience: Optional[float] = None
    upcoming_events_count: int = 0
    total_interested: int = 0
    specialization_proximity_score: Optional[float] = None
    training_drought_index: Optional[float] = None
    experience_void_ratio: Optional[float] = None
    burnout_capacity_index: Optional[float] = None
    metric_flags: MetricFlagSummary


class AnalyticsOverviewResponse(BaseModel):
    generated_at: datetime
    total_regions: int
    regions: list[RegionalOverviewItem]


class RegionMetricResponse(BaseModel):
    region: str
    specialization_proximity_score: Optional[float] = None
    training_drought_index: Optional[float] = None
    experience_void_ratio: Optional[float] = None
    instructional_risk_pct: Optional[float] = None
    burnout_capacity_index: Optional[float] = None
    training_frequency_rate: Optional[float] = None
    subject_gap_index: Optional[float] = None
    readiness_score: Optional[float] = None
    color_code: Optional[str] = None


class SpecializationProximityItem(BaseModel):
    region: str
    out_of_field_percentage: float


class TrainingDroughtItem(BaseModel):
    region: str
    median_months_since_last_training: Optional[float] = None
    zero_training_rate: Optional[float] = None
    drought_index: float


class ExperienceVoidItem(BaseModel):
    region: str
    novice_teachers: int
    veteran_teachers: int
    novice_veteran_ratio: float


class InstructionalRiskItem(BaseModel):
    area_name: str
    area_type: str  # school or region
    flagged_teachers: int
    total_teachers: int
    risk_percentage: float


class BurnoutCapacityItem(BaseModel):
    region: str
    burnout_index: float
    average_student_load: Optional[float] = None
    average_working_hours_per_week: Optional[float] = None


class SubjectGapItem(BaseModel):
    region: str
    subject: str
    teacher_count: int
    estimated_needed: int
    shortage: int


class TrainingFrequencyItem(BaseModel):
    region: str
    avg_trainings_per_teacher_per_year: Optional[float] = None
    trained_within_3_years_rate: Optional[float] = None


class UpliftPriorityItem(BaseModel):
    rank: int
    region: str
    province: Optional[str] = None
    priority_score: float
    primary_problem: Optional[str] = None
    supporting_problems: list[str] = []


class PredictiveWorkforceItem(BaseModel):
    region: str
    current_teacher_count: int
    projected_teacher_demand: int
    projected_shortage: int
    status: str  # shortage or surplus


class MetricsListResponse(BaseModel):
    generated_at: datetime
    items: list
