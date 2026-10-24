"""
Cache module: in-memory TTLCache backed by APScheduler for periodic refresh.

Stores:
  - actuals_jan2026    -> pd.DataFrame (processed wind actuals)
  - forecasts_jan2026  -> pd.DataFrame (processed wind forecasts)
  - analytics_summary  -> dict (pre-computed analytics)

On startup, immediately pre-fetches all data.
APScheduler refreshes data every cache_ttl_seconds (default 3600s).
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Any

import pandas as pd
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from cachetools import TTLCache

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)
settings = get_settings()

# ---------------------------------------------------------------------------
# In-memory stores
# ---------------------------------------------------------------------------
# Use a simple dict as our cache store (APScheduler manages refresh timing)
_store: dict[str, Any] = {
    "actuals_jan2026": None,
    "forecasts_jan2026": None,
    "analytics_summary": None,
    "last_refresh_time": None,
}

_scheduler: AsyncIOScheduler | None = None


# ---------------------------------------------------------------------------
# Accessors
# ---------------------------------------------------------------------------

def get_cached_actuals() -> pd.DataFrame | None:
    """Return the cached actuals DataFrame, or None if not yet loaded."""
    return _store.get("actuals_jan2026")


def get_cached_forecasts() -> pd.DataFrame | None:
    """Return the cached forecasts DataFrame, or None if not yet loaded."""
    return _store.get("forecasts_jan2026")


def get_cached_analytics() -> dict | None:
    """Return the cached analytics summary dict, or None if not yet loaded."""
    return _store.get("analytics_summary")


def get_last_refresh_time() -> str | None:
    """Return ISO timestamp of last successful refresh, or None."""
    ts: datetime | None = _store.get("last_refresh_time")
    return ts.isoformat() if ts else None


def is_cache_populated() -> bool:
    """Return True only if all three stores have data."""
    return all(
        _store.get(k) is not None
        for k in ("actuals_jan2026", "forecasts_jan2026", "analytics_summary")
    )


# ---------------------------------------------------------------------------
# Refresh logic
# ---------------------------------------------------------------------------

async def _refresh_data() -> None:
    """Fetch fresh data from Elexon and rebuild all cached objects."""
    # Import here to avoid circular imports at module level
    from app.services.elexon_client import ElexonClient
    from app.services.data_processor import (
        process_actuals,
        process_forecasts,
        get_day_ahead_forecasts,
        merge_actuals_forecasts,
    )
    from app.services.forecast_evaluator import (
        compute_summary_metrics,
        compute_hourly_heatmap,
        compute_daily_metrics,
        compute_rolling_mae,
        compute_error_distribution,
        compute_confidence_bands,
        compute_vintage_accuracy,
    )

    logger.info("cache.refresh.start")

    try:
        async with ElexonClient() as client:
            # Fetch actuals: full January 2026
            raw_actuals = await client.fetch_wind_actuals(
                from_dt=settings.data_from,
                to_dt=settings.data_to,
            )
            logger.info("cache.refresh.actuals_fetched", count=len(raw_actuals))

            # Fetch forecasts: go back to 2025-12-30 to capture D-2 forecasts for Jan 1
            raw_forecasts = await client.fetch_wind_forecasts(
                from_dt="2025-12-30T00:00:00Z",
                to_dt=settings.data_to,
            )
            logger.info("cache.refresh.forecasts_fetched", count=len(raw_forecasts))

        if not raw_actuals:
            logger.warning("cache.refresh.no_actuals")
            return

        if not raw_forecasts:
            logger.warning("cache.refresh.no_forecasts")
            return

        # Process raw data
        actuals_df = process_actuals(raw_actuals)
        forecasts_df = process_forecasts(raw_forecasts)

        logger.info(
            "cache.refresh.processed",
            actuals_rows=len(actuals_df),
            forecast_rows=len(forecasts_df),
        )

        # Build day-ahead view and merge
        day_ahead_df = get_day_ahead_forecasts(forecasts_df)
        merged_df = merge_actuals_forecasts(actuals_df, day_ahead_df)

        logger.info("cache.refresh.merged", merged_rows=len(merged_df))

        # Compute analytics
        summary = compute_summary_metrics(merged_df)
        summary["data_points"] = len(merged_df)
        hourly = compute_hourly_heatmap(merged_df)
        daily = compute_daily_metrics(merged_df)
        rolling = compute_rolling_mae(merged_df)
        error_dist = compute_error_distribution(merged_df)
        bands = compute_confidence_bands(merged_df)
        vintage_acc = compute_vintage_accuracy(forecasts_df, actuals_df)

        analytics = {
            "summary": summary,
            "hourly_heatmap": hourly,
            "daily_metrics": daily,
            "rolling_mae": rolling,
            "error_distribution": error_dist,
            "confidence_bands": bands,
            "vintage_accuracy": vintage_acc,
        }

        # Atomically update the store
        _store["actuals_jan2026"] = actuals_df
        _store["forecasts_jan2026"] = forecasts_df
        _store["analytics_summary"] = analytics
        _store["last_refresh_time"] = datetime.now(tz=timezone.utc)

        logger.info("cache.refresh.complete", last_refresh=get_last_refresh_time())

    except Exception as exc:  # noqa: BLE001
        logger.error("cache.refresh.error", error=str(exc), exc_info=True)
        # Do not clear existing cached data on failure â€” keep serving stale data


# ---------------------------------------------------------------------------
# Scheduler lifecycle
# ---------------------------------------------------------------------------

async def start_cache_scheduler() -> None:
    """Initialize the APScheduler and trigger an immediate first fetch."""
    global _scheduler

    _scheduler = AsyncIOScheduler()
    _scheduler.add_job(
        _refresh_data,
        trigger="interval",
        seconds=settings.cache_ttl_seconds,
        id="cache_refresh",
        replace_existing=True,
        next_run_time=None,  # Don't auto-schedule first run yet
    )
    _scheduler.start()
    logger.info("cache.scheduler.started", interval_seconds=settings.cache_ttl_seconds)

    # Trigger immediate pre-fetch without blocking startup
    asyncio.create_task(_refresh_data())


async def stop_cache_scheduler() -> None:
    """Gracefully shut down the APScheduler."""
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("cache.scheduler.stopped")
    _scheduler = None
