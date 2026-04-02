from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str

    # Auth
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # External APIs
    GEMINI_API_KEY: str = ""
    RESEND_API_KEY: str = ""

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    # Rate limiting
    RATE_LIMIT_DEFAULT: str = "60/minute"

    # Analytics cache
    ANALYTICS_CACHE_TTL_SECONDS: int = 1800
    ANALYTICS_AUTO_REFRESH_ENABLED: bool = False
    ANALYTICS_REFRESH_INTERVAL_SECONDS: int = 21600
    ANALYTICS_AUTO_REFRESH_ONLY_WHEN_STALE: bool = True

    # Event stale-voiding job (disabled by default on current Render plan).
    STALE_EVENT_VOIDING_ENABLED: bool = False
    STALE_EVENT_VOIDING_INTERVAL_SECONDS: int = 86400
    STALE_EVENT_VOIDING_LEAD_DAYS: int = 30

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }


settings = Settings()
