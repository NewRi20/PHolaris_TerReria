from __future__ import annotations

import argparse
import asyncio
import csv
import json
import os
import random
import re
import sys
from datetime import date, datetime, timedelta
from functools import lru_cache
from pathlib import Path
from typing import Any
from uuid import uuid4

from sqlalchemy import select, text
from dotenv import load_dotenv

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

# Ensure settings can resolve required env vars even when launched from backend/scripts.
load_dotenv(BACKEND_ROOT / ".env")

from app.core.security import hash_password
from app.database import async_session
from app.models.badge import Badge
from app.models.event import Event, EventVote
from app.models.sentiment import EventSentiment
from app.models.teacher_profile import TeacherProfile
from app.models.training import Training
from app.models.user import User


DEFAULT_TEACHER_PASSWORD = "Teacher123!"
SLUG_CLEANER = re.compile(r"[^a-z0-9]+")
SURNAME_PATTERN = re.compile(r"\[\[(.*?)\]\]")

SCIENCE_MATH_SUBJECTS = [
    "Mathematics",
    "General Science",
    "Physics",
    "Chemistry",
    "Biology",
    "Earth Science",
    "Environmental Science",
    "Statistics",
    "Algebra",
    "Geometry",
    "Calculus",
]

TRAINING_TYPES = ["Workshop", "Seminar", "Training Camp", "Webinar", "Roundtable"]
EVENT_TYPES = ["workshop", "seminar", "webinar", "coaching", "bootcamp"]
EVENT_STATUSES = ["draft", "voting", "approved", "scheduled", "completed"]

POSITIVE_SENTIMENTS = [
    "Great pacing and practical activities.",
    "Very useful examples for classroom application.",
    "I can apply these strategies immediately.",
    "Well-organized session with strong facilitation.",
]

NEUTRAL_SENTIMENTS = [
    "The session was okay and informative overall.",
    "Useful content, but some parts were too fast.",
    "Balanced discussion, with room for more hands-on time.",
]

NEGATIVE_SENTIMENTS = [
    "The session felt rushed and needed clearer flow.",
    "Some topics were too advanced for the allotted time.",
    "Materials could be improved for better clarity.",
]


def slugify(value: str) -> str:
    return SLUG_CLEANER.sub("-", value.lower()).strip("-")


def _load_region_catalog() -> list[dict[str, Any]]:
    catalog_path = Path(__file__).resolve().parents[1] / ".context" / "regions_provinces.json"
    if catalog_path.exists():
        payload = json.loads(catalog_path.read_text(encoding="utf-8"))
        regions = payload.get("regions") or []
        if regions:
            return regions

    return [
        {"code": "NCR", "name": "National Capital Region", "provinces": ["National Capital Region"]},
        {"code": "R1", "name": "Region I (Ilocos Region)", "provinces": ["Ilocos Norte", "Ilocos Sur"]},
        {"code": "R3", "name": "Region III (Central Luzon)", "provinces": ["Pampanga", "Bulacan", "Bataan"]},
        {"code": "R4A", "name": "Region IV-A (CALABARZON)", "provinces": ["Laguna", "Cavite", "Batangas"]},
    ]


def _load_school_catalog() -> dict[str, list[str]]:
    school_path = Path(__file__).resolve().parents[1] / ".context" / "school_names.json"
    if not school_path.exists():
        return {}

    payload = json.loads(school_path.read_text(encoding="utf-8"))
    schools_by_region = payload.get("schools_by_region") or {}

    normalized: dict[str, list[str]] = {}
    for region_code, schools in schools_by_region.items():
        if not isinstance(region_code, str):
            continue
        if not isinstance(schools, list):
            continue

        clean_schools = [str(item).strip() for item in schools if str(item).strip()]
        if clean_schools:
            normalized[region_code.strip().upper()] = clean_schools

    return normalized


def _load_first_names() -> list[str]:
    names_csv = Path(__file__).resolve().parents[1] / ".context" / "names" / "pop_names.csv"
    first_names: list[str] = []
    seen: set[str] = set()
    if names_csv.exists():
        with names_csv.open("r", encoding="utf-8") as file:
            reader = csv.DictReader(file)
            for row in reader:
                name = (row.get("forename") or "").strip()
                if not name:
                    continue
                normalized = name.lower()
                if normalized in seen:
                    continue
                seen.add(normalized)
                first_names.append(name)
    return first_names


