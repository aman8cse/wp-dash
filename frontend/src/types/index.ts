export interface ActualRecord {
  start_time: string;
  settlement_date: string;
  settlement_period: number;
  actual_mw: number;
}

export interface ForecastRecord {
  start_time: string;
  publish_time: string;
  settlement_date: string;
  settlement_period: number;
  forecast_mw: number;
}

export interface MergedDataPoint {
  start_time: string;
  settlement_date: string;
  settlement_period: number;
  actual_mw: number;
  forecast_mw: number;
  publish_time: string;
  error_mw: number;
  abs_error: number;
}

export interface SummaryMetrics {
  mae: number;
  rmse: number;
  mape: number;
  bias: number;
  p90_error: number;
  skill_score: number;
  systematic_bias: number;
  random_error: number;
  procurement_buffer_mw: number;
  data_points: number;
}

export interface ConfidenceBands {
  sigma_1: number;
  sigma_2: number;
  p10: number;
  p90: number;
}

export interface HourlyHeatmapPoint {
  hour: number;
  mae: number;
  count: number;
}

export interface DailyMetric {
  date: string;
  mae: number;
  bias: number;
  rmse: number;
}

export interface VintageAccuracyPoint {
  publish_bucket: string;
  hours_before_delivery: number;
  mae: number;
  count: number;
}

export interface AnalyticsResponse {
  summary: SummaryMetrics;
  hourly_heatmap: HourlyHeatmapPoint[];
  daily_metrics: DailyMetric[];
  error_distribution: Array<{ bin_center: number; count: number }>;
  confidence_bands: ConfidenceBands;
  vintage_accuracy: VintageAccuracyPoint[];
  rolling_mae: Array<{ date: string; rolling_mae: number }>;
}

export interface VintageForecastGroup {
  publish_time: string;
  publish_label: string;
  hours_before_delivery: number;
  forecasts: ForecastRecord[];
}

export interface VintageResponse {
  target_date: string;
  vintages: VintageForecastGroup[];
}

export interface HealthStatus {
  status: string;
  version: string;
  cache_populated: boolean;
  last_refresh: string | null;
  elexon_reachable: boolean;
}

export interface ActualsResponse {
  data: ActualRecord[];
  count: number;
  from_date: string;
  to_date: string;
}

export interface DayAheadForecastsResponse {
  day_ahead: ForecastRecord[];
  count: number;
}

export interface LatestForecastResponse {
  data: ForecastRecord[];
}

export interface MergedAnalyticsResponse {
  data: MergedDataPoint[];
  confidence_bands: ConfidenceBands;
  count: number;
}
