import uuid
from datetime import datetime, date
from typing import TYPE_CHECKING

from sqlalchemy import String, Boolean, Integer, Text, ForeignKey, Enum as SAEnum, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB, TIMESTAMP

from app.database import Base

if TYPE_CHECKING:
    from app.models.sentiment import EventSentiment


class Event(Base):
    __tablename__ = "events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    event_type: Mapped[str] = mapped_column(String(100), nullable=True)
    target_subject: Mapped[str] = mapped_column(String(100), nullable=True)
    target_subject_branch: Mapped[str] = mapped_column(String(100), nullable=True)
    target_grade_levels: Mapped[dict] = mapped_column(JSONB, nullable=True)
    target_regions: Mapped[dict] = mapped_column(JSONB, nullable=True)
    target_provinces: Mapped[dict] = mapped_column(JSONB, nullable=True)
    target_audience_criteria: Mapped[dict] = mapped_column(JSONB, nullable=True)
    recommended_format: Mapped[str] = mapped_column(String(100), nullable=True)
    priority_timeline: Mapped[str] = mapped_column(String(50), nullable=True)

    status: Mapped[str] = mapped_column(
        SAEnum("draft", "voting", "approved", "scheduled", "completed", "void", name="event_status"),
        default="draft",
    )

    ai_generated: Mapped[bool] = mapped_column(Boolean, default=False)
    ai_rationale: Mapped[dict] = mapped_column(JSONB, nullable=True)
    ai_analysis_snapshot: Mapped[dict] = mapped_column(JSONB, nullable=True)
    expected_impact: Mapped[dict] = mapped_column(JSONB, nullable=True)
    learning_objectives: Mapped[dict] = mapped_column(JSONB, nullable=True)
    suggested_topics: Mapped[dict] = mapped_column(JSONB, nullable=True)
    suggested_speakers: Mapped[dict] = mapped_column(JSONB, nullable=True)
    format_justification: Mapped[str] = mapped_column(Text, nullable=True)
    tags: Mapped[dict] = mapped_column(JSONB, nullable=True)

    suggested_duration_days: Mapped[int] = mapped_column(Integer, nullable=True)
    suggested_date_earliest: Mapped[date] = mapped_column(nullable=True)
    suggested_date_latest: Mapped[date] = mapped_column(nullable=True)
    event_date: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    location: Mapped[str] = mapped_column(String(255), nullable=True)
    rsvp_deadline: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=True)

    created_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)
    voided_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=True)

    votes: Mapped[list["EventVote"]] = relationship(back_populates="event", cascade="all, delete-orphan")
    rsvps: Mapped[list["EventRSVP"]] = relationship(back_populates="event", cascade="all, delete-orphan")
    sentiments: Mapped[list["EventSentiment"]] = relationship(back_populates="event", cascade="all, delete-orphan")


class EventVote(Base):
    __tablename__ = "event_votes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("events.id"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    vote: Mapped[str] = mapped_column(SAEnum("approve", "reject", name="vote_type"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    event: Mapped["Event"] = relationship(back_populates="votes")

    __table_args__ = (
        UniqueConstraint("event_id", "user_id", name="uq_one_vote_per_user"),
    )


class EventRSVP(Base):
    __tablename__ = "event_rsvps"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("events.id"), nullable=False)
    teacher_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("teacher_profiles.id"), nullable=False)
    interested: Mapped[bool] = mapped_column(Boolean, default=True)
    attended: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    event: Mapped["Event"] = relationship(back_populates="rsvps")
