import React from 'react';
import { Sun, Moon, Wind, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useHealth } from '../../hooks/useHealth';
import { formatDateTime } from '../../utils/formatters';

export const Header: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const { data: health, isLoading } = useHealth();

  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-border bg-surface px-3 py-2 transition-colors sm:px-6">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
          <Wind className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 truncate text-xs font-bold text-text-primary sm:text-base">
            <span className="sm:hidden">UK Wind Procurement</span>
            <span className="hidden sm:inline">UK Wind Power Procurement Terminal</span>
            <span className="hidden shrink-0 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary sm:inline">
              Elexon BMRS
            </span>
          </h1>
          <p className="hidden text-xs text-text-secondary md:block">
            Day-Ahead Wholesale Market Decision Support • Jan 2026 Outturn & Forecasts
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        {/* Data Status Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-background text-xs">
          {isLoading ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-text-secondary" />
          ) : health?.cache_populated ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-wind" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 text-warning" />
          )}
          <span className="text-text-secondary">
            {health?.last_refresh
              ? `Cache: ${formatDateTime(health.last_refresh)}`
              : 'Syncing BMRS...'}
          </span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 rounded-lg border border-border bg-background text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
        >
          {isDark ? <Sun className="h-4 w-4 text-warning" /> : <Moon className="h-4 w-4 text-primary" />}
        </button>
      </div>
    </header>
  );
};
