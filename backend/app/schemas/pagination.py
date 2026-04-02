from typing import Generic, Optional, TypeVar

from pydantic import BaseModel


T = TypeVar("T")


class PaginationMeta(BaseModel):
    next_cursor: Optional[str] = None
    has_more: bool
    total_count: Optional[int] = None


class PaginatedResponse(BaseModel, Generic[T]):
    data: list[T]
    pagination: PaginationMeta
