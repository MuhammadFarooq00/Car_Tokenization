import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full font-medium transition-all duration-200',
  {
    variants: {
      variant: {
        // Default - Primary blue
        default: 'bg-primary-muted text-primary border border-primary/20',

        // Secondary - Subtle gray
        secondary: 'bg-background-elevated text-text-secondary border border-border',

        // Outline - Border only
        outline: 'border border-border text-text-primary hover:border-primary hover:text-primary',

        // Success - Green
        success: 'bg-success-muted text-success border border-success/20',

        // Warning - Amber
        warning: 'bg-warning-muted text-warning border border-warning/20',

        // Error - Red
        error: 'bg-error-muted text-error border border-error/20',

        // Info - Blue
        info: 'bg-info-muted text-info border border-info/20',

        // Accent - Copper/Gold
        accent: 'bg-accent-muted text-accent border border-accent/20',

        // Premium - Gradient glow
        premium: 'bg-gradient-to-r from-primary-muted to-accent-muted text-primary border border-primary/20',

        // Active - Solid primary
        active: 'bg-primary text-white border border-primary',

        // Inactive - Muted
        inactive: 'bg-background-tertiary text-text-muted border border-transparent',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        default: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
  dot?: boolean;
  dotColor?: 'primary' | 'success' | 'warning' | 'error' | 'accent';
}

function Badge({
  className,
  variant,
  size,
  icon,
  dot,
  dotColor = 'primary',
  children,
  ...props
}: BadgeProps) {
  const dotColorMap = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
    accent: 'bg-accent',
  };

  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse',
            dotColorMap[dotColor]
          )}
        />
      )}
      {icon && <span className="mr-1 -ml-0.5">{icon}</span>}
      {children}
    </div>
  );
}

// Status badge with predefined states
export interface StatusBadgeProps extends Omit<BadgeProps, 'variant' | 'dot' | 'dotColor'> {
  status: 'active' | 'pending' | 'completed' | 'cancelled' | 'error' | 'inactive';
}

const statusConfig = {
  active: { variant: 'success' as const, dot: true, dotColor: 'success' as const, label: 'Active' },
  pending: { variant: 'warning' as const, dot: true, dotColor: 'warning' as const, label: 'Pending' },
  completed: { variant: 'success' as const, dot: false, dotColor: 'success' as const, label: 'Completed' },
  cancelled: { variant: 'error' as const, dot: false, dotColor: 'error' as const, label: 'Cancelled' },
  error: { variant: 'error' as const, dot: true, dotColor: 'error' as const, label: 'Error' },
  inactive: { variant: 'inactive' as const, dot: false, dotColor: 'primary' as const, label: 'Inactive' },
};

function StatusBadge({ status, children, ...props }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge
      variant={config.variant}
      dot={config.dot}
      dotColor={config.dotColor}
      {...props}
    >
      {children || config.label}
    </Badge>
  );
}

// Role badge for user types
export interface RoleBadgeProps extends Omit<BadgeProps, 'variant'> {
  role: 'investor' | 'owner' | 'driver' | 'admin';
}

const roleConfig = {
  investor: { variant: 'default' as const, label: 'Investor' },
  owner: { variant: 'accent' as const, label: 'Owner' },
  driver: { variant: 'success' as const, label: 'Driver' },
  admin: { variant: 'premium' as const, label: 'Admin' },
};

function RoleBadge({ role, children, ...props }: RoleBadgeProps) {
  const config = roleConfig[role];
  return (
    <Badge variant={config.variant} {...props}>
      {children || config.label}
    </Badge>
  );
}

export { Badge, StatusBadge, RoleBadge, badgeVariants };
