from __future__ import annotations

import asyncio
import os
import uuid

from sqlalchemy import select

from app.core.security import hash_password
from app.database import async_session
from app.models.user import User


def _generate_admin_id() -> str:
    # Example format: ADM-1A2B3C4D
    return f"ADM-{uuid.uuid4().hex[:8].upper()}"


async def _next_unique_admin_id(session) -> str:
    while True:
        candidate = _generate_admin_id()
        result = await session.execute(select(User).where(User.admin_id == candidate))
        if result.scalar_one_or_none() is None:
            return candidate


async def seed_admin() -> None:
    # Prompt for input
    email = input("Admin email: ").strip().lower()
    password = input("Admin password: ").strip()
    full_name = input("Admin full name: ").strip()

    if not email:
        raise ValueError("Email is required")
    if not password:
        raise ValueError("Password is required")

    provided_admin_id = ""  # Always auto-generate

    async with async_session() as session:
        existing = await session.execute(select(User).where(User.email == email))
        user = existing.scalar_one_or_none()

        if user:
            if user.role != "admin":
                user.role = "admin"
            if not user.admin_id:
                user.admin_id = provided_admin_id or await _next_unique_admin_id(session)
            user.full_name = full_name or user.full_name
            user.hashed_password = hash_password(password)
            await session.commit()
            print(f"Updated existing admin: email={user.email} admin_id={user.admin_id}")
            return

        admin_id = provided_admin_id
        if not admin_id:
            admin_id = await _next_unique_admin_id(session)

        user = User(
            email=email,
            hashed_password=hash_password(password),
            full_name=full_name,
            role="admin",
            admin_id=admin_id,
        )
        session.add(user)
        await session.commit()

        print(f"Created admin: email={email} admin_id={admin_id}")


if __name__ == "__main__":
    asyncio.run(seed_admin())
