import React from 'react';
import { Sun, Moon, Wind, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useHealth } from '../../hooks/useHealth';
import { formatDateTime } from '../../utils/formatters';

export const Header: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const { data: health, isLoading } = useHealth();

  return (
    <header className="h-16 border-b border-border bg-surface px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
          <Wind className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-bold text-text-primary flex items-center gap-2">
            UK Wind Power Procurement Terminal
            <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              Elexon BMRS
            </span>
          </h1>
          <p className="text-xs text-text-secondary">
            Day-Ahead Wholesale Market Decision Support • Jan 2026 Outturn & Forecasts
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Data Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-background text-xs">
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
