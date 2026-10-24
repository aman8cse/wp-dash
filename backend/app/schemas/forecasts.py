from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ForecastRecord(BaseModel):
    start_time: datetime
    publish_time: datetime
    settlement_date: str
    settlement_period: int
    forecast_mw: float


class DayAheadForecastRecord(BaseModel):
    start_time: datetime
    publish_time: datetime  # which vintage was used
    settlement_date: str
    settlement_period: int
    forecast_mw: float


class VintageForecastGroup(BaseModel):
    publish_time: datetime
    publish_label: str  # e.g. "D-2 Evening", "D-1 Morning"
    hours_before_delivery: float
    forecasts: list[ForecastRecord]


class ForecastsResponse(BaseModel):
    day_ahead: list[DayAheadForecastRecord]
    count: int


class VintageResponse(BaseModel):
    target_date: str
    vintages: list[VintageForecastGroup]
