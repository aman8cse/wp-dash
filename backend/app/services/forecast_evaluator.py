"""
Forecast evaluation metrics.

All functions operate on a merged actuals+forecasts DataFrame produced by
data_processor.merge_actuals_forecasts().

Exports:
  compute_summary_metrics(merged_df)           -> dict
  compute_hourly_heatmap(merged_df)            -> list[dict]
  compute_daily_metrics(merged_df)             -> list[dict]
  compute_rolling_mae(merged_df, window_days)  -> list[dict]
  compute_error_distribution(merged_df, bins)  -> list[dict]
  compute_confidence_bands(merged_df)          -> dict
  compute_vintage_accuracy(forecasts_df, actuals_df) -> list[dict]
"""

from __future__ import annotations

import numpy as np
import pandas as pd

from app.core.logging import get_logger

logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# Summary metrics
# ---------------------------------------------------------------------------

def compute_summary_metrics(merged_df: pd.DataFrame) -> dict:
    """
    Compute headline accuracy metrics over the full merged dataset.

    Returns a dict with keys:
      mae, rmse, mape, bias, p90_error, skill_score,
      systematic_bias, random_error, procurement_buffer_mw
    """
    if merged_df.empty:
        return _empty_summary()

    errors = merged_df["error_mw"]
    abs_errors = merged_df["abs_error"]
    actuals = merged_df["actual_mw"]

    mae = float(abs_errors.mean())
    rmse = float(np.sqrt((errors ** 2).mean()))
    bias = float(errors.mean())
    p90_error = float(abs_errors.quantile(0.90))

    # MAPE — guard against zero actuals
    nonzero_mask = actuals != 0
    if nonzero_mask.sum() > 0:
        mape = float((abs_errors[nonzero_mask] / actuals[nonzero_mask]).mean() * 100)
    else:
        mape = float("nan")

    # Persistence baseline: for each period, the actual 48 periods (24 hours) ago
    # Half-hourly data → 48 periods = 24 hours
    persistence_errors = _persistence_baseline_errors(merged_df)
    mae_persistence = float(persistence_errors.abs().mean()) if not persistence_errors.empty else mae
    skill_score = 1.0 - (mae / mae_persistence) if mae_persistence > 0 else 0.0

    # Error decomposition
    systematic_bias = bias  # systematic component
    random_error = float((errors - bias).std())  # random component (std dev of centred errors)

    return {
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "mape": round(mape, 4) if not np.isnan(mape) else None,
        "bias": round(bias, 2),
        "p90_error": round(p90_error, 2),
        "skill_score": round(skill_score, 4),
        "systematic_bias": round(systematic_bias, 2),
        "random_error": round(random_error, 2),
        "procurement_buffer_mw": round(p90_error, 2),
    }


def _empty_summary() -> dict:
    return {
        "mae": 0.0, "rmse": 0.0, "mape": 0.0, "bias": 0.0,
        "p90_error": 0.0, "skill_score": 0.0, "systematic_bias": 0.0,
        "random_error": 0.0, "procurement_buffer_mw": 0.0,
    }


def _persistence_baseline_errors(merged_df: pd.DataFrame) -> pd.Series:
    """
    Compute persistence baseline errors.

    For each delivery period, the persistence forecast is the actual value
    48 half-hourly periods (24 hours) before. Falls back to the dataset
    mean if the lagged period is unavailable.
    """
    df = merged_df.set_index("start_time").sort_index()
    actual_series = df["actual_mw"]

    lag = pd.Timedelta(hours=24)
    # Build persistence series
    persistence = actual_series.copy()
    persistence.index = persistence.index + lag  # shift forward by 24h
    # Reindex to match current index
    persistence_aligned = persistence.reindex(actual_series.index)
    # Fill NaN (first 24h) with the global mean
    global_mean = actual_series.mean()
    persistence_aligned = persistence_aligned.fillna(global_mean)

    persistence_errors = actual_series - persistence_aligned
    return persistence_errors


# ---------------------------------------------------------------------------
# Hourly heatmap
# ---------------------------------------------------------------------------

def compute_hourly_heatmap(merged_df: pd.DataFrame) -> list[dict]:
    """
    Group by hour of day (0–23) and compute MAE per hour.
    """
    if merged_df.empty:
        return []

    df = merged_df.copy()
    df["hour"] = df["start_time"].dt.hour

    result = (
        df.groupby("hour")
        .agg(mae=("abs_error", "mean"), count=("abs_error", "count"))
        .reset_index()
    )

    return [
        {"hour": int(row.hour), "mae": round(float(row.mae), 2), "count": int(row.count)}
        for row in result.itertuples()
    ]


# ---------------------------------------------------------------------------
# Daily metrics
# ---------------------------------------------------------------------------

