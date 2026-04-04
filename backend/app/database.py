import ssl as ssl_module

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


def _clean_database_url(url: str) -> str:
    """Strip query params that asyncpg doesn't understand (sslmode, channel_binding, etc.)."""
    if "?" in url:
        return url.split("?")[0]
    return url


# asyncpg handles SSL via connect_args, not URL params
ssl_context = ssl_module.create_default_context()
engine = create_async_engine(
    _clean_database_url(settings.DATABASE_URL),
    echo=False,
    #connect_args={"ssl": ssl_context},
)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
