import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-brand-100 text-brand-800 hover:bg-brand-200',
        secondary:
          'border-transparent bg-slate-100 text-slate-800 hover:bg-slate-200',
        destructive:
          'border-transparent bg-red-100 text-red-800 hover:bg-red-200',
        outline:
          'text-slate-950 border-slate-300',
        success:
          'border-transparent bg-green-100 text-green-800 hover:bg-green-200',
        warning:
          'border-transparent bg-amber-100 text-amber-800 hover:bg-amber-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

// Priority badge with specific colors for JIRA priorities
interface PriorityBadgeProps extends Omit<BadgeProps, 'variant'> {
  priority: 'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest' | string;
}

function PriorityBadge({ priority, className, ...props }: PriorityBadgeProps) {
  const priorityStyles: Record<string, string> = {
    Highest: 'bg-red-100 text-red-800 border-red-200',
    High: 'bg-orange-100 text-orange-800 border-orange-200',
    Medium: 'bg-amber-100 text-amber-800 border-amber-200',
    Low: 'bg-blue-100 text-blue-800 border-blue-200',
    Lowest: 'bg-slate-100 text-slate-800 border-slate-200',
  };

  const style = priorityStyles[priority] || priorityStyles.Medium;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        style,
        className
      )}
      {...props}
    >
      {priority}
    </span>
  );
}

// Status badge for generation steps
interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: 'idle' | 'loading' | 'success' | 'error' | 'warning';
}

function StatusBadge({ status, className, children, ...props }: StatusBadgeProps) {
  const statusVariants: Record<string, string> = {
    idle: 'bg-slate-100 text-slate-600',
    loading: 'bg-brand-100 text-brand-700',
    success: 'bg-green-100 text-green-700',
    error: 'bg-red-100 text-red-700',
    warning: 'bg-amber-100 text-amber-700',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        statusVariants[status],
        className
      )}
      {...props}
    >
      {status === 'loading' && (
        <svg
          className="mr-1.5 h-3 w-3 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </span>
  );
}

export { Badge, badgeVariants, PriorityBadge, StatusBadge };
