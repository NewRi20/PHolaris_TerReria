import re
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User
from app.models.teacher_profile import TeacherProfile
from app.models.training import Training
from app.models.badge import Badge
from app.core.dependencies import get_current_user, require_admin
from app.services.analytics_cache import mark_analytics_cache_stale
from app.services.onboarding import is_teacher_profile_complete
from app.schemas.teacher import (
    TeacherOnboardingUpdate,
    TeacherProfileUpdate,
    TeacherProfileResponse,
    TeacherFullResponse,
    TrainingCreate,
    TrainingResponse,
    BadgeResponse,
)

router = APIRouter(prefix="/api/teachers", tags=["teachers"])


def _canonical_region(value: str) -> str:
    text = " ".join((value or "").strip().upper().replace("-", " ").split())
    if not text:
        return ""

    def has(pattern: str) -> bool:
        return re.search(pattern, text) is not None

    if "NCR" in text or "NATIONAL CAPITAL" in text:
        return "NCR"
    if text == "CAR" or "CORDILLERA" in text:
        return "CAR"
    if has(r"\bREGION\s+IV\s*A\b") or has(r"\bREGION\s*4\s*A\b") or has(r"\bR4A\b") or "CALABARZON" in text:
        return "CALABARZON"
    if has(r"\bREGION\s+IV\s*B\b") or has(r"\bREGION\s*4\s*B\b") or has(r"\bR4B\b") or "MIMAROPA" in text:
        return "MIMAROPA"
    if has(r"\bREGION\s+XIII\b") or has(r"\bREGION\s+13\b") or "CARAGA" in text:
        return "CARAGA"
    if has(r"\bREGION\s+XII\b") or has(r"\bREGION\s+12\b") or "SOCCSKSARGEN" in text:
        return "SOCCSKSARGEN"
    if has(r"\bREGION\s+XI\b") or has(r"\bREGION\s+11\b") or "DAVAO" in text:
        return "DAVAO"
    if has(r"\bREGION\s+X\b") or has(r"\bREGION\s+10\b") or "NORTHERN MINDANAO" in text:
        return "NORTHERN MINDANAO"
    if has(r"\bREGION\s+IX\b") or has(r"\bREGION\s+9\b") or "ZAMBOANGA PENINSULA" in text:
        return "ZAMBOANGA PENINSULA"
    if has(r"\bREGION\s+VIII\b") or has(r"\bREGION\s+8\b") or "EASTERN VISAYAS" in text:
        return "EASTERN VISAYAS"
    if has(r"\bREGION\s+VII\b") or has(r"\bREGION\s+7\b") or "CENTRAL VISAYAS" in text:
        return "CENTRAL VISAYAS"
    if has(r"\bREGION\s+VI\b") or has(r"\bREGION\s+6\b") or "WESTERN VISAYAS" in text:
        return "WESTERN VISAYAS"
    if has(r"\bREGION\s+V\b") or has(r"\bREGION\s+5\b") or "BICOL" in text:
        return "BICOL"
    if has(r"\bREGION\s+III\b") or has(r"\bREGION\s+3\b") or "CENTRAL LUZON" in text:
        return "CENTRAL LUZON"
    if has(r"\bREGION\s+II\b") or has(r"\bREGION\s+2\b") or "CAGAYAN VALLEY" in text:
        return "CAGAYAN VALLEY"
    if has(r"\bREGION\s+I\b") or has(r"\bREGION\s+1\b") or "ILOCOS" in text:
        return "ILOCOS"
    if "BARMM" in text or "ARMM" in text or "AUTONOMOUS REGION IN MUSLIM MINDANAO" in text:
        return "BARMM"

    return text


