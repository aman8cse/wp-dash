import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { VintageAccuracyPoint } from '../../types';
import { CHART_COLORS, VINTAGE_COLORS } from '../../constants';
import { formatMW } from '../../utils/formatters';

interface VintageAccuracyChartProps {
  data: VintageAccuracyPoint[];
}

export const VintageAccuracyChart: React.FC<VintageAccuracyChartProps> = ({ data }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const item = payload[0]?.payload as VintageAccuracyPoint;
    if (!item) return null;

    return (
      <div className="rounded-xl border border-border bg-surface shadow-xl p-3 text-xs min-w-[200px]">
        <p className="font-semibold text-text-primary mb-1">{item.publish_bucket}</p>
        <p className="text-text-secondary text-[11px] mb-2">
          Published ~{item.hours_before_delivery}h before gate closure
        </p>
        <div className="flex justify-between gap-4 border-t border-border pt-1">
          <span className="text-text-secondary">Mean Absolute Error:</span>
          <span className="font-bold text-text-primary">{formatMW(item.mae)}</span>
        </div>
        <div className="flex justify-between gap-4 pt-1">
          <span className="text-text-secondary">Forecast Samples:</span>
          <span className="text-text-secondary">{item.count}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis dataKey="publish_bucket" stroke={CHART_COLORS.axis} tick={{ fontSize: 11 }} />
          <YAxis
            stroke={CHART_COLORS.axis}
            tickFormatter={(v) => `${Math.round(v)} MW`}
            tick={{ fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="mae" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={VINTAGE_COLORS[entry.publish_bucket] || CHART_COLORS.forecast}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