def _load_surnames() -> list[str]:
    surnames_path = Path(__file__).resolve().parents[1] / ".context" / "surnames" / "surname.txt"
    surnames: list[str] = []
    seen: set[str] = set()
    if not surnames_path.exists():
        return surnames

    content = surnames_path.read_text(encoding="utf-8")
    for raw in SURNAME_PATTERN.findall(content):
        candidate = raw.split("|")[0].strip()
        candidate = re.sub(r"[^A-Za-z\s\-]", "", candidate).strip()
        if not candidate:
            continue
        normalized = candidate.lower()
        if normalized in seen:
            continue
        seen.add(normalized)
        surnames.append(candidate)
    return surnames


def _ensure_full_name_json() -> dict[str, Any]:
    full_name_path = Path(__file__).resolve().parents[1] / ".context" / "full_name.json"
    if full_name_path.exists():
        payload = json.loads(full_name_path.read_text(encoding="utf-8"))
    else:
        payload = {"meta": {}, "first_names": [], "surnames": [], "full_names": []}

    first_names = payload.get("first_names") or _load_first_names()
    surnames = payload.get("surnames") or _load_surnames()
    full_names = payload.get("full_names") or []

    if not full_names and first_names and surnames:
        full_names = [f"{first} {last}" for first in first_names for last in surnames]

    payload = {
        "meta": {
            "first_name_source": "names/pop_names.csv",
            "surname_source": "surnames/surname.txt",
            "first_name_count": len(first_names),
            "surname_count": len(surnames),
            "full_name_count": len(full_names),
        },
        "first_names": first_names,
        "surnames": surnames,
        "full_names": full_names,
    }

    full_name_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return payload


@lru_cache(maxsize=1)
def _teacher_password_hash() -> str:
    return hash_password(DEFAULT_TEACHER_PASSWORD)


def _random_school_name(
    rng: random.Random,
    province_name: str,
    region_code: str,
    school_catalog: dict[str, list[str]],
) -> str:
    region_schools = school_catalog.get(region_code.upper()) or []
    if region_schools:
        return rng.choice(region_schools)

    prefix = rng.choice(["San Isidro", "Mabini", "Rizal", "Bayanihan", "Apolinario", "Del Pilar"])
    suffix = rng.choice(["High School", "National High School", "Integrated School", "Science High School"])
    return f"{prefix} {province_name} {suffix}"


def _random_teacher_record(
    rng: random.Random,
    index: int,
    regions: list[dict[str, Any]],
    full_names: list[str],
    school_catalog: dict[str, list[str]],
    is_active: bool,
) -> dict[str, Any]:
    region_entry = rng.choice(regions)
    province = rng.choice(region_entry.get("provinces") or [region_entry["name"]])
    teacher_name = rng.choice(full_names)
    subject = rng.choice(SCIENCE_MATH_SUBJECTS)
    specialization = subject if rng.random() > 0.2 else rng.choice(SCIENCE_MATH_SUBJECTS)
    user_id = uuid4()
    profile_id = uuid4()
    base_training_date = date(2026, 1, 1) + timedelta(days=rng.randint(0, 120))

    trainings: list[dict[str, Any]] = []
    for training_index in range(rng.randint(1, 3)):
        training_id = uuid4()
        training_date = base_training_date + timedelta(days=training_index * rng.randint(7, 40))
        training_name = f"{specialization} Capacity Building {training_index + 1}"
        trainings.append(
            {
                "id": training_id,
                "teacher_id": profile_id,
                "training_name": training_name,
                "training_type": rng.choice(TRAINING_TYPES),
                "subject_area": specialization,
                "date_attended": training_date,
                "duration_days": rng.choice([1, 2, 3, 5]),
                "provider": rng.choice(["DepEd", "DOST-SEI", "CHED", "LGU", "TESDA"]),
                "certificate_url": None,
            }
        )

    return {
        "user": {
            "id": user_id,
            "admin_id": None,
            "email": f"{slugify(teacher_name)}.{index:04d}@test.local",
            "hashed_password": _teacher_password_hash(),
            "role": "teacher",
            "full_name": teacher_name,
            "is_active": is_active,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        },
        "profile": {
            "id": profile_id,
            "user_id": user_id,
            "teacher_id_number": f"TCH-{2026 + index % 3}-{index:04d}",
            "school": _random_school_name(rng, province, region_entry["code"], school_catalog),
            "region": region_entry["code"],
            "province": province,
            "grade_level_taught": rng.choice(["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"]),
            "current_subject": subject,
            "specialization": specialization,
            "teaching_outside_specialization": subject != specialization,
            "years_experience": rng.randint(1, 25),
            "num_classes": rng.randint(2, 8),
            "students_per_class": [rng.randint(28, 45) for _ in range(3)],
            "working_hours_per_week": float(rng.randint(30, 50)),
            "last_training_date": base_training_date,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        },
        "trainings": trainings,
    }


