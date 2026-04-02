import uuid
from datetime import datetime, date

from sqlalchemy import String, Integer, ForeignKey, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class Training(Base):
    __tablename__ = "trainings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    teacher_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("teacher_profiles.id"), nullable=False)
    training_name: Mapped[str] = mapped_column(String(255), nullable=False)
    training_type: Mapped[str] = mapped_column(String(100), nullable=True)  # Workshop, Seminar, Twinning
    subject_area: Mapped[str] = mapped_column(String(100), nullable=True)
    date_attended: Mapped[date] = mapped_column(Date, nullable=True)
    duration_days: Mapped[int] = mapped_column(Integer, nullable=True)
    provider: Mapped[str] = mapped_column(String(255), nullable=True)  # DOST-SEI, DepEd, etc.
    certificate_url: Mapped[str] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    teacher: Mapped["TeacherProfile"] = relationship(back_populates="trainings")
