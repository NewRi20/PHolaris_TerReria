import asyncio
import ssl as ssl_module
import sys
from pathlib import Path
from logging.config import fileConfig

# Make sure Python can find the 'app' package
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context

from app.config import settings
from app.database import Base

# Import all models so Alembic sees them for autogenerate
import app.models  # noqa: F401

config = context.config

# Strip query params asyncpg doesn't understand (sslmode, channel_binding, etc.)
raw_url = settings.DATABASE_URL
clean_url = raw_url.split("?")[0] if "?" in raw_url else raw_url
config.set_main_option("sqlalchemy.url", clean_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations():
    ssl_context = ssl_module.create_default_context()
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        connect_args={"ssl": ssl_context},
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online():
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
