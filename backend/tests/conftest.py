"""
pytest fixtures shared across all test modules.
"""

from __future__ import annotations

from datetime import datetime, timezone

import pandas as pd
import pytest

from app.core.config import Settings


# ---------------------------------------------------------------------------
# Settings fixture
# ---------------------------------------------------------------------------

@pytest.fixture
def mock_settings() -> Settings:
    """Return a Settings instance with test-friendly defaults."""
    return Settings(
        app_name="Test Wind API",
        debug=True,
        cache_ttl_seconds=60,
        data_from="2026-01-01T00:00:00Z",
        data_to="2026-01-31T23:59:59Z",
    )


# ---------------------------------------------------------------------------
# Sample actuals data
# ---------------------------------------------------------------------------

def _make_ts(date: str, hour: int, minute: int = 0) -> datetime:
    return datetime(2026, 1, int(date.split("-")[2]), hour, minute, tzinfo=timezone.utc)


@pytest.fixture
def sample_actuals_raw() -> list[dict]:
    """
    Minimal raw FUELHH records covering 2026-01-01 (4 half-hour periods).
    """
    return [
        {
            "dataset": "FUELHH",
            "publishTime": "2026-01-01T01:00:00Z",
            "startTime": "2026-01-01T00:00:00Z",
            "settlementDate": "2026-01-01",
            "settlementPeriod": 1,
            "fuelType": "WIND",
            "generation": 4000,
        },
        {
            "dataset": "FUELHH",
            "publishTime": "2026-01-01T01:00:00Z",
            "startTime": "2026-01-01T00:30:00Z",
            "settlementDate": "2026-01-01",
            "settlementPeriod": 2,
            "fuelType": "WIND",
            "generation": 4200,
        },
        {
            "dataset": "FUELHH",
            "publishTime": "2026-01-01T01:00:00Z",
            "startTime": "2026-01-01T01:00:00Z",
            "settlementDate": "2026-01-01",
            "settlementPeriod": 3,
            "fuelType": "WIND",
            "generation": 3800,
        },
        {
            "dataset": "FUELHH",
            "publishTime": "2026-01-01T01:00:00Z",
            "startTime": "2026-01-01T01:30:00Z",
            "settlementDate": "2026-01-01",
            "settlementPeriod": 4,
            "fuelType": "WIND",
            "generation": 4100,
        },
    ]


@pytest.fixture
def sample_actuals_df(sample_actuals_raw) -> pd.DataFrame:
    from app.services.data_processor import process_actuals
    return process_actuals(sample_actuals_raw)


# ---------------------------------------------------------------------------
# Sample forecasts data
# ---------------------------------------------------------------------------

@pytest.fixture
def sample_forecasts_raw() -> list[dict]:
    """
    WINDFOR records published the previous day (D-1) covering the same periods.
    """
    return [
        {
            "dataset": "WINDFOR",
            "publishTime": "2025-12-31T09:00:00Z",  # D-2 vintage
            "startTime": "2026-01-01T00:00:00Z",
            "settlementDate": "2026-01-01",
            "settlementPeriod": 1,
            "generation": 3900,
        },
        {
            "dataset": "WINDFOR",
            "publishTime": "2025-12-31T09:00:00Z",
            "startTime": "2026-01-01T00:30:00Z",
            "settlementDate": "2026-01-01",
            "settlementPeriod": 2,
            "generation": 4100,
        },
        {
            "dataset": "WINDFOR",
            "publishTime": "2026-01-01T09:00:00Z",  # D-1 Morning vintage (before 11:00 gate)
            "startTime": "2026-01-01T00:00:00Z",
            "settlementDate": "2026-01-01",
            "settlementPeriod": 1,
            "generation": 4050,
        },
        {
            "dataset": "WINDFOR",
            "publishTime": "2026-01-01T09:00:00Z",
            "startTime": "2026-01-01T00:30:00Z",
            "settlementDate": "2026-01-01",
            "settlementPeriod": 2,
            "generation": 4220,
        },
        {
            "dataset": "WINDFOR",
            "publishTime": "2026-01-01T09:00:00Z",
            "startTime": "2026-01-01T01:00:00Z",
            "settlementDate": "2026-01-01",
            "settlementPeriod": 3,
            "generation": 3850,
        },
        {
            "dataset": "WINDFOR",
            "publishTime": "2026-01-01T09:00:00Z",
            "startTime": "2026-01-01T01:30:00Z",
            "settlementDate": "2026-01-01",
            "settlementPeriod": 4,
            "generation": 4150,
        },
    ]


@pytest.fixture
def sample_forecasts_df(sample_forecasts_raw) -> pd.DataFrame:
    from app.services.data_processor import process_forecasts
    return process_forecasts(sample_forecasts_raw)


# ---------------------------------------------------------------------------
# Merged DataFrame fixture
# ---------------------------------------------------------------------------

@pytest.fixture
def sample_merged_df(sample_actuals_df, sample_forecasts_df) -> pd.DataFrame:
    from app.services.data_processor import get_day_ahead_forecasts, merge_actuals_forecasts
    day_ahead = get_day_ahead_forecasts(sample_forecasts_df)
    return merge_actuals_forecasts(sample_actuals_df, day_ahead)
