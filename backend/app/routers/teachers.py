from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User
from app.models.teacher_profile import TeacherProfile
from app.models.training import Training
from app.models.badge import Badge
from app.core.dependencies import get_current_user, require_admin
from app.services.analytics_cache import mark_analytics_cache_stale
from app.schemas.teacher import (
    TeacherProfileUpdate,
    TeacherProfileResponse,
    TeacherFullResponse,
    TrainingCreate,
    TrainingResponse,
    BadgeResponse,
)

router = APIRouter(prefix="/api/teachers", tags=["teachers"])


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
    return profile


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

    # auto-award completion badge
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
    query = select(TeacherProfile)
    if region:
        query = query.where(TeacherProfile.region == region)
    if subject:
        query = query.where(TeacherProfile.current_subject == subject)
    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    return result.scalars().all()


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

async def _get_profile(db: AsyncSession, *, user_id: UUID = None, profile_id: UUID = None) -> TeacherProfile | None:
    if user_id:
        result = await db.execute(select(TeacherProfile).where(TeacherProfile.user_id == user_id))
    else:
        result = await db.execute(select(TeacherProfile).where(TeacherProfile.id == profile_id))
    return result.scalar_one_or_none()


async def _get_profile_with_relations(db: AsyncSession, *, user_id: UUID = None, profile_id: UUID = None) -> TeacherProfile | None:
    query = select(TeacherProfile).options(selectinload(TeacherProfile.trainings), selectinload(TeacherProfile.badges))
    if user_id:
        query = query.where(TeacherProfile.user_id == user_id)
    else:
        query = query.where(TeacherProfile.id == profile_id)
    result = await db.execute(query)
    return result.scalar_one_or_none()


def _build_full_response(profile: TeacherProfile, user: User) -> TeacherFullResponse:
    return TeacherFullResponse(
        profile=TeacherProfileResponse.model_validate(profile),
        trainings=[TrainingResponse.model_validate(t) for t in profile.trainings],
        badges=[BadgeResponse.model_validate(b) for b in profile.badges],
        email=user.email,
        full_name=user.full_name,
    )
