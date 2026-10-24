import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { CHART_COLORS } from '../../constants';

interface ErrorDistributionChartProps {
  data: Array<{ bin_center: number; count: number }>;
}

export const ErrorDistributionChart: React.FC<ErrorDistributionChartProps> = ({ data }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const item = payload[0]?.payload;
    if (!item) return null;

    const errorVal = Math.round(item.bin_center);
    const desc = errorVal < 0 ? 'Under-forecast (Procured Deficit)' : 'Over-forecast (Procured Surplus)';

    return (
      <div className="rounded-xl border border-border bg-surface shadow-xl p-3 text-xs min-w-[200px]">
        <p className="font-semibold text-text-primary mb-1">
          Error Center: {errorVal > 0 ? `+${errorVal}` : errorVal} MW
        </p>
        <p className="text-text-secondary text-[11px] mb-2">{desc}</p>
        <div className="flex justify-between gap-4 border-t border-border pt-1">
          <span className="text-text-secondary">Frequency Count:</span>
          <span className="font-bold text-text-primary">{item.count} half-hours</span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis
            dataKey="bin_center"
            stroke={CHART_COLORS.axis}
            tickFormatter={(v) => `${Math.round(v)} MW`}
            tick={{ fontSize: 11 }}
          />
          <YAxis stroke={CHART_COLORS.axis} tick={{ fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine x={0} stroke={CHART_COLORS.axis} strokeWidth={2} strokeDasharray="2 2" />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.bin_center < 0 ? CHART_COLORS.d2 : CHART_COLORS.forecast}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
