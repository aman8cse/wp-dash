"""
Unit tests for forecast_evaluator service.
"""

from __future__ import annotations

import pandas as pd
import pytest

from app.services.forecast_evaluator import (
    compute_summary_metrics,
    compute_hourly_heatmap,
    compute_daily_metrics,
    compute_error_distribution,
    compute_confidence_bands,
)


def _make_dummy_merged_df() -> pd.DataFrame:
    # 48 periods across 1 day
    records = []
    for p in range(1, 49):
        hour = (p - 1) // 2
        minute = ((p - 1) % 2) * 30
        actual = 5000.0 + (p * 50)
        forecast = actual + (100.0 if p % 2 == 0 else -50.0)
        records.append({
            "start_time": pd.Timestamp(f"2026-01-01 {hour:02d}:{minute:02d}:00", tz="UTC"),
            "publish_time": pd.Timestamp("2025-12-31 08:30:00", tz="UTC"),
            "settlement_date": "2026-01-01",
            "settlement_period": p,
            "actual_mw": actual,
            "forecast_mw": forecast,
            "error_mw": forecast - actual,
            "abs_error": abs(forecast - actual),
        })
    return pd.DataFrame(records)


def test_compute_summary_metrics():
    df = _make_dummy_merged_df()
    metrics = compute_summary_metrics(df)

    assert "mae" in metrics
    assert "rmse" in metrics
    assert "mape" in metrics
    assert "bias" in metrics
    assert "p90_error" in metrics
    assert "skill_score" in metrics
    assert "procurement_buffer_mw" in metrics
    assert metrics["mae"] > 0
    assert metrics["rmse"] >= metrics["mae"]


def test_compute_hourly_heatmap():
    df = _make_dummy_merged_df()
    heatmap = compute_hourly_heatmap(df)

    assert len(heatmap) == 24
    for pt in heatmap:
        assert 0 <= pt["hour"] <= 23
        assert pt["mae"] >= 0


def test_compute_daily_metrics():
    df = _make_dummy_merged_df()
    daily = compute_daily_metrics(df)

    assert len(daily) == 1
    assert daily[0]["date"] == "2026-01-01"
    assert daily[0]["mae"] > 0


def test_compute_confidence_bands():
    df = _make_dummy_merged_df()
    bands = compute_confidence_bands(df)

    assert "sigma_1" in bands
    assert "sigma_2" in bands
    assert bands["sigma_2"] >= bands["sigma_1"]
