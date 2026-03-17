import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const textareaVariants = cva(
  'flex w-full rounded-xl border bg-surface text-text-primary ring-offset-background placeholder:text-text-muted focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 resize-none',
  {
    variants: {
      variant: {
        default:
          'border-border hover:border-border-hover focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20',
        error:
          'border-error hover:border-error focus-visible:border-error focus-visible:ring-2 focus-visible:ring-error/20',
        success:
          'border-success hover:border-success focus-visible:border-success focus-visible:ring-2 focus-visible:ring-success/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  error?: boolean;
  showCount?: boolean;
  maxLength?: number;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, error, showCount, maxLength, value, onChange, ...props }, ref) => {
    const [charCount, setCharCount] = React.useState(
      typeof value === 'string' ? value.length : 0
    );

    const finalVariant = error ? 'error' : variant;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      onChange?.(e);
    };

    // Update count when value prop changes
    React.useEffect(() => {
      if (typeof value === 'string') {
        setCharCount(value.length);
      }
    }, [value]);

    if (showCount && maxLength) {
      return (
        <div className="relative">
          <textarea
            className={cn(
              textareaVariants({ variant: finalVariant }),
              'min-h-24 px-4 py-3 text-sm pb-8',
              className
            )}
            ref={ref}
            value={value}
            onChange={handleChange}
            maxLength={maxLength}
            {...props}
          />
          <span
            className={cn(
              'absolute bottom-2 right-3 text-xs',
              charCount >= maxLength ? 'text-error' : 'text-text-muted'
            )}
          >
            {charCount}/{maxLength}
          </span>
        </div>
      );
    }

    return (
      <textarea
        className={cn(
          textareaVariants({ variant: finalVariant }),
          'min-h-24 px-4 py-3 text-sm',
          className
        )}
        ref={ref}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea, textareaVariants };
