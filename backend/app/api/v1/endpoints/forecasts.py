"""
Forecast endpoints:

  GET /api/v1/forecasts/day-ahead    — decision-relevant day-ahead forecasts
  GET /api/v1/forecasts/vintage      — all vintages for a specific date
  GET /api/v1/forecasts/latest       — live latest forecast from Elexon
"""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, HTTPException, Query

from app.core.cache import get_cached_forecasts
from app.core.logging import get_logger
from app.schemas.forecasts import (
    DayAheadForecastRecord,
    ForecastRecord,
    ForecastsResponse,
    VintageForecastGroup,
    VintageResponse,
)
from app.services.data_processor import get_day_ahead_forecasts, get_vintage_forecasts
from app.services.elexon_client import ElexonClient

router = APIRouter()
logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# GET /forecasts/day-ahead
# ---------------------------------------------------------------------------

@router.get(
    "/day-ahead",
    response_model=ForecastsResponse,
    summary="Get day-ahead decision-relevant wind forecasts for Jan 2026",
)
async def get_day_ahead() -> ForecastsResponse:
    """
    Returns the single 'decision-relevant' forecast for each half-hour period
    in January 2026: the LATEST forecast published before the day-ahead gate
    closure (delivery_date - 1 @ 11:00 UTC).
    """
    forecasts_df = get_cached_forecasts()

    if forecasts_df is None:
        raise HTTPException(
            status_code=503,
            detail="Forecast data not yet loaded. Please try again shortly.",
        )

    if forecasts_df.empty:
        return ForecastsResponse(day_ahead=[], count=0)

    day_ahead_df = get_day_ahead_forecasts(forecasts_df)

    records = [
        DayAheadForecastRecord(
            start_time=row.start_time,
            publish_time=row.publish_time,
            settlement_date=str(row.settlement_date),
            settlement_period=int(row.settlement_period),
            forecast_mw=float(row.forecast_mw),
        )
        for row in day_ahead_df.itertuples()
    ]

    logger.info("forecasts.day_ahead.ok", count=len(records))
    return ForecastsResponse(day_ahead=records, count=len(records))


# ---------------------------------------------------------------------------
# GET /forecasts/vintage
# ---------------------------------------------------------------------------

@router.get(
    "/vintage",
    response_model=VintageResponse,
    summary="Get all forecast vintages for a specific date",
)
async def get_vintage(
    date: str = Query(
        ...,
        description="Settlement date in YYYY-MM-DD format, e.g. 2026-01-15",
        example="2026-01-15",
    ),
) -> VintageResponse:
    """
    Returns all available forecast vintages (D-2, D-1 Evening, D-1 Morning,
    Intraday) for a specific settlement date in January 2026.
    """
    # Basic date validation
    try:
        datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid date format '{date}'. Expected YYYY-MM-DD.",
        )

    forecasts_df = get_cached_forecasts()

    if forecasts_df is None:
        raise HTTPException(
            status_code=503,
            detail="Forecast data not yet loaded. Please try again shortly.",
        )

    vintages_raw = get_vintage_forecasts(forecasts_df, date)

    vintage_groups = []
    for v in vintages_raw:
        forecast_records = [
            ForecastRecord(
                start_time=f["start_time"],
                publish_time=v["publish_time"],
                settlement_date=date,
                settlement_period=f.get("settlement_period", 0),
                forecast_mw=float(f["forecast_mw"]),
            )
            for f in v["forecasts"]
        ]
        vintage_groups.append(
            VintageForecastGroup(
                publish_time=v["publish_time"],
                publish_label=v["publish_label"],
                hours_before_delivery=v["hours_before_delivery"],
                forecasts=forecast_records,
            )
        )

    logger.info("forecasts.vintage.ok", date=date, vintages=len(vintage_groups))
    return VintageResponse(target_date=date, vintages=vintage_groups)


# ---------------------------------------------------------------------------
# GET /forecasts/latest
# ---------------------------------------------------------------------------

@router.get(
    "/latest",
    response_model=list[dict],
    summary="Get the latest available wind forecast from Elexon (live)",
)
async def get_latest_forecast() -> list[dict]:
    """
    Calls the Elexon live endpoint /forecast/generation/wind/latest and
    returns the raw records. This is not cached — it reflects real-time data.
    """
    async with ElexonClient() as client:
        records = await client.fetch_latest_forecast()

    if not records:
        raise HTTPException(
            status_code=502,
            detail="Could not retrieve latest forecast from Elexon. The API may be unavailable.",
        )

    logger.info("forecasts.latest.ok", count=len(records))
    return records
