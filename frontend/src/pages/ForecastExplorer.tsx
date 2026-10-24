import React, { useState } from 'react';
import { Calendar, Compass, Clock, CheckCircle, Info } from 'lucide-react';
import { useVintageForecasts } from '../hooks/useForecasts';
import { useActuals } from '../hooks/useActuals';
import { VintageOverlayChart } from '../components/charts/VintageOverlayChart';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorState } from '../components/ui/ErrorState';
import { CHART_COLORS, JAN_2026_DATES, VINTAGE_COLORS } from '../constants';
import { formatDate } from '../utils/formatters';

export const ForecastExplorer: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>('2026-01-15');

  const {
    data: vintageData,
    isLoading: vintageLoading,
    error: vintageError,
    refetch: refetchVintage,
  } = useVintageForecasts(selectedDate);

  const { data: actualsData, isLoading: actualsLoading } = useActuals();

  // Filter actuals for selected date
  const filteredActuals = React.useMemo(() => {
    if (!actualsData?.data) return [];
    return actualsData.data.filter((a) => a.settlement_date === selectedDate);
  }, [actualsData, selectedDate]);

  const isLoading = vintageLoading || actualsLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-text-primary flex items-center gap-2">
          <Compass className="h-5 w-5 text-primary" />
          Forecast Vintage Explorer
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Inspect how National Grid ESO wind forecasts evolve across multiple publication runs (D-2, D-1 Evening, D-1 Morning, Intraday) approaching gate closure.
        </p>
      </div>

      {/* Date Selector Pills */}
      <div className="rounded-xl border border-border bg-surface p-3 sm:p-4 sm:space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">
          <Calendar className="h-4 w-4 text-primary" />
          Select Delivery Day (January 2026)
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
          {JAN_2026_DATES.map((dateStr) => {
            const dayNum = parseInt(dateStr.split('-')[2], 10);
            const isSelected = dateStr === selectedDate;
            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-primary text-white shadow-sm ring-2 ring-primary/30'
                    : 'bg-background hover:bg-surface-elevated text-text-secondary hover:text-text-primary border border-border'
                }`}
              >
                Jan {dayNum}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chart Card */}
      <div className="rounded-xl border border-border bg-surface p-3 shadow-sm sm:p-5 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
          <div>
            <h3 className="text-base font-semibold text-text-primary">
              Multi-Vintage Overlay for {formatDate(selectedDate)}
            </h3>
            <p className="text-xs text-text-secondary">
              Comparison of successive forecast releases against actual generation across 48 half-hour settlement periods.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-wind inline-block" /> Actual
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-primary inline-block" /> D-1 Morning (Gate Decision)
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-warning inline-block" /> D-2
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="h-72 flex items-center justify-center">
            <LoadingSpinner size="md" message={`Loading vintages for ${selectedDate}...`} />
          </div>
        ) : vintageError ? (
          <ErrorState
            title="Error Loading Vintages"
            message="Could not load forecast vintages for the selected settlement date."
            onRetry={refetchVintage}
          />
        ) : vintageData?.vintages && vintageData.vintages.length > 0 ? (
          <VintageOverlayChart
            vintages={vintageData.vintages}
            actuals={filteredActuals}
            targetDate={selectedDate}
          />
        ) : (
          <div className="h-64 flex items-center justify-center text-text-secondary text-sm">
            No forecast vintages recorded for {selectedDate}.
          </div>
        )}
      </div>

      {/* Strategic Value Insight Card */}
      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs sm:gap-4 sm:p-4">
        <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
          <Info className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h4 className="font-semibold text-text-primary">
            Market Takeaway: Timing Day-Ahead Bids
          </h4>
          <p className="text-text-secondary leading-relaxed">
            In the UK wholesale power market, the N2EX day-ahead auction gates close at 11:00 UTC (D-1).
            National Grid ESO publishes updated WINDFOR runs throughout the morning (typically around 08:30 UTC).
            Transitioning procurement calculations from D-2 to the latest D-1 Morning run eliminates an average of
            20% to 35% of forecast uncertainty, significantly reducing imbalance risk charges during settlement.
          </p>
        </div>
      </div>

      {/* Vintages Breakdown Table */}
      {vintageData?.vintages && vintageData.vintages.length > 0 && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
          <div className="flex flex-col gap-1 border-b border-border bg-surface-elevated p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Available Forecast Runs for {selectedDate}
            </h4>
            <span className="text-xs text-text-secondary">
              {vintageData.vintages.length} publication vintages
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="bg-background text-text-secondary uppercase tracking-wider text-[11px] border-b border-border">
                <tr>
                  <th className="py-3 px-4">Vintage Classification</th>
                  <th className="py-3 px-4">Publication Timestamp</th>
                  <th className="py-3 px-4">Lead Time Before Delivery</th>
                  <th className="py-3 px-4">Periods Covered</th>
                  <th className="py-3 px-4">Role in Day-Ahead Market</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {vintageData.vintages.map((v) => {
                  const isDecision = v.publish_label.includes('D-1 Morning') || v.publish_label.includes('Day-Ahead');
                  const color = VINTAGE_COLORS[v.publish_label] || CHART_COLORS.axis;

                  return (
                    <tr
                      key={v.publish_time}
                      className={isDecision ? 'bg-primary/5 font-medium' : 'hover:bg-surface-elevated'}
                    >
                      <td className="py-3 px-4 flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="font-medium text-text-primary">{v.publish_label}</span>
                        {isDecision && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-wind/10 text-wind border border-wind/20">
                            <CheckCircle className="h-3 w-3" /> Gate Closure Baseline
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-text-secondary">
                        {v.publish_time.replace('T', ' ').substring(0, 19)} UTC
                      </td>
                      <td className="py-3 px-4 text-text-secondary">
                        ~{Math.round(v.hours_before_delivery)} hours
                      </td>
                      <td className="py-3 px-4 text-text-secondary">
                        {v.forecasts.length} half-hours
                      </td>
                      <td className="py-3 px-4 text-text-secondary">
                        {isDecision
                          ? 'Primary input for day-ahead auction bid submissions (11:00 UTC)'
                          : v.publish_label === 'D-2'
                          ? 'Early thermal generator scheduling & indicative commitment'
                          : 'Intraday fine-tuning & Balancing Mechanism repositioning'}
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
