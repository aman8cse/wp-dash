"""
Analytics endpoints:

  GET /api/v1/analytics          — full AnalyticsResponse (all metrics)
  GET /api/v1/analytics/merged   — merged actuals + day-ahead forecasts
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.core.cache import get_cached_actuals, get_cached_analytics, get_cached_forecasts
from app.core.logging import get_logger
from app.schemas.analytics import (
    AnalyticsResponse,
    ConfidenceBands,
    DailyMetric,
    ErrorDistributionBin,
    HourlyHeatmapPoint,
    MergedDataPoint,
    MergedDataResponse,
    SummaryMetrics,
    VintageAccuracyPoint,
)
from app.services.data_processor import get_day_ahead_forecasts, merge_actuals_forecasts
from app.services.forecast_evaluator import compute_confidence_bands

router = APIRouter()
logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# GET /analytics
# ---------------------------------------------------------------------------

@router.get(
    "",
    response_model=AnalyticsResponse,
    summary="Get full analytics: all accuracy metrics for Jan 2026",
)
async def get_analytics() -> AnalyticsResponse:
    """
    Returns pre-computed accuracy metrics for all January 2026 wind forecasts
    vs actuals, including summary metrics, hourly heatmap, daily breakdown,
    error distribution, confidence bands, and vintage accuracy curve.
    """
    analytics = get_cached_analytics()

    if analytics is None:
        raise HTTPException(
            status_code=503,
            detail="Analytics not yet computed. Please try again shortly.",
        )

    summary_raw = analytics["summary"]
    summary = SummaryMetrics(
        mae=summary_raw["mae"],
        rmse=summary_raw["rmse"],
        mape=summary_raw.get("mape"),
        bias=summary_raw["bias"],
        p90_error=summary_raw["p90_error"],
        skill_score=summary_raw["skill_score"],
        systematic_bias=summary_raw["systematic_bias"],
        random_error=summary_raw["random_error"],
        procurement_buffer_mw=summary_raw["procurement_buffer_mw"],
        data_points=summary_raw.get("data_points", 0),
    )

    hourly_heatmap = [
        HourlyHeatmapPoint(**point) for point in analytics["hourly_heatmap"]
    ]

    daily_metrics = [
        DailyMetric(**point) for point in analytics["daily_metrics"]
    ]

    error_distribution = [
        ErrorDistributionBin(**point) for point in analytics["error_distribution"]
    ]

    bands_raw = analytics["confidence_bands"]
    confidence_bands = ConfidenceBands(**bands_raw)

    vintage_accuracy = [
        VintageAccuracyPoint(**point) for point in analytics["vintage_accuracy"]
    ]

    logger.info("analytics.endpoint.ok")
    return AnalyticsResponse(
        summary=summary,
        hourly_heatmap=hourly_heatmap,
        daily_metrics=daily_metrics,
        error_distribution=error_distribution,
        confidence_bands=confidence_bands,
        vintage_accuracy=vintage_accuracy,
        rolling_mae=analytics.get("rolling_mae", []),
    )


# ---------------------------------------------------------------------------
# GET /analytics/merged
# ---------------------------------------------------------------------------

@router.get(
    "/merged",
    response_model=MergedDataResponse,
    summary="Get merged actuals + day-ahead forecasts with confidence bands",
)
async def get_merged_data() -> MergedDataResponse:
    """
    Returns the row-level merged dataset of actuals and day-ahead forecasts,
    including error columns and overall confidence bands.
    Useful for plotting the forecast vs actual time series.
    """
    actuals_df = get_cached_actuals()
    forecasts_df = get_cached_forecasts()

    if actuals_df is None or forecasts_df is None:
        raise HTTPException(
            status_code=503,
            detail="Data not yet loaded. Please try again shortly.",
        )

    day_ahead_df = get_day_ahead_forecasts(forecasts_df)
    merged_df = merge_actuals_forecasts(actuals_df, day_ahead_df)

    if merged_df.empty:
        return MergedDataResponse(
            data=[],
            confidence_bands=ConfidenceBands(sigma_1=0.0, sigma_2=0.0, p10=0.0, p90=0.0),
            count=0,
        )

    bands = compute_confidence_bands(merged_df)

    records = [
        MergedDataPoint(
            start_time=row.start_time.isoformat(),
            settlement_date=str(row.settlement_date),
            settlement_period=int(row.settlement_period),
            actual_mw=float(row.actual_mw),
            forecast_mw=float(row.forecast_mw),
            publish_time=row.publish_time.isoformat(),
            error_mw=float(row.error_mw),
            abs_error=float(row.abs_error),
        )
        for row in merged_df.itertuples()
    ]

    logger.info("analytics.merged.ok", count=len(records))
    return MergedDataResponse(
        data=records,
        confidence_bands=ConfidenceBands(**bands),
        count=len(records),
    )
