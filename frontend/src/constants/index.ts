export const CHART_COLORS = {
  actual: '#10b981',       // electric green
  forecast: '#3b82f6',     // electric blue
  error: '#ef4444',        // red
  band1: '#3b82f620',      // blue transparent (1 sigma)
  band2: '#3b82f610',      // blue more transparent (2 sigma)
  grid: '#1f2937',
  axis: '#6b7280',
  d2: '#f59e0b',           // amber for D-2 vintage
  d1evening: '#8b5cf6',   // purple for D-1 evening
  d1morning: '#3b82f6',   // blue for D-1 morning
  intraday: '#10b981',    // green for intraday
};

export const JAN_2026_DATES = Array.from({ length: 31 }, (_, i) => {
  const d = new Date(2026, 0, i + 1);
  return d.toISOString().split('T')[0];
});

export const VINTAGE_COLORS: Record<string, string> = {
  'D-2': '#f59e0b',
  'D-1 Evening': '#8b5cf6',
  'D-1 Morning': '#3b82f6',
  'Intraday': '#10b981',
};

export const MAE_THRESHOLDS = {
  low: 400,
  medium: 700,
};

export const MAE_COLORS = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
};

export const UK_AVG_DEMAND_MW = 35000;

export const GATE_CLOSURE_BUCKET = 'D-1 Morning';