def _region_aliases(value: str) -> list[str]:
    canonical = _canonical_region(value)
    if not canonical:
        return []

    aliases: dict[str, list[str]] = {
        "NCR": ["NCR", "NATIONAL CAPITAL REGION", "METRO MANILA", "METROPOLITAN MANILA"],
        "CAR": ["CAR", "CORDILLERA", "CORDILLERA ADMINISTRATIVE REGION"],
        "ILOCOS": ["ILOCOS", "REGION I", "REGION 1"],
        "CAGAYAN VALLEY": ["CAGAYAN VALLEY", "REGION II", "REGION 2"],
        "CENTRAL LUZON": ["CENTRAL LUZON", "REGION III", "REGION 3"],
        "CALABARZON": ["CALABARZON", "REGION IV A", "REGION IV-A", "REGION 4A", "REGION 4 A", "4A", "R4A"],
        "MIMAROPA": ["MIMAROPA", "REGION IV B", "REGION IV-B", "REGION 4B", "R4B"],
        "BICOL": ["BICOL", "REGION V", "REGION 5"],
        "WESTERN VISAYAS": ["WESTERN VISAYAS", "REGION VI", "REGION 6"],
        "CENTRAL VISAYAS": ["CENTRAL VISAYAS", "REGION VII", "REGION 7"],
        "EASTERN VISAYAS": ["EASTERN VISAYAS", "REGION VIII", "REGION 8"],
        "ZAMBOANGA PENINSULA": ["ZAMBOANGA PENINSULA", "REGION IX", "REGION 9"],
        "NORTHERN MINDANAO": ["NORTHERN MINDANAO", "REGION X", "REGION 10"],
        "DAVAO": ["DAVAO", "DAVAO REGION", "REGION XI", "REGION 11"],
        "SOCCSKSARGEN": ["SOCCSKSARGEN", "REGION XII", "REGION 12"],
        "CARAGA": ["CARAGA", "REGION XIII", "REGION 13"],
        "BARMM": ["BARMM", "ARMM", "AUTONOMOUS REGION IN MUSLIM MINDANAO", "BANGSAMORO AUTONOMOUS REGION IN MUSLIM MINDANAO"],
    }
    candidates = aliases.get(canonical, [canonical])
    return list({" ".join(alias.strip().upper().replace("-", " ").split()) for alias in candidates if alias.strip()})


# ─── Own Profile ─────────────────────────────────────────────

