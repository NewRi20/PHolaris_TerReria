from __future__ import annotations

import base64
import binascii
import json
import uuid
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Callable, Sequence, TypeVar

from sqlalchemy import and_, or_
from sqlalchemy.sql import Select


T = TypeVar("T")


@dataclass(frozen=True)
class CursorToken:
    created_at: datetime
    row_id: str


class InvalidCursorError(ValueError):
    pass


def encode_cursor(created_at: datetime, row_id: Any) -> str:
    payload = json.dumps({"created_at": created_at.isoformat(), "row_id": str(row_id)})
    return base64.urlsafe_b64encode(payload.encode("utf-8")).decode("utf-8")


def decode_cursor(cursor: str | None) -> CursorToken | None:
    if not cursor:
        return None

    try:
        normalized = cursor.strip()
        padding_needed = (-len(normalized)) % 4
        normalized = normalized + ("=" * padding_needed)

        raw = base64.urlsafe_b64decode(normalized.encode("utf-8")).decode("utf-8")
        data = json.loads(raw)
        created_at = datetime.fromisoformat(data["created_at"])
        row_id = str(data["row_id"])
        return CursorToken(created_at=created_at, row_id=row_id)
    except (binascii.Error, json.JSONDecodeError, KeyError, TypeError, ValueError) as exc:
        raise InvalidCursorError("Invalid cursor format") from exc


def _coerce_row_id(column: Any, raw_row_id: str) -> Any:
    python_type = getattr(column.type, "python_type", None)

    if python_type is None:
        return raw_row_id
    if python_type is int:
        return int(raw_row_id)
    if python_type is uuid.UUID:
        return uuid.UUID(raw_row_id)
    if python_type is str:
        return raw_row_id

    return python_type(raw_row_id)


def apply_cursor_filter(
    query: Select,
    *,
    model: Any,
    cursor: str | None,
    created_field: str = "created_at",
    id_field: str = "id",
) -> Select:
    token = decode_cursor(cursor)
    if not token:
        return query

    created_col = getattr(model, created_field)
    id_col = getattr(model, id_field)
    typed_row_id = _coerce_row_id(id_col, token.row_id)

    return query.where(
        or_(
            created_col < token.created_at,
            and_(created_col == token.created_at, id_col < typed_row_id),
        )
    )


def build_cursor_page(
    rows: Sequence[T],
    *,
    page_size: int,
    get_created_at: Callable[[T], datetime],
    get_row_id: Callable[[T], Any],
) -> tuple[list[T], str | None, bool]:
    has_more = len(rows) > page_size
    page_items = list(rows[:page_size])

    if not has_more or not page_items:
        return page_items, None, False

    last = page_items[-1]
    next_cursor = encode_cursor(get_created_at(last), get_row_id(last))
    return page_items, next_cursor, True
