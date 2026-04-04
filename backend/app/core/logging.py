from __future__ import annotations

import json
import logging
import time
import uuid
from contextvars import ContextVar
from datetime import datetime, timezone

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware


request_id_ctx_var: ContextVar[str] = ContextVar("request_id", default="")


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": request_id_ctx_var.get() or None,
        }

        event_payload = getattr(record, "event", None)
        if event_payload is not None:
            payload["event"] = event_payload
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)

        return json.dumps(payload, default=str)


def setup_logging(level: int = logging.INFO) -> None:
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())

    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    root_logger.addHandler(handler)
    root_logger.setLevel(level)


class RequestContextLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
        request.state.request_id = request_id

        token = request_id_ctx_var.set(request_id)
        start = time.perf_counter()

        try:
            response = await call_next(request)
            elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
            response.headers["x-request-id"] = request_id

            logging.getLogger("app.request").info(
                "%s %s completed",
                request.method,
                request.url.path,
                extra={"event": {"status_code": response.status_code, "latency_ms": elapsed_ms}},
            )
            return response
        finally:
            request_id_ctx_var.reset(token)