def build_demo_teacher_dataset(
    *,
    teacher_count: int = 1200,
    seed: int = 42,
    active_ratio: float = 0.9,
) -> dict[str, Any]:
    rng = random.Random(seed)
    region_catalog = _load_region_catalog()
    school_catalog = _load_school_catalog()
    names_payload = _ensure_full_name_json()
    full_names = names_payload.get("full_names") or []
    if not full_names:
        raise ValueError("No names available. Check .context/names and .context/surnames sources.")

    active_ratio = max(0.0, min(1.0, active_ratio))
    active_count = int(teacher_count * active_ratio)
    inactive_count = teacher_count - active_count
    inactive_indexes = set(rng.sample(range(teacher_count), k=inactive_count)) if inactive_count > 0 else set()

    teachers = []
    for index in range(teacher_count):
        teachers.append(
            _random_teacher_record(
                rng,
                index,
                region_catalog,
                full_names,
                school_catalog,
                is_active=index not in inactive_indexes,
            )
        )
    return {
        "teachers": teachers,
        "meta": {
            "teacher_count": teacher_count,
            "active_count": active_count,
            "inactive_count": inactive_count,
            "active_ratio": active_ratio,
        },
    }


async def _seed_demo_teachers(teacher_count: int, seed: int, active_ratio: float) -> dict[str, int]:
    dataset = build_demo_teacher_dataset(teacher_count=teacher_count, seed=seed, active_ratio=active_ratio)

    async with async_session() as session:
        existing_emails = set((await session.execute(select(User.email))).scalars().all())
        existing_teacher_numbers = set(
            (await session.execute(select(TeacherProfile.teacher_id_number))).scalars().all()
        )

        inserted_teachers = 0
        inserted_trainings = 0
        inserted_badges = 0
        pending_badges: list[dict[str, Any]] = []

        for teacher_record in dataset["teachers"]:
            user_data = teacher_record["user"]
            profile_data = teacher_record["profile"]
            if user_data["email"] in existing_emails or profile_data["teacher_id_number"] in existing_teacher_numbers:
                continue

            user = User(**user_data)
            profile = TeacherProfile(**profile_data)
            session.add(user)
            session.add(profile)
            inserted_teachers += 1

            for training_data in teacher_record["trainings"]:
                session.add(Training(**training_data))
                pending_badges.append(
                    {
                        "id": uuid4(),
                        "teacher_id": profile.id,
                        "training_id": training_data["id"],
                        "badge_name": f"Completed: {training_data['training_name']}",
                        "description": f"Completed training on {training_data['date_attended']}",
                        "awarded_at": datetime.utcnow(),
                    }
                )
                inserted_trainings += 1
                inserted_badges += 1

        # Ensure referenced training rows are flushed before badge inserts to satisfy FK constraints.
        await session.flush()
        for badge_data in pending_badges:
            session.add(Badge(**badge_data))

        await session.commit()

    return {
        "teachers": inserted_teachers,
        "trainings": inserted_trainings,
        "badges": inserted_badges,
    }


def _weighted_event_status(rng: random.Random) -> str:
    roll = rng.random()
    if roll < 0.18:
        return "draft"
    if roll < 0.40:
        return "voting"
    if roll < 0.62:
        return "approved"
    if roll < 0.84:
        return "scheduled"
    return "completed"


def _sentiment_text_and_score(rng: random.Random) -> tuple[str, float]:
    roll = rng.random()
    if roll < 0.66:
        return rng.choice(POSITIVE_SENTIMENTS), round(rng.uniform(0.2, 0.95), 2)
    if roll < 0.88:
        return rng.choice(NEUTRAL_SENTIMENTS), round(rng.uniform(-0.19, 0.19), 2)
    return rng.choice(NEGATIVE_SENTIMENTS), round(rng.uniform(-0.85, -0.2), 2)