@router.get("/me", response_model=TeacherFullResponse)
async def get_my_profile(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = await _get_profile_with_relations(db, user_id=user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Complete onboarding first.")
    return _build_full_response(profile, user)


@router.put("/me", response_model=TeacherProfileResponse)
async def update_my_profile(
    body: TeacherProfileUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = await _get_profile(db, user_id=user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(profile, key, value)

    mark_analytics_cache_stale()
    await db.flush()
    return _build_profile_response(profile)


@router.put("/me/onboarding", response_model=TeacherProfileResponse)
async def save_my_onboarding(
    body: TeacherOnboardingUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = await _get_profile(db, user_id=user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    onboarding_data = body.model_dump(exclude_unset=True)

    for key, value in onboarding_data.items():
        setattr(profile, key, value)

    mark_analytics_cache_stale()
    await db.flush()
    return _build_profile_response(profile)


# ─── Trainings ───────────────────────────────────────────────

@router.post("/me/trainings", response_model=TrainingResponse, status_code=201)
async def add_training(
    body: TrainingCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = await _get_profile(db, user_id=user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    training = Training(teacher_id=profile.id, **body.model_dump())
    db.add(training)
    await db.flush()

    # auto-award completion badge (idempotent — skip if already awarded for this training)
    existing_badge = await db.execute(
        select(Badge).where(Badge.teacher_id == profile.id, Badge.training_id == training.id)
    )
    if not existing_badge.scalar_one_or_none():
        badge = Badge(
            teacher_id=profile.id,
            training_id=training.id,
            badge_name=f"Completed: {training.training_name}",
            description=f"Completed training on {training.date_attended or 'unknown date'}",
        )
        db.add(badge)

    # update last_training_date if this is the most recent
    if training.date_attended and (not profile.last_training_date or training.date_attended > profile.last_training_date):
        profile.last_training_date = training.date_attended

    mark_analytics_cache_stale()
    return training


@router.get("/me/trainings", response_model=list[TrainingResponse])
async def get_my_trainings(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = await _get_profile(db, user_id=user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    result = await db.execute(
        select(Training).where(Training.teacher_id == profile.id).order_by(Training.date_attended.desc())
    )
    return result.scalars().all()


@router.get("/me/badges", response_model=list[BadgeResponse])
async def get_my_badges(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = await _get_profile(db, user_id=user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    result = await db.execute(
        select(Badge).where(Badge.teacher_id == profile.id).order_by(Badge.awarded_at.desc())
    )
    return result.scalars().all()


# ─── Admin: View any teacher ─────────────────────────────────

@router.get("/", response_model=list[TeacherProfileResponse])
async def list_teachers(
    region: str | None = None,
    subject: str | None = None,
    skip: int = 0,
    limit: int = 50,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    skip = max(skip, 0)
    limit = max(min(limit, 100), 1)

    query = select(TeacherProfile)
    if region:
        aliases = _region_aliases(region)
        if aliases:
            region_text = func.upper(func.coalesce(TeacherProfile.region, ""))
            normalized_region = func.upper(
                func.replace(
                    func.replace(
                        func.replace(func.trim(func.coalesce(TeacherProfile.region, "")), "-", " "),
                        "/",
                        " ",
                    ),
                    ".",
                    " ",
                )
            )
            alias_like_clauses = [region_text.like(f"%{alias}%") for alias in aliases]
            query = query.where(or_(normalized_region.in_(aliases), *alias_like_clauses))
        else:
            query = query.where(TeacherProfile.region == region)
    if subject:
        query = query.where(TeacherProfile.current_subject == subject)
    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    profiles = result.scalars().all()
    return [_build_profile_response(profile) for profile in profiles]


@router.get("/{teacher_id}", response_model=TeacherFullResponse)
async def get_teacher(
    teacher_id: UUID,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    profile = await _get_profile_with_relations(db, profile_id=teacher_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Teacher not found")

    # get the user for email/name
    result = await db.execute(select(User).where(User.id == profile.user_id))
    user = result.scalar_one()
    return _build_full_response(profile, user)


# ─── Helpers ─────────────────────────────────────────────────

async def _get_profile(db: AsyncSession, *, user_id: UUID | None = None, profile_id: UUID | None = None) -> TeacherProfile | None:
    if user_id:
        result = await db.execute(select(TeacherProfile).where(TeacherProfile.user_id == user_id))
    else:
        result = await db.execute(select(TeacherProfile).where(TeacherProfile.id == profile_id))
    return result.scalar_one_or_none()


async def _get_profile_with_relations(db: AsyncSession, *, user_id: UUID | None = None, profile_id: UUID | None = None) -> TeacherProfile | None:
    query = select(TeacherProfile).options(selectinload(TeacherProfile.trainings), selectinload(TeacherProfile.badges))
    if user_id:
        query = query.where(TeacherProfile.user_id == user_id)
    else:
        query = query.where(TeacherProfile.id == profile_id)
    result = await db.execute(query)
    return result.scalar_one_or_none()


def _build_full_response(profile: TeacherProfile, user: User) -> TeacherFullResponse:
    return TeacherFullResponse(
        profile=_build_profile_response(profile),
        trainings=[TrainingResponse.model_validate(t) for t in profile.trainings],
        badges=[BadgeResponse.model_validate(b) for b in profile.badges],
        email=user.email,
        full_name=user.full_name,
    )


def _build_profile_response(profile: TeacherProfile) -> TeacherProfileResponse:
    return TeacherProfileResponse.model_validate(profile).model_copy(
        update={"onboarding_complete": is_teacher_profile_complete(profile)}
    )
