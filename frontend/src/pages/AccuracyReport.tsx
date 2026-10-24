import React from 'react';
import {
  LineChart as LineChartIcon,
  Target,
  BarChart2,
  Calendar,
  Layers,
  Award,
} from 'lucide-react';
import { useAnalytics } from '../hooks/useAnalytics';
import { MetricCard } from '../components/ui/MetricCard';
import { ErrorDistributionChart } from '../components/charts/ErrorDistributionChart';
import { RollingMAEChart } from '../components/charts/RollingMAEChart';
import { HourlyHeatmapChart } from '../components/charts/HourlyHeatmapChart';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorState } from '../components/ui/ErrorState';
import { formatMW, formatSkillScore, formatDate } from '../utils/formatters';

export const AccuracyReport: React.FC = () => {
  const { data: analytics, isLoading, error, refetch } = useAnalytics();

  if (isLoading && !analytics) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" message="Computing Forecast Accuracy Metrics..." />
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div className="py-12">
        <ErrorState
          title="Failed to Load Analytics"
          message="Could not compute forecast evaluation metrics from Elexon datasets."
          onRetry={refetch}
        />
      </div>
    );
  }

  const summary = analytics?.summary;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-text-primary flex items-center gap-2">
          <LineChartIcon className="h-5 w-5 text-primary" />
          Quantitative Forecast Accuracy & Risk Report
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Rigorous statistical evaluation of day-ahead wind forecasts across January 2026 to calibrate market procurement buffers.
        </p>
      </div>

      {/* Metrics Row 1: Primary Indicators */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <MetricCard
          title="Mean Absolute Error (MAE)"
          value={summary?.mae ?? 0}
          displayValue={summary ? `±${Math.round(summary.mae).toLocaleString()} MW` : '—'}
          subtitle="Average absolute error volume"
          icon={<Target className="h-4 w-4 text-primary" />}
          color="blue"
        />
        <MetricCard
          title="Root Mean Sq Error (RMSE)"
          value={summary?.rmse ?? 0}
          displayValue={summary ? `${Math.round(summary.rmse).toLocaleString()} MW` : '—'}
          subtitle="Penalizes large forecast spikes"
          icon={<BarChart2 className="h-4 w-4 text-purple-forecast" />}
          color="purple"
        />
        <MetricCard
          title="Skill Score vs Persistence"
          value={summary?.skill_score ?? 0}
          displayValue={summary ? formatSkillScore(summary.skill_score) : '—'}
          subtitle="Skill over naive 24h lag baseline"
          icon={<Award className="h-4 w-4 text-wind" />}
          color="green"
        />
        <MetricCard
          title="P90 Extreme Error"
          value={summary?.p90_error ?? 0}
          displayValue={summary ? `${Math.round(summary.p90_error).toLocaleString()} MW` : '—'}
          subtitle="90th percentile of absolute error"
          icon={<Target className="h-4 w-4 text-warning" />}
          color="amber"
        />
      </div>

      {/* Error Decomposition: Systematic Bias vs Random Error */}
      <div className="rounded-xl border border-border bg-surface p-3 shadow-sm sm:p-5 sm:space-y-4">
        <div className="border-b border-border pb-3">
          <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            Error Decomposition: Systematic Bias vs Random Variance
          </h3>
          <p className="text-xs text-text-secondary">
            Total error is divided into systematic bias (correctable through algorithmic trading offset) and random noise (irreducible).
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-background p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary uppercase tracking-wider font-semibold">
                Systematic Bias Component
              </span>
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                (summary?.systematic_bias ?? 0) > 0 ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'
              }`}>
                {(summary?.systematic_bias ?? 0) > 0 ? 'Over-predicting' : 'Under-predicting'}
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-text-primary">
              {summary ? `${summary.systematic_bias > 0 ? '+' : ''}${Math.round(summary.systematic_bias)} MW` : '—'}
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Consistently present across periods. The trading desk can subtract this offset from the vendor forecast to instantly improve day-ahead position balance.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-background p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary uppercase tracking-wider font-semibold">
                Random Error Variance (1s)
              </span>
              <span className="text-xs px-2 py-0.5 rounded font-medium bg-wind/10 text-wind">
                Stochastic Weather
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-text-primary">
              {summary ? `±${Math.round(summary.random_error)} MW` : '—'}
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Standard deviation of unpredictable meteorologic fluctuation. Must be hedged using intraday flexibility, demand response, or quick-start thermal units.
            </p>
          </div>
        </div>
      </div>

      {/* Row: Error Distribution & 7-Day Rolling Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-surface p-3 shadow-sm sm:p-5 sm:flex sm:flex-col sm:justify-between">
          <div className="border-b border-border pb-3 mb-3">
            <h3 className="text-base font-semibold text-text-primary">
              Forecast Error Distribution
            </h3>
            <p className="text-xs text-text-secondary">
              Histogram of error (Forecast - Actual). Left of 0 indicates deficit (under-forecast), right indicates surplus.
            </p>
          </div>
          {analytics?.error_distribution ? (
            <ErrorDistributionChart data={analytics.error_distribution} />
          ) : null}
        </div>

        <div className="rounded-xl border border-border bg-surface p-3 shadow-sm sm:p-5 sm:flex sm:flex-col sm:justify-between">
          <div className="border-b border-border pb-3 mb-3">
            <h3 className="text-base font-semibold text-text-primary">
              7-Day Rolling MAE Trend
            </h3>
            <p className="text-xs text-text-secondary">
              Identifies how forecast reliability shifted during weather events across January 2026.
            </p>
          </div>
          {analytics?.rolling_mae ? (
            <RollingMAEChart
              data={analytics.rolling_mae}
              overallMAE={summary?.mae}
            />
          ) : null}
        </div>
      </div>

      {/* Diurnal Pattern / Hourly Heatmap */}
      <div className="rounded-xl border border-border bg-surface p-3 shadow-sm sm:p-5 sm:space-y-3">
        <div className="border-b border-border pb-3">
          <h3 className="text-base font-semibold text-text-primary">
            Hourly Error Profile (Diurnal Sensitivity)
          </h3>
          <p className="text-xs text-text-secondary">
            Mean Absolute Error broken down by settlement hour (0 to 23 UTC). Reveals higher volatility during atmospheric transitions.
          </p>
        </div>
        {analytics?.hourly_heatmap ? (
          <HourlyHeatmapChart data={analytics.hourly_heatmap} />
        ) : null}
      </div>

      {/* Daily Breakdown Table */}
      {analytics?.daily_metrics && analytics.daily_metrics.length > 0 && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
          <div className="flex flex-col gap-1 border-b border-border bg-surface-elevated p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Daily Accuracy Breakdown (January 1 - 31, 2026)
            </h4>
            <span className="text-xs text-text-secondary">
              {analytics.daily_metrics.length} market days evaluated
            </span>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="bg-background text-text-secondary uppercase tracking-wider text-[11px] border-b border-border sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-4">Market Date</th>
                  <th className="py-3 px-4">Mean Absolute Error (MAE)</th>
                  <th className="py-3 px-4">Forecast Bias</th>
                  <th className="py-3 px-4">RMSE</th>
                  <th className="py-3 px-4">Trading Assessment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {analytics.daily_metrics.map((d) => {
                  const isHighError = summary ? d.mae > summary.mae * 1.3 : false;
                  const isLowError = summary ? d.mae < summary.mae * 0.7 : false;

                  return (
                    <tr key={d.date} className="hover:bg-surface-elevated">
                      <td className="py-3 px-4 font-mono font-medium text-text-primary">
                        {formatDate(d.date)}
                      </td>
                      <td className="py-3 px-4 font-medium text-text-primary">
                        {formatMW(d.mae)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-mono ${
                            d.bias > 0 ? 'text-primary' : 'text-warning'
                          }`}
                        >
                          {d.bias > 0 ? `+${Math.round(d.bias)}` : Math.round(d.bias)} MW
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-secondary">
                        {formatMW(d.rmse)}
                      </td>
                      <td className="py-3 px-4">
                        {isHighError ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-danger/10 text-danger border border-danger/20">
                            High Volatility Day
                          </span>
                        ) : isLowError ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-wind/10 text-wind border border-wind/20">
                            Stable High Accuracy
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-border text-text-secondary">
                            Normal Profile
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
