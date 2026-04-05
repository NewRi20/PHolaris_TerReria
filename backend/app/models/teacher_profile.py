import uuid
from datetime import datetime, date, timezone
from typing import TYPE_CHECKING

from sqlalchemy import String, Boolean, Integer, Float, ForeignKey, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB, TIMESTAMP as SATIMESTAMP

from app.database import Base

if TYPE_CHECKING:
    from app.models.badge import Badge
    from app.models.training import Training
    from app.models.user import User


class TeacherProfile(Base):
    __tablename__ = "teacher_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    teacher_id_number: Mapped[str] = mapped_column(String(50), nullable=True, index=True)
    school: Mapped[str] = mapped_column(String(255), nullable=True)
    region: Mapped[str] = mapped_column(String(100), nullable=True, index=True)
    province: Mapped[str] = mapped_column(String(100), nullable=True)
    grade_level_taught: Mapped[str] = mapped_column(String(50), nullable=True)
    current_subject: Mapped[str] = mapped_column(String(100), nullable=True, index=True)
    specialization: Mapped[str] = mapped_column(String(100), nullable=True)
    teaching_outside_specialization: Mapped[bool] = mapped_column(Boolean, default=False)
    years_experience: Mapped[int] = mapped_column(Integer, nullable=True)
    num_classes: Mapped[int] = mapped_column(Integer, nullable=True)
    students_per_class: Mapped[dict] = mapped_column(JSONB, nullable=True)  # e.g. [35, 40, 38]
    working_hours_per_week: Mapped[float] = mapped_column(Float, nullable=True)
    last_training_date: Mapped[date] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(SATIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(SATIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user: Mapped["User"] = relationship(back_populates="teacher_profile")
    trainings: Mapped[list["Training"]] = relationship(back_populates="teacher", cascade="all, delete-orphan")
    badges: Mapped[list["Badge"]] = relationship(back_populates="teacher", cascade="all, delete-orphan")
