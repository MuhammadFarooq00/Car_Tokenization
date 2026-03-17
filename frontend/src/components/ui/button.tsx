import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl',
    'text-sm font-semibold',
    'ring-offset-background transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-[0.98]',
  ].join(' '),
  {
    variants: {
      variant: {
        // Primary - Sky blue with glow effect
        default:
          'bg-primary text-white shadow-md hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/20 focus-visible:ring-primary',

        // Primary with glow animation on hover
        glow:
          'bg-primary text-white shadow-md btn-glow hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/30 focus-visible:ring-primary',

        // Destructive - Red for dangerous actions
        destructive:
          'bg-error text-white shadow-md hover:bg-error-hover hover:shadow-lg hover:shadow-error/20 focus-visible:ring-error',

        // Outline - Bordered button
        outline:
          'border border-border bg-transparent hover:bg-background-hover hover:border-primary/50 text-text-primary focus-visible:ring-primary',

        // Secondary - Subtle background
        secondary:
          'bg-background-elevated text-text-primary border border-border hover:bg-background-hover hover:border-border-hover focus-visible:ring-primary',

        // Ghost - No background until hover
        ghost:
          'text-text-secondary hover:bg-background-hover hover:text-text-primary focus-visible:ring-primary',

        // Link - Looks like a link
        link:
          'text-primary underline-offset-4 hover:underline hover:text-primary-hover focus-visible:ring-primary p-0 h-auto font-medium',

        // Gradient - Primary to accent gradient
        gradient:
          'bg-gradient-to-r from-primary via-primary to-accent text-white shadow-md hover:shadow-lg hover:shadow-primary/25 hover:brightness-110 focus-visible:ring-primary',

        // Accent - Copper/gold luxury feel
        accent:
          'bg-accent text-background shadow-md hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/25 focus-visible:ring-accent font-semibold',

        // Success - Green confirmation
        success:
          'bg-success text-white shadow-md hover:bg-success-hover hover:shadow-lg hover:shadow-success/20 focus-visible:ring-success',

        // Warning - Amber/orange for caution actions
        warning:
          'bg-warning text-white shadow-md hover:bg-warning/90 hover:shadow-lg hover:shadow-warning/20 focus-visible:ring-warning',

        // Error - Red alias for destructive without icon implications
        error:
          'bg-error text-white shadow-md hover:bg-error-hover hover:shadow-lg hover:shadow-error/20 focus-visible:ring-error',

        // Glass - Glassmorphism effect
        glass:
          'glass text-text-primary hover:bg-background-hover/80 focus-visible:ring-primary',

        // Premium - Special gradient with border glow
        premium:
          'relative bg-gradient-to-r from-accent via-accent-light to-accent text-background font-bold shadow-lg hover:shadow-xl hover:shadow-accent/30 focus-visible:ring-accent overflow-hidden',
      },
      size: {
        default: 'h-11 px-5 py-2.5',
        sm: 'h-9 px-4 text-xs rounded-lg',
        lg: 'h-12 px-8 text-base rounded-xl',
        xl: 'h-14 px-10 text-base rounded-2xl',
        icon: 'h-10 w-10 rounded-lg',
        'icon-sm': 'h-8 w-8 rounded-lg',
        'icon-lg': 'h-12 w-12 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

// Icon-only button variant
export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    Omit<VariantProps<typeof buttonVariants>, 'size'> {
  icon: React.ReactNode;
  size?: 'sm' | 'default' | 'lg';
  isLoading?: boolean;
  'aria-label': string;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = 'ghost', size = 'default', icon, isLoading = false, disabled, ...props }, ref) => {
    const sizeMap = {
      sm: 'icon-sm',
      default: 'icon',
      lg: 'icon-lg',
    } as const;

    return (
      <button
        className={cn(buttonVariants({ variant, size: sizeMap[size], className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

export { Button, IconButton, buttonVariants };
