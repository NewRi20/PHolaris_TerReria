from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SentimentCreate(BaseModel):
    sentiment_text: str


class SentimentResponse(BaseModel):
    id: str
    event_id: str
    teacher_id: str
    sentiment_text: str
    sentiment_score: Optional[float] = None
    created_at: datetime

    model_config = {"from_attributes": True}