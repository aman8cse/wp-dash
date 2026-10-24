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
import type { HourlyHeatmapPoint } from '../../types';
import { CHART_COLORS } from '../../constants';
import { formatMW } from '../../utils/formatters';

interface HourlyHeatmapChartProps {
  data: HourlyHeatmapPoint[];
}

export const HourlyHeatmapChart: React.FC<HourlyHeatmapChartProps> = ({ data }) => {
  const maxMae = Math.max(...data.map((d) => d.mae), 1);

  const getColor = (mae: number) => {
    const ratio = mae / maxMae;
    if (ratio > 0.75) return '#ef4444'; // Red (high error)
    if (ratio > 0.5) return '#f59e0b';  // Amber
    if (ratio > 0.3) return '#3b82f6';  // Blue
    return '#10b981';                   // Green (low error)
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const item = payload[0]?.payload as HourlyHeatmapPoint;
    if (!item) return null;

    const startH = `${String(item.hour).padStart(2, '0')}:00`;
    const endH = `${String((item.hour + 1) % 24).padStart(2, '0')}:00`;

    return (
      <div className="rounded-xl border border-border bg-surface shadow-xl p-3 text-xs min-w-[180px]">
        <p className="font-semibold text-text-primary mb-1">
          Settlement Hour {startH} - {endH} UTC
        </p>
        <div className="flex justify-between gap-4 border-t border-border pt-1">
          <span className="text-text-secondary">Average MAE:</span>
          <span className="font-bold text-text-primary">{formatMW(item.mae)}</span>
        </div>
        <div className="flex justify-between gap-4 pt-1">
          <span className="text-text-secondary">Observed Points:</span>
          <span className="text-text-secondary">{item.count}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis
            dataKey="hour"
            stroke={CHART_COLORS.axis}
            tickFormatter={(h) => `${h}h`}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            stroke={CHART_COLORS.axis}
            tickFormatter={(v) => `${Math.round(v)} MW`}
            tick={{ fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="mae" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.mae)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
