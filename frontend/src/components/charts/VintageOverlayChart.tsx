import React, { useMemo } from 'react';
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
  // Deduplicate: Pick the best/latest representative run for each operational category
  // Categories: 'D-2', 'D-1 Evening', 'D-1 Morning', 'Intraday'
  const representativeVintages = useMemo(() => {
    const categoryMap = new Map<string, VintageForecastGroup>();
    
    // Sort ascending by publish_time so later runs overwrite earlier ones within the same category
    const sorted = [...vintages].sort((a, b) => 
      new Date(a.publish_time).getTime() - new Date(b.publish_time).getTime()
    );

    sorted.forEach((v) => {
      categoryMap.set(v.publish_label, v);
    });

    // Ensure preferred visual order: D-2 first, then D-1 Evening, then D-1 Morning (Gate Decision), then Intraday
    const order = ['D-2', 'D-1 Evening', 'D-1 Morning', 'Intraday'];
    return order
      .map((cat) => categoryMap.get(cat))
      .filter((v): v is VintageForecastGroup => v !== undefined);
  }, [vintages]);

  // Aggregate into 48 half-hour settlement periods
  const chartData = useMemo(() => {
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

    // Populate the 4 distinct representative vintages
    representativeVintages.forEach((v) => {
      const key = v.publish_label;
      v.forecasts.forEach((f) => {
        const entry = periodMap.get(f.settlement_period);
        if (entry) {
          entry[key] = f.forecast_mw;
        }
      });
    });

    return Array.from(periodMap.values());
  }, [actuals, representativeVintages]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl border border-border bg-surface shadow-2xl p-3.5 text-xs min-w-[240px]">
        <p className="font-semibold text-text-primary mb-2 border-b border-border pb-1.5 flex justify-between">
          <span>Settlement Time: {label} UTC</span>
        </p>
        <div className="space-y-2">
          {payload.map((item: any) => (
            <div key={item.name} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2" style={{ color: item.color }}>
                <span
                  className="h-2 w-2 rounded-full inline-block shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium">{item.name}</span>
              </span>
              <span className="font-mono font-semibold text-text-primary">
                {formatMW(item.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-[380px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 15, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis 
            dataKey="timeLabel" 
            stroke={CHART_COLORS.axis} 
            tick={{ fontSize: 11 }}
            interval={3} // Show tick every 2 hours for clean readability
          />
          <YAxis
            stroke={CHART_COLORS.axis}
            tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
            tick={{ fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="top" 
            height={40} 
            wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }} 
          />

          {/* Actual generation line (Solid thick green) */}
          <Line
            type="monotone"
            dataKey="actual_mw"
            name="Actual Wind Outturn"
            stroke={CHART_COLORS.actual}
            strokeWidth={3}
            dot={false}
          />

          {/* Clean lines for each representative market milestone */}
          {representativeVintages.map((v) => {
            const isDecision = v.publish_label === 'D-1 Morning';
            const color = VINTAGE_COLORS[v.publish_label] || CHART_COLORS.forecast;
            const displayName = isDecision
              ? 'D-1 Morning (Auction Gate Decision)'
              : `Forecast (${v.publish_label})`;

            return (
              <Line
                key={v.publish_label}
                type="monotone"
                dataKey={v.publish_label}
                name={displayName}
                stroke={color}
                strokeWidth={isDecision ? 2.5 : 1.8}
                strokeDasharray={v.publish_label === 'D-2' ? '4 4' : v.publish_label === 'Intraday' ? '2 2' : undefined}
                dot={false}
              />
            );
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
