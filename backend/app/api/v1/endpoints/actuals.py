"""
GET /api/v1/actuals â€” returns processed wind actuals for Jan 2026 from cache.
"""

from fastapi import APIRouter, HTTPException

from app.core.cache import get_cached_actuals
from app.core.config import get_settings
from app.core.logging import get_logger
from app.schemas.actuals import ActualRecord, ActualsResponse

router = APIRouter()
logger = get_logger(__name__)
settings = get_settings()


@router.get("", response_model=ActualsResponse, summary="Get wind actuals for Jan 2026")
async def get_actuals() -> ActualsResponse:
    """
    Return the half-hourly wind generation actuals (FUELHH) for January 2026,
    served from the in-memory cache.
    """
    actuals_df = get_cached_actuals()

    if actuals_df is None:
        raise HTTPException(
            status_code=503,
            detail="Actuals data not yet loaded. Please try again shortly.",
        )

    if actuals_df.empty:
        logger.warning("actuals.endpoint.empty_cache")
        return ActualsResponse(
            data=[],
            count=0,
            from_date=settings.data_from,
            to_date=settings.data_to,
        )

    records = [
        ActualRecord(
            start_time=row.start_time,
            settlement_date=str(row.settlement_date),
            settlement_period=int(row.settlement_period),
            actual_mw=float(row.actual_mw),
        )
        for row in actuals_df.itertuples()
    ]

    logger.info("actuals.endpoint.ok", count=len(records))
    return ActualsResponse(
        data=records,
        count=len(records),
        from_date=settings.data_from,
        to_date=settings.data_to,
    )
