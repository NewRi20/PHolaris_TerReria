import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP as SATIMESTAMP

from app.database import Base

if TYPE_CHECKING:
    from app.models.teacher_profile import TeacherProfile
    from app.models.training import Training


class Badge(Base):
    __tablename__ = "badges"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    teacher_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("teacher_profiles.id"), nullable=False)
    event_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("events.id"), nullable=True)
    training_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("trainings.id"), nullable=True)
    badge_name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    awarded_at: Mapped[datetime] = mapped_column(SATIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc))

    teacher: Mapped["TeacherProfile"] = relationship(back_populates="badges")
    training: Mapped["Training"] = relationship(back_populates="badges", foreign_keys=[training_id])
