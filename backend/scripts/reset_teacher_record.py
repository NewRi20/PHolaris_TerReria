from __future__ import annotations

import argparse
import asyncio
import sys
import uuid
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import delete, select

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

load_dotenv(BACKEND_ROOT / ".env")

from app.database import async_session
from app.models.badge import Badge
from app.models.email_log import EmailLog
from app.models.event import EventRSVP, EventVote
from app.models.sentiment import EventSentiment
from app.models.teacher_profile import TeacherProfile
from app.models.training import Training
from app.models.user import User


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Reset a teacher record (delete child rows, reset profile, optionally delete user).",
    )
    target = parser.add_mutually_exclusive_group(required=True)
    target.add_argument("--email", help="Teacher user email")
    target.add_argument("--user-id", help="Teacher user UUID")
    target.add_argument("--teacher-id", help="Teacher profile UUID")

    parser.add_argument(
        "--delete-user",
        action="store_true",
        help="Delete the users row too (default is keep account and recreate blank teacher profile).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be deleted without committing.",
    )
    return parser.parse_args()


async def _resolve_target(session, args: argparse.Namespace) -> tuple[User, TeacherProfile]:
    if args.email:
        result = await session.execute(select(User).where(User.email == args.email.strip().lower()))
        user = result.scalar_one_or_none()
        if not user:
            raise ValueError(f"No user found for email={args.email}")

        profile_result = await session.execute(select(TeacherProfile).where(TeacherProfile.user_id == user.id))
        profile = profile_result.scalar_one_or_none()
        if not profile:
            raise ValueError(f"No teacher profile found for user email={args.email}")

        return user, profile

    if args.user_id:
        user_uuid = uuid.UUID(args.user_id)
        result = await session.execute(select(User).where(User.id == user_uuid))
        user = result.scalar_one_or_none()
        if not user:
            raise ValueError(f"No user found for id={args.user_id}")

        profile_result = await session.execute(select(TeacherProfile).where(TeacherProfile.user_id == user.id))
        profile = profile_result.scalar_one_or_none()
        if not profile:
            raise ValueError(f"No teacher profile found for user id={args.user_id}")

        return user, profile

    teacher_uuid = uuid.UUID(args.teacher_id)
    profile_result = await session.execute(select(TeacherProfile).where(TeacherProfile.id == teacher_uuid))
    profile = profile_result.scalar_one_or_none()
    if not profile:
        raise ValueError(f"No teacher profile found for id={args.teacher_id}")

    result = await session.execute(select(User).where(User.id == profile.user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise ValueError(f"No user found for teacher profile id={args.teacher_id}")

    return user, profile


async def _run() -> None:
    args = _parse_args()

    async with async_session() as session:
        user, profile = await _resolve_target(session, args)

        if user.role != "teacher":
            raise ValueError("Target user is not a teacher")

        print(f"Target user: {user.email} ({user.id})")
        print(f"Target profile: {profile.id}")

        delete_steps = [
            ("event_votes", delete(EventVote).where(EventVote.user_id == user.id)),
            ("email_logs", delete(EmailLog).where(EmailLog.teacher_id == profile.id)),
            ("event_sentiments", delete(EventSentiment).where(EventSentiment.teacher_id == profile.id)),
            ("event_rsvps", delete(EventRSVP).where(EventRSVP.teacher_id == profile.id)),
            ("badges", delete(Badge).where(Badge.teacher_id == profile.id)),
            ("trainings", delete(Training).where(Training.teacher_id == profile.id)),
        ]

        if args.dry_run:
            print("Dry run enabled. No changes were committed.")
            for name, _ in delete_steps:
                print(f"Would delete dependent rows from: {name}")
            if args.delete_user:
                print("Would delete teacher profile and user row.")
            else:
                print("Would delete teacher profile and recreate an empty profile for the same user.")
            return

        for _, stmt in delete_steps:
            await session.execute(stmt)

        await session.delete(profile)
        await session.flush()

        if args.delete_user:
            await session.delete(user)
        else:
            session.add(TeacherProfile(user_id=user.id))

        await session.commit()

        if args.delete_user:
            print("Deleted teacher record and user account.")
        else:
            print("Reset teacher record and recreated an empty teacher profile.")


if __name__ == "__main__":
    asyncio.run(_run())
