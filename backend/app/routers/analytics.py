from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_admin
from app.database import get_db
from app.models.user import User
from app.services.analytics_cache import get_analytics_snapshot, get_cache_meta
from app.services.analytics_engine import analytics_overview, region_metric_detail, uplift_priority_queue

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/overview")
async def get_overview(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    snapshot = await get_analytics_snapshot(db)
    overview = await analytics_overview(db)
    overview["cache"] = get_cache_meta()
    overview["snapshot_keys"] = list(snapshot.keys())
    return overview


@router.get("/region/{region}")
async def get_region_metrics(
    region: str,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    return await region_metric_detail(db, region)


@router.get("/specialization-proximity")
async def get_specialization_proximity(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    snapshot = await get_analytics_snapshot(db)
    return snapshot.get("specialization_proximity", [])


@router.get("/training-drought")
async def get_training_drought(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    snapshot = await get_analytics_snapshot(db)
    return snapshot.get("training_drought", [])


@router.get("/experience-void")
async def get_experience_void(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    snapshot = await get_analytics_snapshot(db)
    return snapshot.get("experience_void", [])


@router.get("/instructional-risk")
async def get_instructional_risk(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    snapshot = await get_analytics_snapshot(db)
    return snapshot.get("instructional_risk", [])


@router.get("/burnout-capacity")
async def get_burnout_capacity(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    snapshot = await get_analytics_snapshot(db)
    return snapshot.get("burnout_capacity", [])


@router.get("/subject-gaps")
async def get_subject_gaps(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    snapshot = await get_analytics_snapshot(db)
    return snapshot.get("subject_gap", [])


@router.get("/training-frequency")
async def get_training_frequency(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    snapshot = await get_analytics_snapshot(db)
    return snapshot.get("training_frequency", [])


@router.get("/uplift-priority")
async def get_uplift_priority(
    top_n: int = 5,
    db: AsyncSession = Depends(get_db),
):
    await get_analytics_snapshot(db)
    return await uplift_priority_queue(db, top_n=top_n)


@router.get("/predictive-workforce")
async def get_predictive_workforce(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    snapshot = await get_analytics_snapshot(db)
    return snapshot.get("predictive_workforce", [])


@router.get("/regional-readiness")
async def get_regional_readiness(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    snapshot = await get_analytics_snapshot(db)
    return snapshot.get("regional_readiness", [])


@router.get("/cache-meta")
async def get_analytics_cache_meta(
    admin: User = Depends(require_admin),
):
    return get_cache_meta()


@router.post("/refresh")
async def refresh_analytics_cache(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    snapshot = await get_analytics_snapshot(db, force_refresh=True)
    return {
        "status": "refreshed",
        "cache": get_cache_meta(),
        "snapshot_keys": list(snapshot.keys()),
    }
