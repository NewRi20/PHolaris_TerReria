import uuid
from datetime import datetime

from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class Badge(Base):
    __tablename__ = "badges"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    teacher_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("teacher_profiles.id"), nullable=False)
    event_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("events.id"), nullable=True)
    training_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("trainings.id"), nullable=True)
    badge_name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(nullable=True)
    awarded_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    teacher: Mapped["TeacherProfile"] = relationship(back_populates="badges")