def _event_slug(base_slug: str, existing_slugs: set[str]) -> str:
    if base_slug not in existing_slugs:
        existing_slugs.add(base_slug)
        return base_slug

    suffix = 2
    while f"{base_slug}-{suffix}" in existing_slugs:
        suffix += 1
    final_slug = f"{base_slug}-{suffix}"
    existing_slugs.add(final_slug)
    return final_slug


async def _seed_demo_events(
    *,
    event_count: int,
    seed: int,
    votes_per_event: int,
    rsvps_per_event: int,
    sentiments_per_event: int,
) -> dict[str, int]:
    if event_count <= 0:
        return {"events": 0, "votes": 0, "rsvps": 0, "sentiments": 0}

    rng = random.Random(seed)

    async with async_session() as session:
        rsvp_columns = set(
            (
                await session.execute(
                    text(
                        """
                        select column_name
                        from information_schema.columns
                        where table_schema = 'public' and table_name = 'event_rsvps'
                        """
                    )
                )
            ).scalars().all()
        )
        rsvp_has_attended = "attended" in rsvp_columns

        teacher_rows = (
            await session.execute(
                select(
                    TeacherProfile.id,
                    TeacherProfile.user_id,
                    TeacherProfile.region,
                    TeacherProfile.province,
                    TeacherProfile.current_subject,
                )
            )
        ).all()
        if not teacher_rows:
            return {"events": 0, "votes": 0, "rsvps": 0, "sentiments": 0}

        teacher_pool = [
            {
                "teacher_id": row[0],
                "user_id": row[1],
                "region": row[2],
                "province": row[3],
                "subject": row[4],
            }
            for row in teacher_rows
        ]

        teacher_user_ids = [item["user_id"] for item in teacher_pool if item["user_id"] is not None]
        admin_user_ids = (await session.execute(select(User.id).where(User.role == "admin"))).scalars().all()
        existing_slugs = set((await session.execute(select(Event.slug))).scalars().all())

        created_events: list[Event] = []
        now_utc = datetime.utcnow()
        subjects = SCIENCE_MATH_SUBJECTS

        for index in range(event_count):
            sample_teacher = rng.choice(teacher_pool)
            subject = sample_teacher["subject"] or rng.choice(subjects)
            status = _weighted_event_status(rng)
            event_type = rng.choice(EVENT_TYPES)

            title = f"{subject} {event_type.title()} Session {now_utc.year}-{index + 1:03d}"
            slug = _event_slug(slugify(title), existing_slugs)

            event_date = None
            rsvp_deadline = None
            if status in {"scheduled", "completed"}:
                offset_days = rng.randint(-90, 90)
                event_date = now_utc + timedelta(days=offset_days)
                rsvp_deadline = event_date - timedelta(days=rng.randint(3, 14))

            creator_id = None
            if admin_user_ids:
                creator_id = rng.choice(admin_user_ids)
            elif teacher_user_ids:
                creator_id = rng.choice(teacher_user_ids)

            event = Event(
                title=title,
                slug=slug,
                description=f"Focused {subject} capacity-building session for teachers.",
                event_type=event_type,
                target_subject=subject,
                target_subject_branch=subject,
                target_grade_levels=["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"],
                target_regions=[sample_teacher["region"]] if sample_teacher["region"] else None,
                target_provinces=[sample_teacher["province"]] if sample_teacher["province"] else None,
                status=status,
                ai_generated=False,
                event_date=event_date,
                rsvp_deadline=rsvp_deadline,
                location=f"{sample_teacher['province'] or 'Regional'} Training Center",
                created_by=creator_id,
            )
            session.add(event)
            created_events.append(event)

        await session.flush()

        inserted_votes = 0
        inserted_rsvps = 0
        inserted_sentiments = 0
        pending_rsvp_rows: list[dict[str, Any]] = []

        for event in created_events:
            if teacher_user_ids and event.status in {"voting", "approved", "scheduled", "completed"}:
                total_votes = min(votes_per_event, len(teacher_user_ids))
                for voter_id in rng.sample(teacher_user_ids, k=total_votes):
                    vote_value = "approve" if rng.random() < 0.74 else "reject"
                    session.add(EventVote(event_id=event.id, user_id=voter_id, vote=vote_value))
                    inserted_votes += 1

            rsvp_teacher_ids: list[Any] = []
            if event.status in {"approved", "scheduled", "completed"}:
                total_rsvps = min(rsvps_per_event, len(teacher_pool))
                sampled_teachers = rng.sample(teacher_pool, k=total_rsvps)
                rsvp_teacher_ids = [row["teacher_id"] for row in sampled_teachers]

                for teacher_id in rsvp_teacher_ids:
                    interested = rng.random() < 0.85
                    attended = event.status == "completed" and interested and rng.random() < 0.78
                    if rsvp_has_attended:
                        pending_rsvp_rows.append(
                            {
                                "id": uuid4(),
                                "event_id": event.id,
                                "teacher_id": teacher_id,
                                "interested": interested,
                                "attended": attended,
                                "created_at": datetime.utcnow(),
                            }
                        )
                    else:
                        pending_rsvp_rows.append(
                            {
                                "id": uuid4(),
                                "event_id": event.id,
                                "teacher_id": teacher_id,
                                "interested": interested,
                                "created_at": datetime.utcnow(),
                            }
                        )
                    inserted_rsvps += 1

            if event.status in {"scheduled", "completed"}:
                source_teacher_ids = rsvp_teacher_ids or [row["teacher_id"] for row in teacher_pool]
                if source_teacher_ids:
                    total_sentiments = min(sentiments_per_event, len(source_teacher_ids))
                    for teacher_id in rng.sample(source_teacher_ids, k=total_sentiments):
                        text_value, score = _sentiment_text_and_score(rng)
                        session.add(
                            EventSentiment(
                                event_id=event.id,
                                teacher_id=teacher_id,
                                sentiment_text=text_value,
                                sentiment_score=score,
                            )
                        )
                        inserted_sentiments += 1

        if pending_rsvp_rows:
            if rsvp_has_attended:
                await session.execute(
                    text(
                        """
                        insert into event_rsvps (id, event_id, teacher_id, interested, attended, created_at)
                        values (:id, :event_id, :teacher_id, :interested, :attended, :created_at)
                        """
                    ),
                    pending_rsvp_rows,
                )
            else:
                await session.execute(
                    text(
                        """
                        insert into event_rsvps (id, event_id, teacher_id, interested, created_at)
                        values (:id, :event_id, :teacher_id, :interested, :created_at)
                        """
                    ),
                    pending_rsvp_rows,
                )

        await session.commit()

    return {
        "events": len(created_events),
        "votes": inserted_votes,
        "rsvps": inserted_rsvps,
        "sentiments": inserted_sentiments,
    }


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Seed believable teacher-only demo data (math/science focus).")
    parser.add_argument("--teachers", type=int, default=1200, help="Number of teacher records to seed")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducible data")
    parser.add_argument(
        "--active-ratio",
        type=float,
        default=0.9,
        help="Share of generated teachers marked active (0.0 to 1.0)",
    )
    parser.add_argument("--events", type=int, default=0, help="Number of events to seed")
    parser.add_argument(
        "--votes-per-event",
        type=int,
        default=120,
        help="Maximum number of event votes generated per event",
    )
    parser.add_argument(
        "--rsvps-per-event",
        type=int,
        default=80,
        help="Maximum number of event RSVPs generated per event",
    )
    parser.add_argument(
        "--sentiments-per-event",
        type=int,
        default=30,
        help="Maximum number of event sentiments generated per event",
    )
    return parser


async def main() -> None:
    parser = _build_parser()
    args = parser.parse_args()
    summary = await _seed_demo_teachers(args.teachers, args.seed, args.active_ratio)
    event_summary = await _seed_demo_events(
        event_count=args.events,
        seed=args.seed + 1000,
        votes_per_event=max(0, args.votes_per_event),
        rsvps_per_event=max(0, args.rsvps_per_event),
        sentiments_per_event=max(0, args.sentiments_per_event),
    )
    print(
        "Teacher seed complete: "
        f"teachers={summary['teachers']}, trainings={summary['trainings']}, badges={summary['badges']}"
    )
    print(
        "Event seed complete: "
        f"events={event_summary['events']}, votes={event_summary['votes']}, "
        f"rsvps={event_summary['rsvps']}, sentiments={event_summary['sentiments']}"
    )


if __name__ == "__main__":
    asyncio.run(main())
