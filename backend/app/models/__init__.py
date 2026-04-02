# Import all models so Alembic and SQLAlchemy can discover them
from app.models.user import User
from app.models.teacher_profile import TeacherProfile
from app.models.training import Training
from app.models.badge import Badge
from app.models.event import Event, EventVote, EventRSVP
from app.models.sentiment import EventSentiment
from app.models.email_log import EmailLog

__all__ = [
    "User",
    "TeacherProfile",
    "Training",
    "Badge",
    "Event",
    "EventVote",
    "EventRSVP",
    "EventSentiment",
    "EmailLog",
]
