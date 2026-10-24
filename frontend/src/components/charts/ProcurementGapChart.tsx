import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { MergedDataPoint } from '../../types';
import { CHART_COLORS } from '../../constants';
import { formatMW, formatDate } from '../../utils/formatters';

interface ProcurementGapChartProps {
  data: MergedDataPoint[];
  assumedDemandMW?: number;
  procurementBufferMW?: number;
}

export const ProcurementGapChart: React.FC<ProcurementGapChartProps> = ({
  data,
  assumedDemandMW = 35000,
  procurementBufferMW = 0,
}) => {
  const chartData = useMemo(() => {
    return data.map((d) => {
      const forecast = Math.max(0, d.forecast_mw || 0);
      const gap = Math.max(0, assumedDemandMW - forecast);
      const recommendedProcurement = gap + procurementBufferMW;
      return {
        ...d,
        demand: assumedDemandMW,
        wind_forecast: forecast,
        procurement_gap: gap,
        recommended_procurement: recommendedProcurement,
        displayDate: formatDate(d.start_time),
      };
    });
  }, [data, assumedDemandMW, procurementBufferMW]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const item = payload[0]?.payload;
    if (!item) return null;

    return (
      <div className="rounded-xl border border-border bg-surface shadow-xl p-3 text-xs min-w-[220px]">
        <p className="font-semibold text-text-primary mb-2 border-b border-border pb-1">
          {item.displayDate} (Period {item.settlement_period})
        </p>
        <div className="space-y-1.5">
          <div className="flex justify-between gap-4">
            <span className="text-text-secondary">Assumed Demand:</span>
            <span className="font-medium text-text-primary">{formatMW(item.demand)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-wind">Wind Forecast:</span>
            <span className="font-medium text-wind">{formatMW(item.wind_forecast)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-warning">Procurement Gap:</span>
            <span className="font-medium text-warning">{formatMW(item.procurement_gap)}</span>
          </div>
          {procurementBufferMW > 0 && (
            <div className="flex justify-between gap-4 pt-1 border-t border-border">
              <span className="text-primary font-medium">With P90 Buffer:</span>
              <span className="font-bold text-primary">{formatMW(item.recommended_procurement)}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-2 flex items-center justify-between text-xs text-text-secondary">
        <span>Assumed System Demand: {formatMW(assumedDemandMW)}</span>
        {procurementBufferMW > 0 && (
          <span className="text-primary font-medium">
            P90 Safety Buffer: +{formatMW(procurementBufferMW)}
          </span>
        )}
      </div>
      <div className="w-full h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="gapGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.d2} stopOpacity={0.8} />
                <stop offset="95%" stopColor={CHART_COLORS.d2} stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="windGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.actual} stopOpacity={0.8} />
                <stop offset="95%" stopColor={CHART_COLORS.actual} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
            <XAxis
              dataKey="displayDate"
              stroke={CHART_COLORS.axis}
              tick={{ fontSize: 11 }}
              interval={Math.floor(chartData.length / 8)}
            />
            <YAxis
              stroke={CHART_COLORS.axis}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
            <ReferenceLine
              y={assumedDemandMW}
              stroke="#9ca3af"
              strokeDasharray="4 4"
              label={{ value: 'Demand Baseline', fill: '#9ca3af', fontSize: 11, position: 'insideTopRight' }}
            />
            <Area
              type="monotone"
              dataKey="wind_forecast"
              name="Forecast Wind (Available)"
              stackId="1"
              stroke={CHART_COLORS.actual}
              fill="url(#windGradient)"
            />
            <Area
              type="monotone"
              dataKey="procurement_gap"
              name="Market Buy Gap (Thermal/Imports)"
              stackId="1"
              stroke={CHART_COLORS.d2}
              fill="url(#gapGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
