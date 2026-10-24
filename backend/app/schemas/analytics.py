from pydantic import BaseModel


class SummaryMetrics(BaseModel):
    mae: float
    rmse: float
    mape: float | None
    bias: float
    p90_error: float
    skill_score: float
    systematic_bias: float
    random_error: float
    procurement_buffer_mw: float  # = p90_error, the recommended safety buffer
    data_points: int


class HourlyHeatmapPoint(BaseModel):
    hour: int
    mae: float
    count: int


class DailyMetric(BaseModel):
    date: str
    mae: float
    bias: float
    rmse: float


class ErrorDistributionBin(BaseModel):
    bin_center: float
    count: int


class ConfidenceBands(BaseModel):
    sigma_1: float
    sigma_2: float
    p10: float
    p90: float


class VintageAccuracyPoint(BaseModel):
    publish_bucket: str
    hours_before_delivery: float
    mae: float
    count: int


class AnalyticsResponse(BaseModel):
    summary: SummaryMetrics
    hourly_heatmap: list[HourlyHeatmapPoint]
    daily_metrics: list[DailyMetric]
    error_distribution: list[ErrorDistributionBin]
    confidence_bands: ConfidenceBands
    vintage_accuracy: list[VintageAccuracyPoint]
    rolling_mae: list[dict]


class MergedDataPoint(BaseModel):
    start_time: str
    settlement_date: str
    settlement_period: int
    actual_mw: float
    forecast_mw: float
    publish_time: str
    error_mw: float
    abs_error: float


class MergedDataResponse(BaseModel):
    data: list[MergedDataPoint]
    confidence_bands: ConfidenceBands
    count: int


class HealthResponse(BaseModel):
    status: str
    version: str
    cache_populated: bool
    last_refresh: str | None
    elexon_reachable: bool
