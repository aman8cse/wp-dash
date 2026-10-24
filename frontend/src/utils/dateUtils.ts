import { parseISO, format, isValid } from 'date-fns';

/**
 * UK electricity settlement periods are 30-minute intervals.
 * Period 1 starts at 00:00, period 48 ends at 23:30.
 */
export const SETTLEMENT_PERIOD_DURATION_MINS = 30;

/**
 * Convert a settlement period number (1-48) to a time string "HH:mm"
 */
export function settlementPeriodToTime(period: number): string {
  const totalMinutes = (period - 1) * SETTLEMENT_PERIOD_DURATION_MINS;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Convert a time string "HH:mm" to a settlement period number (1-48)
 */
export function timeToSettlementPeriod(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;
  return Math.floor(totalMinutes / SETTLEMENT_PERIOD_DURATION_MINS) + 1;
}

/**
 * Get a human-readable label for a settlement period
 */
export function getPeriodLabel(period: number): string {
  const start = settlementPeriodToTime(period);
  const endMinutes = period * SETTLEMENT_PERIOD_DURATION_MINS;
  const endHours = Math.floor(endMinutes / 60) % 24;
  const endMins = endMinutes % 60;
  const end = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
  return `${start}â€“${end}`;
}

/**
 * Parse an ISO datetime string and return a Date, or null if invalid
 */
export function parseISOSafe(iso: string): Date | null {
  try {
    const d = parseISO(iso);
    return isValid(d) ? d : null;
  } catch {
    return null;
  }
}

/**
 * Format an ISO date string to a settlement date label (e.g. "15 Jan")
 */
export function toSettlementDateLabel(iso: string): string {
  const d = parseISOSafe(iso);
  if (!d) return iso;
  return format(d, 'd MMM');
}

/**
 * Returns an array of all 31 dates in January 2026 as ISO strings
 */
export function getJan2026Dates(): string[] {
  return Array.from({ length: 31 }, (_, i) => {
    const d = new Date(2026, 0, i + 1);
    return d.toISOString().split('T')[0];
  });
}

/**
 * Converts a date string "YYYY-MM-DD" to a display label like "Jan 15"
 */
export function toDateDisplayLabel(dateStr: string): string {
  const d = parseISOSafe(dateStr);
  if (!d) return dateStr;
  return format(d, 'MMM d');
}

/**
 * Get an axis-friendly tick formatter for time series charts
 * Shows date label every N ticks
 */
export function makeAxisTickFormatter(everyN = 3) {
  let callCount = 0;
  return (value: string): string => {
    callCount++;
    if (callCount % everyN !== 1) return '';
    const d = parseISOSafe(value);
    if (!d) return '';
    return format(d, 'dd/MM');
  };
}
