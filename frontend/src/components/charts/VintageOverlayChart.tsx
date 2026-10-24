import React from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { VintageForecastGroup, ActualRecord } from '../../types';
import { CHART_COLORS, VINTAGE_COLORS } from '../../constants';
import { formatMW } from '../../utils/formatters';

interface VintageOverlayChartProps {
  vintages: VintageForecastGroup[];
  actuals: ActualRecord[];
  targetDate: string;
}

export const VintageOverlayChart: React.FC<VintageOverlayChartProps> = ({
  vintages,
  actuals,
}) => {
  // Aggregate into 48 periods
  const periodMap = new Map<number, any>();
  for (let p = 1; p <= 48; p++) {
    const hour = Math.floor((p - 1) / 2);
    const min = ((p - 1) % 2) * 30;
    const timeLabel = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    periodMap.set(p, { settlement_period: p, timeLabel });
  }

  // Populate actuals
  actuals.forEach((a) => {
    const entry = periodMap.get(a.settlement_period);
    if (entry) {
      entry.actual_mw = a.actual_mw;
    }
  });

  // Populate vintages
  vintages.forEach((v) => {
    const key = v.publish_label;
    v.forecasts.forEach((f) => {
      const entry = periodMap.get(f.settlement_period);
      if (entry) {
        entry[key] = f.forecast_mw;
      }
    });
  });

  const chartData = Array.from(periodMap.values());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl border border-border bg-surface shadow-xl p-3 text-xs min-w-[220px]">
        <p className="font-semibold text-text-primary mb-2 border-b border-border pb-1">
          Settlement Time: {label} UTC
        </p>
        <div className="space-y-1.5">
          {payload.map((item: any) => (
            <div key={item.name} className="flex justify-between gap-4">
              <span className="flex items-center gap-1.5" style={{ color: item.color }}>
                <span
                  className="h-2 w-2 rounded-full inline-block"
                  style={{ backgroundColor: item.color }}
                />
                {item.name}
              </span>
              <span className="font-medium text-text-primary">{formatMW(item.value)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-[360px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis dataKey="timeLabel" stroke={CHART_COLORS.axis} tick={{ fontSize: 11 }} />
          <YAxis
            stroke={CHART_COLORS.axis}
            tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
            tick={{ fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />

          {/* Actual generation line */}
          <Line
            type="monotone"
            dataKey="actual_mw"
            name="Actual Wind Outturn"
            stroke={CHART_COLORS.actual}
            strokeWidth={3}
            dot={false}
          />

          {/* Vintage lines */}
          {vintages.map((v) => {
            const color = VINTAGE_COLORS[v.publish_label] || CHART_COLORS.axis;
            return (
              <Line
                key={v.publish_label}
                type="monotone"
                dataKey={v.publish_label}
                name={`Forecast (${v.publish_label})`}
                stroke={color}
                strokeWidth={2}
                strokeDasharray={v.publish_label === 'D-2' ? '5 5' : undefined}
                dot={false}
              />
            );
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
