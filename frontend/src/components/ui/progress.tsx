import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  variant?: 'default' | 'gradient' | 'success' | 'warning' | 'error' | 'accent';
  size?: 'sm' | 'default' | 'lg';
  showValue?: boolean;
  animated?: boolean;
}

const sizeClasses = {
  sm: 'h-1.5',
  default: 'h-2.5',
  lg: 'h-4',
};

const variantClasses = {
  default: 'bg-primary',
  gradient: 'bg-gradient-to-r from-primary via-primary-light to-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  accent: 'bg-accent',
};

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, variant = 'default', size = 'default', showValue, animated = true, ...props }, ref) => (
  <div className={cn('relative w-full', showValue && 'pb-5')}>
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        'relative w-full overflow-hidden rounded-full bg-background-elevated',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          'h-full w-full flex-1 rounded-full',
          animated && 'transition-all duration-500 ease-out',
          variantClasses[variant]
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
    {showValue && (
      <span className="absolute right-0 bottom-0 text-xs text-text-muted font-mono">
        {Math.round(value || 0)}%
      </span>
    )}
  </div>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

// Circular progress component
export interface CircularProgressProps {
  value: number;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'gradient' | 'success' | 'accent';
  strokeWidth?: number;
  showValue?: boolean;
  className?: string;
}

const circleSizes = {
  sm: 40,
  default: 64,
  lg: 96,
};

const CircularProgress = React.forwardRef<SVGSVGElement, CircularProgressProps>(
  ({ value, size = 'default', variant = 'default', strokeWidth, showValue = true, className }, ref) => {
    const pixelSize = circleSizes[size];
    const defaultStrokeWidth = size === 'sm' ? 4 : size === 'lg' ? 8 : 6;
    const stroke = strokeWidth ?? defaultStrokeWidth;
    const radius = (pixelSize - stroke) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    const strokeColor = {
      default: 'stroke-primary',
      gradient: 'stroke-primary',
      success: 'stroke-success',
      accent: 'stroke-accent',
    };

    return (
      <div className={cn('relative inline-flex items-center justify-center', className)}>
        <svg
          ref={ref}
          width={pixelSize}
          height={pixelSize}
          viewBox={`0 0 ${pixelSize} ${pixelSize}`}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={pixelSize / 2}
            cy={pixelSize / 2}
            r={radius}
            strokeWidth={stroke}
            className="fill-none stroke-background-elevated"
          />
          {/* Progress circle */}
          <circle
            cx={pixelSize / 2}
            cy={pixelSize / 2}
            r={radius}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={cn(
              'fill-none transition-all duration-500 ease-out',
              strokeColor[variant]
            )}
          />
        </svg>
        {showValue && (
          <span className="absolute text-sm font-semibold font-mono text-text-primary">
            {Math.round(value)}%
          </span>
        )}
      </div>
    );
  }
);
CircularProgress.displayName = 'CircularProgress';

// Step progress for multi-step forms
export interface StepProgressProps {
  steps: number;
  currentStep: number;
  labels?: string[];
  className?: string;
}

const StepProgress = React.forwardRef<HTMLDivElement, StepProgressProps>(
  ({ steps, currentStep, labels, className }, ref) => {
    return (
      <div ref={ref} className={cn('flex items-center w-full', className)}>
        {Array.from({ length: steps }).map((_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isLast = stepNumber === steps;

          return (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300',
                    isCompleted && 'bg-primary text-white',
                    isCurrent && 'bg-primary text-white ring-4 ring-primary/20',
                    !isCompleted && !isCurrent && 'bg-background-elevated text-text-muted border border-border'
                  )}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </div>
                {labels && labels[index] && (
                  <span
                    className={cn(
                      'mt-2 text-xs font-medium',
                      isCurrent ? 'text-primary' : 'text-text-muted'
                    )}
                  >
                    {labels[index]}
                  </span>
                )}
              </div>
              {!isLast && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2 transition-all duration-300',
                    isCompleted ? 'bg-primary' : 'bg-border'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }
);
StepProgress.displayName = 'StepProgress';

export { Progress, CircularProgress, StepProgress };
