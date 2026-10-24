import React from 'react';
import { Wind, Gauge, Target, Compass, Zap } from 'lucide-react';
import { useAnalytics, useMergedAnalytics } from '../hooks/useAnalytics';
import { useLatestForecast } from '../hooks/useForecasts';
import { MetricCard } from '../components/ui/MetricCard';
import { ProcurementBufferCard } from '../components/cards/ProcurementBufferCard';
import { ForecastActualChart } from '../components/charts/ForecastActualChart';
import { ProcurementGapChart } from '../components/charts/ProcurementGapChart';
import { VintageAccuracyChart } from '../components/charts/VintageAccuracyChart';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorState } from '../components/ui/ErrorState';
import { formatMW, formatMAPE } from '../utils/formatters';

export const Dashboard: React.FC = () => {
  const {
    data: analytics,
    isLoading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics,
  } = useAnalytics();

  const {
    data: merged,
    isLoading: mergedLoading,
    error: mergedError,
    refetch: refetchMerged,
  } = useMergedAnalytics();

  const { data: latestForecast, isLoading: latestLoading } = useLatestForecast();

  const isLoading = analyticsLoading || mergedLoading;
  const isError = !!analyticsError || !!mergedError;

  if (isLoading && !analytics && !merged) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" message="Loading January 2026 Elexon BMRS Market Data..." />
      </div>
    );
  }

  if (isError && !analytics && !merged) {
    return (
      <div className="py-12">
        <ErrorState
          title="Failed to Load Market Data"
          message="Could not connect to backend API to retrieve BMRS wind analytics."
          onRetry={() => {
            refetchAnalytics();
            refetchMerged();
          }}
        />
      </div>
    );
  }

  const summary = analytics?.summary;
  const latestMw = latestForecast?.data?.[0]?.forecast_mw ?? 0;

  return (
    <div className="space-y-6">
      {/* Top Banner / Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary">
            Day-Ahead Wind Procurement Overview
          </h2>
          <p className="text-sm text-text-secondary">
            Evaluation of National Grid ESO wind forecasts vs outturn across 1,488 half-hour settlement periods (Jan 2026).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-wind/10 text-wind border border-wind/20">
            <span className="h-2 w-2 rounded-full bg-wind animate-pulse" />
            Active Market Month: Jan 2026
          </span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Latest Forecast"
          value={latestMw}
          displayValue={formatMW(latestMw)}
          subtitle="Real-time BMRS snapshot"
          icon={<Wind className="h-4 w-4 text-primary" />}
          color="blue"
          isLoading={latestLoading}
        />
        <MetricCard
          title="Month MAE"
          value={summary?.mae ?? 0}
          displayValue={summary ? `±${Math.round(summary.mae).toLocaleString()} MW` : '—'}
          subtitle="Mean Absolute Error"
          icon={<Target className="h-4 w-4 text-wind" />}
          color="green"
          isLoading={analyticsLoading}
        />
        <MetricCard
          title="MAPE"
          value={summary?.mape ?? 0}
          displayValue={summary ? formatMAPE(summary.mape) : '—'}
          subtitle="Relative forecast deviation"
          icon={<Gauge className="h-4 w-4 text-primary" />}
          color="blue"
          isLoading={analyticsLoading}
        />
        <MetricCard
          title="Forecast Bias"
          value={summary?.bias ?? 0}
          displayValue={summary ? `${summary.bias > 0 ? '+' : ''}${Math.round(summary.bias)} MW` : '—'}
          subtitle={summary && summary.bias > 0 ? 'Over-predicting' : 'Under-predicting'}
          icon={<Compass className="h-4 w-4 text-warning" />}
          color="amber"
          isLoading={analyticsLoading}
        />
        <MetricCard
          title="P90 Risk Buffer"
          value={summary?.procurement_buffer_mw ?? 0}
          displayValue={summary ? `+${Math.round(summary.procurement_buffer_mw).toLocaleString()} MW` : '—'}
          subtitle="Tail risk procurement buffer"
          icon={<Zap className="h-4 w-4 text-warning" />}
          color="amber"
          isLoading={analyticsLoading}
        />
      </div>

      {/* Decision-Support Recommendation Banner */}
      {summary && (
        <ProcurementBufferCard
          bufferMw={summary.procurement_buffer_mw}
          p90Error={summary.p90_error}
          isLoading={analyticsLoading}
        />
      )}

      {/* Main Time-Series Forecast vs Actual Chart */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
          <div>
            <h3 className="text-base font-semibold text-text-primary">
              National Wind Generation: Outturn vs Day-Ahead Forecast
            </h3>
            <p className="text-xs text-text-secondary">
              Includes ±1s (68%) and ±2s (95%) historical error confidence intervals. Drag slider below to zoom.
            </p>
          </div>
        </div>

        {merged?.data && merged.confidence_bands ? (
          <ForecastActualChart
            data={merged.data}
            confidenceBands={merged.confidence_bands}
          />
        ) : (
          <div className="h-80 flex items-center justify-center text-text-secondary text-sm">
            No forecast time-series data available.
          </div>
        )}
      </div>

      {/* Bottom Grid: Procurement Gap & Vintage Accuracy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Procurement Gap Chart */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm flex flex-col justify-between">
          <div className="border-b border-border pb-3 mb-3">
            <h3 className="text-base font-semibold text-text-primary">
              Wholesale Procurement Gap Analysis
            </h3>
            <p className="text-xs text-text-secondary">
              Remaining thermal/interconnector demand to be purchased at day-ahead gate closure.
            </p>
          </div>
          {merged?.data ? (
            <ProcurementGapChart
              data={merged.data}
              assumedDemandMW={35000}
              procurementBufferMW={summary?.procurement_buffer_mw ?? 0}
            />
          ) : null}
        </div>

        {/* Right: Vintage Accuracy Breakdown */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm flex flex-col justify-between">
          <div className="border-b border-border pb-3 mb-3">
            <h3 className="text-base font-semibold text-text-primary">
              Forecast Accuracy by Lead Time (Vintage)
            </h3>
            <p className="text-xs text-text-secondary">
              Comparing D-2, D-1 Evening, D-1 Morning, and Intraday forecast error.
            </p>
          </div>
          {analytics?.vintage_accuracy ? (
            <VintageAccuracyChart data={analytics.vintage_accuracy} />
          ) : null}
        </div>
      </div>
    </div>
  );
};
