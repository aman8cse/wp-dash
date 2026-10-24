import { motion } from 'framer-motion';
import { ShieldAlert, Info } from 'lucide-react';
import { formatMW } from '../../utils/formatters';
import { cn } from '../../utils/cn';

interface ProcurementBufferCardProps {
  bufferMw: number;
  p90Error: number;
  isLoading?: boolean;
  className?: string;
}

export function ProcurementBufferCard({
  bufferMw,
  p90Error,
  isLoading = false,
  className,
}: ProcurementBufferCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cn(
        'rounded-xl border border-warning/30 bg-warning/5 p-6 shadow-lg',
        'relative overflow-hidden',
        className
      )}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-warning blur-3xl" />
      </div>

      <div className="relative flex items-start gap-5">
        <div className="shrink-0 flex h-14 w-14 items-center justify-center rounded-xl bg-warning/20 border border-warning/30">
          <ShieldAlert className="h-7 w-7 text-warning" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-warning">
              Procurement Buffer Recommendation
            </h3>
          </div>

          {isLoading ? (
            <div className="h-10 w-48 rounded-md bg-border animate-pulse mb-3" />
          ) : (
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-4xl font-bold text-warning tabular-nums">
                {formatMW(bufferMw)}
              </span>
              <span className="text-sm text-text-secondary">additional buffer</span>
            </div>
          )}

          <p className="text-sm text-text-secondary mb-4 leading-relaxed">
            Based on P90 historical forecast error analysis across January 2026. When buying
            wind power in the day-ahead market, add this buffer to your procurement quantity
            to cover 90% of forecast shortfalls.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-border bg-surface/50 p-3">
              <p className="text-xs text-text-muted mb-1">Formula</p>
              <p className="text-sm font-mono text-text-secondary">
                Procurement = Gap + Buffer
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface/50 p-3">
              <p className="text-xs text-text-muted mb-1">P90 Error Threshold</p>
              <p className="text-sm font-semibold text-text-primary">
                {isLoading ? 'â€¦' : formatMW(p90Error)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface/50 p-3">
              <p className="text-xs text-text-muted mb-1">Data Period</p>
              <p className="text-sm font-semibold text-text-primary">January 2026</p>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-lg border border-border/50 bg-surface/30 px-3 py-2">
            <Info className="h-4 w-4 text-text-muted mt-0.5 shrink-0" />
            <p className="text-xs text-text-muted">
              This buffer covers forecast errors at the P90 confidence level. For higher
              risk tolerance, consider using the P50 level (Â±1Ïƒ). Review daily as conditions change.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
