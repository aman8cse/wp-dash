import { cn } from '../../utils/cn';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  message?: string;
  className?: string;
  fullScreen?: boolean;
}

const sizeMap = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-[3px]',
};

export function LoadingSpinner({
  size = 'md',
  text,
  message,
  className,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const displayText = message || text;
  const spinner = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-transparent border-t-primary',
          sizeMap[size]
        )}
        style={{ borderColor: 'transparent', borderTopColor: '#3b82f6' }}
        role="status"
        aria-label="Loading"
      />
      {displayText && (
        <p className="text-sm text-text-secondary animate-pulse">{displayText}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
}