def compute_daily_metrics(merged_df: pd.DataFrame) -> list[dict]:
    """
    Group by settlement_date and compute MAE, bias, and RMSE per day.
    """
    if merged_df.empty:
        return []

    df = merged_df.copy()

    def daily_rmse(errors: pd.Series) -> float:
        return float(np.sqrt((errors ** 2).mean()))

    result = (
        df.groupby("settlement_date")
        .apply(
            lambda g: pd.Series({
                "mae": g["abs_error"].mean(),
                "bias": g["error_mw"].mean(),
                "rmse": daily_rmse(g["error_mw"]),
            })
        )
        .reset_index()
    )

    return [
        {
            "date": str(row.settlement_date),
            "mae": round(float(row.mae), 2),
            "bias": round(float(row.bias), 2),
            "rmse": round(float(row.rmse), 2),
        }
        for row in result.itertuples()
    ]


# ---------------------------------------------------------------------------
# Rolling MAE
# ---------------------------------------------------------------------------

def compute_rolling_mae(merged_df: pd.DataFrame, window_days: int = 7) -> list[dict]:
    """
    Compute rolling window-day MAE, grouped by date.
    """
    if merged_df.empty:
        return []

    df = merged_df.copy()
    daily_mae = (
        df.groupby("settlement_date")["abs_error"]
        .mean()
        .reset_index()
        .rename(columns={"abs_error": "mae"})
        .sort_values("settlement_date")
    )

    daily_mae["rolling_mae"] = (
        daily_mae["mae"]
        .rolling(window=window_days, min_periods=1)
        .mean()
    )

    return [
        {
            "date": str(row.settlement_date),
            "rolling_mae": round(float(row.rolling_mae), 2),
        }
        for row in daily_mae.itertuples()
    ]


# ---------------------------------------------------------------------------
# Error distribution
# ---------------------------------------------------------------------------

def compute_error_distribution(merged_df: pd.DataFrame, bins: int = 30) -> list[dict]:
    """
    Compute a histogram of error_mw values.

    Returns list of {bin_center: float, count: int}.
    """
    if merged_df.empty:
        return []

    errors = merged_df["error_mw"].dropna()
    counts, edges = np.histogram(errors, bins=bins)

    centers = (edges[:-1] + edges[1:]) / 2

    return [
        {"bin_center": round(float(c), 2), "count": int(n)}
        for c, n in zip(centers, counts)
    ]


# ---------------------------------------------------------------------------
# Confidence bands
# ---------------------------------------------------------------------------

def compute_confidence_bands(merged_df: pd.DataFrame) -> dict:
    """
    Compute ±1σ, ±2σ bands and P10/P90 percentiles of error_mw.
    """
    if merged_df.empty:
        return {"sigma_1": 0.0, "sigma_2": 0.0, "p10": 0.0, "p90": 0.0}

    abs_errors = merged_df["abs_error"]
    errors = merged_df["error_mw"]

    sigma_1 = float(abs_errors.std())
    sigma_2 = 2.0 * sigma_1
    p10 = float(errors.quantile(0.10))
    p90 = float(errors.quantile(0.90))

    return {
        "sigma_1": round(sigma_1, 2),
        "sigma_2": round(sigma_2, 2),
        "p10": round(p10, 2),
        "p90": round(p90, 2),
    }


# ---------------------------------------------------------------------------
# Vintage accuracy
# ---------------------------------------------------------------------------

def compute_vintage_accuracy(
    forecasts_df: pd.DataFrame,
    actuals_df: pd.DataFrame,
) -> list[dict]:
    """
    Group forecasts by rounded publish_time bucket (nearest 6h) and compute
    MAE against actuals for each vintage.

    Returns list of:
      {publish_bucket: str, hours_before_delivery: float, mae: float, count: int}
    Sorted by hours_before_delivery descending (D-2 first, intraday last).
    """
    if forecasts_df.empty or actuals_df.empty:
        return []

    # Merge forecasts with actuals on start_time
    merged = pd.merge(
        forecasts_df,
        actuals_df[["start_time", "actual_mw"]],
        on="start_time",
        how="inner",
    )

    if merged.empty:
        return []

    # Round publish_time to nearest 6-hour bucket
    merged["publish_bucket"] = merged["publish_time"].dt.floor("6h")

    # Compute absolute error per row
    merged["abs_error"] = (merged["forecast_mw"] - merged["actual_mw"]).abs()

    # Lead time: hours from publish_bucket to start_time
    merged["lead_hours"] = (
        (merged["start_time"] - merged["publish_bucket"]).dt.total_seconds() / 3600.0
    )

    result = (
        merged.groupby("publish_bucket")
        .agg(
            mae=("abs_error", "mean"),
            count=("abs_error", "count"),
            hours_before_delivery=("lead_hours", "median"),
        )
        .reset_index()
        .sort_values("hours_before_delivery", ascending=False)
    )

    return [
        {
            "publish_bucket": str(row.publish_bucket),
            "hours_before_delivery": round(float(row.hours_before_delivery), 2),
            "mae": round(float(row.mae), 2),
            "count": int(row.count),
        }
        for row in result.itertuples()
    ]
