"""
Data processing layer: raw Elexon JSON → cleaned pandas DataFrames.

Exports:
  process_actuals(raw)              -> pd.DataFrame
  process_forecasts(raw)            -> pd.DataFrame
  get_day_ahead_forecasts(df)       -> pd.DataFrame
  get_vintage_forecasts(df, date)   -> list[dict]
  merge_actuals_forecasts(a, f)     -> pd.DataFrame
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import pandas as pd

from app.core.logging import get_logger

logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# process_actuals
# ---------------------------------------------------------------------------

def process_actuals(raw: list[dict[str, Any]]) -> pd.DataFrame:
    """
    Convert raw FUELHH records into a clean DataFrame.

    Columns: start_time (UTC tz-aware), settlement_date, settlement_period, actual_mw
    """
    if not raw:
        logger.warning("process_actuals.empty_input")
        return pd.DataFrame(columns=["start_time", "settlement_date", "settlement_period", "actual_mw"])

    df = pd.DataFrame(raw)

    # Ensure fuelType filter (should already be WIND, but be safe)
    if "fuelType" in df.columns:
        df = df[df["fuelType"].str.upper() == "WIND"].copy()

    # Parse startTime as UTC-aware datetime
    df["start_time"] = pd.to_datetime(df["startTime"], utc=True)

    # Rename and select
    df = df.rename(columns={"generation": "actual_mw"})

    keep = ["start_time", "settlementDate", "settlementPeriod", "actual_mw"]
    available = [c for c in keep if c in df.columns]
    df = df[available].copy()

    df = df.rename(columns={
        "settlementDate": "settlement_date",
        "settlementPeriod": "settlement_period",
    })

    df["actual_mw"] = pd.to_numeric(df["actual_mw"], errors="coerce")
    df = df.dropna(subset=["start_time", "actual_mw"])
    df = df.sort_values("start_time").reset_index(drop=True)

    logger.info("process_actuals.done", rows=len(df))
    return df


# ---------------------------------------------------------------------------
# process_forecasts
# ---------------------------------------------------------------------------

def process_forecasts(raw: list[dict[str, Any]]) -> pd.DataFrame:
    """
    Convert raw WINDFOR records into a clean DataFrame.

    Columns: start_time (UTC), publish_time (UTC), settlement_date,
             settlement_period, forecast_mw
    """
    if not raw:
        logger.warning("process_forecasts.empty_input")
        return pd.DataFrame(columns=[
            "start_time", "publish_time", "settlement_date", "settlement_period", "forecast_mw"
        ])

    df = pd.DataFrame(raw)

    df["start_time"] = pd.to_datetime(df["startTime"], utc=True)
    df["publish_time"] = pd.to_datetime(df["publishTime"], utc=True)

    df = df.rename(columns={"generation": "forecast_mw"})

    keep = ["start_time", "publish_time", "settlementDate", "settlementPeriod", "forecast_mw"]
    available = [c for c in keep if c in df.columns]
    df = df[available].copy()

    df = df.rename(columns={
        "settlementDate": "settlement_date",
        "settlementPeriod": "settlement_period",
    })

    df["forecast_mw"] = pd.to_numeric(df["forecast_mw"], errors="coerce")
    df = df.dropna(subset=["start_time", "publish_time", "forecast_mw"])
    df = df.sort_values(["start_time", "publish_time"]).reset_index(drop=True)

    logger.info("process_forecasts.done", rows=len(df))
    return df


# ---------------------------------------------------------------------------
# get_day_ahead_forecasts
# ---------------------------------------------------------------------------

def _gate_closure(start_time: pd.Timestamp) -> pd.Timestamp:
    """
    Return the day-ahead gate closure for a given delivery period.

    Gate closure = the day BEFORE startTime at 11:00 UTC.
    """
    delivery_date = start_time.normalize()  # midnight UTC on the delivery day
    gate = delivery_date - timedelta(days=1) + timedelta(hours=11)
    return gate.tz_localize("UTC") if gate.tzinfo is None else gate


def get_day_ahead_forecasts(forecasts_df: pd.DataFrame) -> pd.DataFrame:
    """
    For each startTime, select the LATEST publishTime that is still before
    the day-ahead gate closure (delivery_date - 1 day @ 11:00 UTC).

    Returns one row per startTime — the forecast a day-ahead trader would use.
    """
    if forecasts_df.empty:
        return forecasts_df.copy()

    df = forecasts_df.copy()

    # Compute gate closure for every row's start_time
    df["gate_closure"] = df["start_time"].apply(_gate_closure)

    # Keep only pre-gate-closure forecasts
    pre_gate = df[df["publish_time"] < df["gate_closure"]].copy()

    if pre_gate.empty:
        logger.warning("get_day_ahead_forecasts.no_pre_gate_rows")
        return pd.DataFrame(columns=forecasts_df.columns)

    # For each start_time, pick the forecast with the LATEST publish_time
    idx = pre_gate.groupby("start_time")["publish_time"].idxmax()
    day_ahead = pre_gate.loc[idx].copy()
    day_ahead = day_ahead.drop(columns=["gate_closure"])
    day_ahead = day_ahead.sort_values("start_time").reset_index(drop=True)

    logger.info("get_day_ahead_forecasts.done", rows=len(day_ahead))
    return day_ahead


# ---------------------------------------------------------------------------
# get_vintage_forecasts
# ---------------------------------------------------------------------------

def _vintage_label(hours_before: float) -> str:
    """Map lead-time in hours to a human-readable vintage label."""
    if hours_before > 36:
        return "D-2"
    elif hours_before > 24:
        return "D-1 Evening"
    elif hours_before > 12:
        return "D-1 Morning"
    else:
        return "Intraday"


def get_vintage_forecasts(forecasts_df: pd.DataFrame, target_date: str) -> list[dict]:
    """
    For a specific settlement date, return ALL available forecast vintages.

    Returns a list of dicts, each containing:
      {publishTime: str, publish_label: str, hours_before_delivery: float,
       forecasts: [{start_time: str, forecast_mw: float}]}
    """
    if forecasts_df.empty:
        return []

    # Filter to target date
    mask = forecasts_df["settlement_date"] == target_date
    day_df = forecasts_df[mask].copy()

    if day_df.empty:
        logger.warning("get_vintage_forecasts.no_data", target_date=target_date)
        return []

    # Group by publish_time vintage
    vintages = []
    for pub_time, grp in day_df.groupby("publish_time"):
        # Compute lead time relative to FIRST delivery period in this group
        first_delivery = grp["start_time"].min()
        lead_hours = (first_delivery - pub_time).total_seconds() / 3600.0

        forecasts_list = (
            grp[["start_time", "settlement_period", "forecast_mw"]]
            .sort_values("start_time")
            .assign(start_time=lambda d: d["start_time"].dt.isoformat())
            .to_dict("records")
        )

        vintages.append({
            "publish_time": pub_time.isoformat() if hasattr(pub_time, "isoformat") else str(pub_time),
            "publish_label": _vintage_label(lead_hours),
            "hours_before_delivery": round(lead_hours, 2),
            "forecasts": forecasts_list,
        })

    # Sort by publish_time ascending (oldest first)
    vintages.sort(key=lambda v: v["publish_time"])
    return vintages


# ---------------------------------------------------------------------------
# merge_actuals_forecasts
# ---------------------------------------------------------------------------

def merge_actuals_forecasts(
    actuals_df: pd.DataFrame,
    day_ahead_forecasts_df: pd.DataFrame,
) -> pd.DataFrame:
    """
    Inner join actuals and day-ahead forecasts on start_time.

    Adds columns:
      error_mw   = forecast_mw - actual_mw
      abs_error  = |error_mw|
    """
    if actuals_df.empty or day_ahead_forecasts_df.empty:
        logger.warning("merge_actuals_forecasts.empty_input")
        return pd.DataFrame(columns=[
            "start_time", "settlement_date", "settlement_period",
            "actual_mw", "forecast_mw", "publish_time", "error_mw", "abs_error"
        ])

    merged = pd.merge(
        actuals_df,
        day_ahead_forecasts_df[["start_time", "publish_time", "forecast_mw"]],
        on="start_time",
        how="inner",
    )

    merged["error_mw"] = merged["forecast_mw"] - merged["actual_mw"]
    merged["abs_error"] = merged["error_mw"].abs()
    merged = merged.sort_values("start_time").reset_index(drop=True)

    logger.info("merge_actuals_forecasts.done", rows=len(merged))
    return merged
