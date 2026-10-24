import { format, parseISO, isValid } from 'date-fns';

export const formatMW = (mw: number): string =>
  `${Math.round(mw).toLocaleString('en-GB')} MW`;

export const formatMAE = (mw: number): string =>
  `Â±${Math.round(mw).toLocaleString('en-GB')} MW`;

export const formatMAPE = (pct: number): string => `${pct.toFixed(1)}%`;

export const formatSkillScore = (score: number): string =>
  `${(score * 100).toFixed(1)}%`;

export const formatBias = (mw: number): string => {
  const rounded = Math.round(mw);
  const sign = rounded >= 0 ? '+' : '';
  return `${sign}${rounded.toLocaleString('en-GB')} MW`;
};

export const formatDate = (iso: string): string => {
  try {
    const parsed = parseISO(iso);
    if (!isValid(parsed)) return iso;
    return format(parsed, 'd MMM yyyy');
  } catch {
    return iso;
  }
};

export const formatDateTime = (iso: string): string => {
  try {
    const parsed = parseISO(iso);
    if (!isValid(parsed)) return iso;
    return format(parsed, 'd MMM yyyy HH:mm');
  } catch {
    return iso;
  }
};

export const formatShortDate = (iso: string): string => {
  try {
    const parsed = parseISO(iso);
    if (!isValid(parsed)) return iso;
    return format(parsed, 'dd/MM');
  } catch {
    return iso;
  }
};

export const formatTime = (iso: string): string => {
  try {
    const parsed = parseISO(iso);
    if (!isValid(parsed)) return iso;
    return format(parsed, 'HH:mm');
  } catch {
    return iso;
  }
};

export const formatNumber = (n: number, decimals = 0): string =>
  n.toLocaleString('en-GB', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
