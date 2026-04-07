import uuid
from datetime import datetime, timezone

from sqlalchemy import Text, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP as SATIMESTAMP

from app.database import Base


class EventSentiment(Base):
    __tablename__ = "event_sentiments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("events.id"), nullable=False)
    teacher_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("teacher_profiles.id"), nullable=False)
    sentiment_text: Mapped[str] = mapped_column(Text, nullable=False)
    sentiment_score: Mapped[float] = mapped_column(Float, nullable=True)  # AI-scored: -1.0 to 1.0
    created_at: Mapped[datetime] = mapped_column(SATIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc))

    event: Mapped["Event"] = relationship(back_populates="sentiments")
