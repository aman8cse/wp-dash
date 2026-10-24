import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
}

export function ErrorState({
  title = 'Failed to load data',
  message = 'There was a problem fetching data from the server. Please check the backend is running.',
  onRetry,
  className,
  compact = false,
}: ErrorStateProps) {
  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-danger',
          className
        )}
      >
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span className="text-sm">{message}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-auto flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium hover:bg-danger/20 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex h-64 w-full flex-col items-center justify-center gap-4 rounded-xl border border-danger/30 bg-danger/5 p-8 text-center',
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/20">
        <AlertTriangle className="h-7 w-7 text-danger" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-text-primary dark:text-text-primary mb-1">
          {title}
        </h3>
        <p className="text-sm text-text-secondary max-w-sm">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-lg bg-danger/20 border border-danger/30 px-4 py-2 text-sm font-medium text-danger hover:bg-danger/30 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      )}
    </div>
  );
}
