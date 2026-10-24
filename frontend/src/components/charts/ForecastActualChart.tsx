import React, { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Brush,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { parseISO, format } from 'date-fns';
import type { MergedDataPoint, ConfidenceBands } from '../../types';
import { CHART_COLORS } from '../../constants';
import { formatMW, formatDateTime } from '../../utils/formatters';

interface ForecastActualChartProps {
  data: MergedDataPoint[];
  confidenceBands: ConfidenceBands;
}

interface ChartDataPoint extends MergedDataPoint {
  upper_1sigma: number;
  lower_1sigma: number;
  upper_2sigma: number;
  lower_2sigma: number;
  displayTime: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as ChartDataPoint;
  if (!d) return null;

  return (
    <div className="rounded-xl border border-border bg-surface shadow-xl p-3 text-xs min-w-[200px]">
      <p className="font-semibold text-text-primary mb-2 border-b border-border pb-1.5">
        {formatDateTime(label || d.start_time)}
      </p>
      <div className="space-y-1.5">
        {d.actual_mw != null && (
          <div className="flex justify-between gap-4">
            <span className="flex items-center gap-1.5 text-text-secondary">
              <span className="h-2 w-2 rounded-full bg-wind inline-block" />
              Actual
            </span>
            <span className="font-medium text-wind">{formatMW(d.actual_mw)}</span>
          </div>
        )}
        {d.forecast_mw != null && (
          <div className="flex justify-between gap-4">
            <span className="flex items-center gap-1.5 text-text-secondary">
              <span className="h-2 w-2 rounded-full bg-primary inline-block" />
              Forecast
            </span>
            <span className="font-medium text-primary">{formatMW(d.forecast_mw)}</span>
          </div>
        )}
        {d.error_mw != null && (
          <div className="flex justify-between gap-4 border-t border-border pt-1.5 mt-1.5">
            <span className="text-text-secondary">Error</span>
            <span className={cn('font-medium', d.error_mw >= 0 ? 'text-wind' : 'text-danger')}>
              {d.error_mw >= 0 ? '+' : ''}{formatMW(d.error_mw)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// cn helper inline to avoid circular import
function cn(...args: (string | undefined | false)[]) {
  return args.filter(Boolean).join(' ');
}

// X-axis tick: show label every ~24 settlement periods (12 hours), limit display
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const XAxisTick = ({ x, y, payload }: any) => {
  if (!payload?.value) return null;
  try {
    const d = parseISO(payload.value);
    const label = format(d, 'dd/MM');
    return (
      <text x={x} y={y + 12} fill={CHART_COLORS.axis} fontSize={10} textAnchor="middle">
        {label}
      </text>
    );
  } catch {
    return null;
  }
};

export function ForecastActualChart({ data, confidenceBands }: ForecastActualChartProps) {
  const chartData = useMemo<ChartDataPoint[]>(() => {
    const sigma1 = confidenceBands.sigma_1;
    const sigma2 = confidenceBands.sigma_2;
    return data.map((d) => ({
      ...d,
      upper_1sigma: d.forecast_mw + sigma1,
      lower_1sigma: Math.max(0, d.forecast_mw - sigma1),
      upper_2sigma: d.forecast_mw + sigma2,
      lower_2sigma: Math.max(0, d.forecast_mw - sigma2),
      displayTime: d.start_time,
    }));
  }, [data, confidenceBands]);

  // Only show tick for every 48th point (daily), since data is half-hourly
  const tickInterval = Math.max(1, Math.floor(chartData.length / 31));

  return (
    <ResponsiveContainer width="100%" height={420}>
      <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={CHART_COLORS.grid}
          vertical={false}
        />
        <XAxis
          dataKey="start_time"
          tick={<XAxisTick />}
          interval={tickInterval * 2}
          tickLine={false}
          axisLine={{ stroke: CHART_COLORS.grid }}
        />
        <YAxis
          tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
          tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={40}
          label={{
            value: 'MW',
            angle: -90,
            position: 'insideLeft',
            offset: 5,
            fill: CHART_COLORS.axis,
            fontSize: 11,
          }}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ stroke: CHART_COLORS.axis, strokeWidth: 1, strokeDasharray: '4 4' }}
        />
        <Legend
          wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }}
          formatter={(value) => (
            <span style={{ color: CHART_COLORS.axis }}>{value}</span>
          )}
        />

        {/* 2-sigma band */}
        <Area
          dataKey="upper_2sigma"
          fill="#3b82f6"
          fillOpacity={0.06}
          stroke="none"
          name="±2σ band"
          legendType="none"
          isAnimationActive={false}
        />
        <Area
          dataKey="lower_2sigma"
          fill="#0a0e1a"
          fillOpacity={1}
          stroke="none"
          legendType="none"
          isAnimationActive={false}
        />

        {/* 1-sigma band */}
        <Area
          dataKey="upper_1sigma"
          fill="#3b82f6"
          fillOpacity={0.14}
          stroke="none"
          name="±1σ band"
          legendType="none"
          isAnimationActive={false}
        />
        <Area
          dataKey="lower_1sigma"
          fill="#0a0e1a"
          fillOpacity={1}
          stroke="none"
          legendType="none"
          isAnimationActive={false}
        />

        {/* Forecast line */}
        <Line
          type="monotone"
          dataKey="forecast_mw"
          stroke={CHART_COLORS.forecast}
          strokeWidth={1.5}
          dot={false}
          name="Forecast (D-1 Morning)"
          isAnimationActive={false}
          connectNulls
        />

        {/* Actual line */}
        <Line
          type="monotone"
          dataKey="actual_mw"
          stroke={CHART_COLORS.actual}
          strokeWidth={2}
          dot={false}
          name="Actual Generation"
          isAnimationActive={false}
          connectNulls
        />

        <ReferenceLine y={0} stroke={CHART_COLORS.grid} strokeWidth={1} />

        <Brush
          dataKey="start_time"
          height={28}
          stroke={CHART_COLORS.grid}
          fill="#111827"
          travellerWidth={8}
          tickFormatter={(v: string) => {
            try {
              return format(parseISO(v), 'dd/MM');
            } catch {
              return '';
            }
          }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
