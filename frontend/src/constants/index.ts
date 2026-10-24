export const CHART_COLORS = {
  actual: 'rgb(var(--color-wind))',
  forecast: 'rgb(var(--color-primary))',
  error: 'rgb(var(--color-danger))',
  band1: 'rgb(var(--color-primary) / 0.12)',
  band2: 'rgb(var(--color-primary) / 0.06)',
  grid: 'rgb(var(--color-chart-grid))',
  axis: 'rgb(var(--color-chart-axis))',
  surface: 'rgb(var(--color-surface))',
  d2: 'rgb(var(--color-warning))',
  d1evening: 'rgb(var(--color-purple-forecast))',
  d1morning: 'rgb(var(--color-primary))',
  intraday: 'rgb(var(--color-wind))',
};

export const JAN_2026_DATES = Array.from({ length: 31 }, (_, i) => {
  const d = new Date(2026, 0, i + 1);
  return d.toISOString().split('T')[0];
});

export const VINTAGE_COLORS: Record<string, string> = {
  'D-2': CHART_COLORS.d2,
  'D-1 Evening': CHART_COLORS.d1evening,
  'D-1 Morning': CHART_COLORS.d1morning,
  'Intraday': CHART_COLORS.intraday,
};

export const MAE_THRESHOLDS = {
  low: 400,
  medium: 700,
};

export const MAE_COLORS = {
  low: CHART_COLORS.actual,
  medium: CHART_COLORS.d2,
  high: CHART_COLORS.error,
};

export const UK_AVG_DEMAND_MW = 35000;

export const GATE_CLOSURE_BUCKET = 'D-1 Morning';
