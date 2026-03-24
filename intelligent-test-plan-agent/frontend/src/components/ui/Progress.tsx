import * as React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  showValue?: boolean;
  animated?: boolean;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    { className, value, max = 100, size = 'md', variant = 'default', showValue = false, animated = true, ...props },
    ref
  ) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    const sizeClasses = {
      sm: 'h-1.5',
      md: 'h-2.5',
      lg: 'h-4',
    };

    const variantClasses = {
      default: 'bg-brand-600',
      success: 'bg-green-600',
      warning: 'bg-amber-500',
      error: 'bg-red-600',
    };

    return (
      <div className={cn('w-full', className)} {...props}>
        <div
          ref={ref}
          className={cn(
            'relative w-full overflow-hidden rounded-full bg-slate-200',
            sizeClasses[size]
          )}
        >
          <div
            className={cn(
              'h-full transition-all duration-500 ease-out',
              variantClasses[variant],
              animated && 'transition-all duration-500'
            )}
            style={{ width: `${percentage}%` }}
          >
            {animated && percentage > 0 && percentage < 100 && (
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            )}
          </div>
        </div>
        {showValue && (
          <div className="mt-1 flex justify-between text-xs text-slate-500">
            <span>{Math.round(percentage)}%</span>
            <span>
              {value} / {max}
            </span>
          </div>
        )}
      </div>
    );
  }
);
Progress.displayName = 'Progress';

// Step progress component for generation workflow
interface Step {
  id: string;
  label: string;
  description?: string;
}

interface StepProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: Step[];
  currentStep: number;
  completedSteps?: number[];
}

const StepProgress = React.forwardRef<HTMLDivElement, StepProgressProps>(
  ({ className, steps, currentStep, completedSteps = [], ...props }, ref) => {
    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        <div className="flex items-start justify-between">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(index) || index < currentStep;
            const isCurrent = index === currentStep;
            const isPending = index > currentStep;

            return (
              <div key={step.id} className="flex flex-1 flex-col items-center">
                {/* Connector line */}
                {index > 0 && (
                  <div
                    className={cn(
                      'absolute left-0 top-4 h-0.5 w-full -translate-x-1/2',
                      isCompleted ? 'bg-brand-600' : 'bg-slate-200'
                    )}
                    style={{
                      width: `calc(100% / ${steps.length - 1} - 2rem)`,
                      left: `calc(${(index / (steps.length - 1)) * 100}% - ${50 / (steps.length - 1)}%)`,
                    }}
                  />
                )}

                {/* Step circle */}
                <div
                  className={cn(
                    'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors',
                    isCompleted && 'border-brand-600 bg-brand-600 text-white',
                    isCurrent && 'border-brand-600 bg-white text-brand-600 ring-4 ring-brand-100',
                    isPending && 'border-slate-300 bg-white text-slate-400'
                  )}
                >
                  {isCompleted ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Step label */}
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isCompleted || isCurrent ? 'text-slate-900' : 'text-slate-400'
                    )}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);
StepProgress.displayName = 'StepProgress';

export { Progress, StepProgress };
