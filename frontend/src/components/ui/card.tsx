import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  'rounded-xl transition-all duration-300',
  {
    variants: {
      variant: {
        // Default - Subtle surface with border
        default: 'bg-surface border border-border',

        // Elevated - Floating appearance with shadow
        elevated: 'bg-surface-elevated border border-border shadow-card',

        // Ghost - Minimal, no background
        ghost: 'bg-transparent',

        // Bordered - Strong border emphasis
        bordered: 'bg-surface border-2 border-border',

        // Glass - Glassmorphism effect
        glass: 'glass',

        // Gradient - Gradient border effect
        gradient: 'gradient-border',

        // Interactive - For clickable cards
        interactive: 'bg-surface border border-border cursor-pointer',

        // Premium - Special styling for featured items
        premium: 'bg-surface border border-accent/30 shadow-lg shadow-accent/5',
      },
      hover: {
        none: '',
        lift: 'hover:translate-y-[-4px] hover:shadow-card-hover',
        glow: 'hover:border-primary hover:shadow-glow-subtle',
        border: 'hover:border-primary/50',
        scale: 'hover:scale-[1.02]',
      },
      padding: {
        none: '',
        sm: 'p-4',
        default: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      hover: 'none',
      padding: 'none',
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, hover, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, hover, padding }), className)}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'font-heading text-lg font-semibold leading-tight tracking-tight text-text-primary',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-text-secondary leading-relaxed', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

// Specialized card for stats/metrics
const StatCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
  }
>(({ className, label, value, icon, trend, trendValue, ...props }, ref) => (
  <Card
    ref={ref}
    variant="elevated"
    className={cn('p-5', className)}
    {...props}
  >
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <p className="text-sm font-medium text-text-muted">{label}</p>
        <p className="text-2xl font-bold font-heading text-text-primary">{value}</p>
        {trend && trendValue && (
          <p
            className={cn('text-xs font-medium flex items-center gap-1', {
              'text-success': trend === 'up',
              'text-error': trend === 'down',
              'text-text-muted': trend === 'neutral',
            })}
          >
            {trend === 'up' && '↑'}
            {trend === 'down' && '↓'}
            {trendValue}
          </p>
        )}
      </div>
      {icon && (
        <div className="p-2.5 rounded-xl bg-primary-muted text-primary">
          {icon}
        </div>
      )}
    </div>
  </Card>
));
StatCard.displayName = 'StatCard';

// Feature card with icon badge
const FeatureCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    icon: React.ReactNode;
    title: string;
    description: string;
    iconVariant?: 'primary' | 'accent';
  }
>(({ className, icon, title, description, iconVariant = 'primary', ...props }, ref) => (
  <Card
    ref={ref}
    variant="default"
    hover="glow"
    className={cn('p-6', className)}
    {...props}
  >
    <div
      className={cn(
        'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
        iconVariant === 'primary' ? 'bg-primary-muted text-primary' : 'bg-accent-muted text-accent'
      )}
    >
      {icon}
    </div>
    <h3 className="font-heading font-semibold text-text-primary mb-2">{title}</h3>
    <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
  </Card>
));
FeatureCard.displayName = 'FeatureCard';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  StatCard,
  FeatureCard,
  cardVariants,
};
