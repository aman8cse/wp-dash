import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { CHART_COLORS } from '../../constants';
import { formatMW, formatDate } from '../../utils/formatters';

interface RollingMAEChartProps {
  data: Array<{ date: string; rolling_mae: number }>;
  overallMAE?: number;
}

export const RollingMAEChart: React.FC<RollingMAEChartProps> = ({ data, overallMAE }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const item = payload[0]?.payload;
    if (!item) return null;

    return (
      <div className="rounded-xl border border-border bg-surface shadow-xl p-3 text-xs min-w-[180px]">
        <p className="font-semibold text-text-primary mb-1">{formatDate(item.date)}</p>
        <div className="flex justify-between gap-4 border-t border-border pt-1">
          <span className="text-text-secondary">7-Day Rolling MAE:</span>
          <span className="font-bold text-primary">{formatMW(item.rolling_mae)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis
            dataKey="date"
            stroke={CHART_COLORS.axis}
            tickFormatter={(d) => formatDate(d)}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            stroke={CHART_COLORS.axis}
            tickFormatter={(v) => `${Math.round(v)} MW`}
            tick={{ fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          {overallMAE && (
            <ReferenceLine
              y={overallMAE}
              stroke={CHART_COLORS.axis}
              strokeDasharray="4 4"
              label={{
                value: `Month MAE: ${Math.round(overallMAE)} MW`,
                fill: CHART_COLORS.axis,
                fontSize: 10,
                position: 'insideTopRight',
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="rolling_mae"
            name="7-Day Rolling MAE"
            stroke={CHART_COLORS.forecast}
            strokeWidth={2.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
