import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../../utils/cn';

type Trend = 'up' | 'down' | 'neutral';
type BorderColor = 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'gray';

interface MetricCardProps {
  title: string;
  value: number;
  displayValue?: string;
  unit?: string;
  subtitle?: string;
  trend?: Trend;
  trendLabel?: string;
  icon?: React.ReactNode;
  color?: BorderColor;
  className?: string;
  animateOnMount?: boolean;
  isLoading?: boolean;
}

const borderColorMap: Record<BorderColor, string> = {
  blue: 'border-l-primary',
  green: 'border-l-wind',
  amber: 'border-l-warning',
  red: 'border-l-danger',
  purple: 'border-l-purple-forecast',
  gray: 'border-l-gray-500',
};

const trendIconMap: Record<Trend, React.ReactNode> = {
  up: <TrendingUp className="h-3.5 w-3.5" />,
  down: <TrendingDown className="h-3.5 w-3.5" />,
  neutral: <Minus className="h-3.5 w-3.5" />,
};

const trendColorMap: Record<Trend, string> = {
  up: 'text-wind',
  down: 'text-danger',
  neutral: 'text-text-secondary',
};

function useCountUp(target: number, duration = 1200, enabled = true) {
  const [current, setCurrent] = useState(0);
  const frameRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setCurrent(target);
      return;
    }
    startTimeRef.current = null;
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(target * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration, enabled]);

  return current;
}

export function MetricCard({
  title,
  value,
  displayValue,
  unit,
  subtitle,
  trend,
  trendLabel,
  icon,
  color = 'blue',
  className,
  animateOnMount = true,
  isLoading = false,
}: MetricCardProps) {
  const animatedValue = useCountUp(value, 1200, animateOnMount && !isLoading);

  const formattedAnimated = displayValue
    ? displayValue
    : Math.round(animatedValue).toLocaleString('en-GB');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={cn(
        'relative overflow-hidden rounded-xl border-l-4 border border-border',
        'bg-surface dark:bg-surface',
        'p-5 shadow-lg',
        'transition-shadow hover:shadow-xl hover:shadow-primary/5',
        borderColorMap[color],
        className
      )}
    >
      {/* Background glow */}
      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent" />
      </div>

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-text-secondary mb-2">
            {title}
          </p>

          {isLoading ? (
            <div className="h-8 w-32 rounded-md bg-border animate-pulse" />
          ) : (
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-text-primary dark:text-text-primary tabular-nums">
                {formattedAnimated}
              </span>
              {unit && (
                <span className="text-sm text-text-secondary font-medium">{unit}</span>
              )}
            </div>
          )}

          <div className="mt-2 flex items-center gap-2">
            {trend && !isLoading && (
              <span className={cn('flex items-center gap-1 text-xs font-medium', trendColorMap[trend])}>
                {trendIconMap[trend]}
                {trendLabel}
              </span>
            )}
            {subtitle && (
              <span className="text-xs text-text-muted">{subtitle}</span>
            )}
          </div>
        </div>

        {icon && (
          <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-border/60 text-text-secondary">
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}
