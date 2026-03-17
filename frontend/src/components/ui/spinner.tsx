import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZES = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      className={cn(
        'relative animate-spin',
        SIZES[size],
        className
      )}
    >
      <div className="absolute inset-0 rounded-full border-2 border-border" />
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary" />
    </div>
  );
}

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = 'Loading...' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-border" />
          <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-primary animate-spin" />
          <div className="absolute inset-2 w-12 h-12 rounded-full border-4 border-transparent border-t-accent animate-spin animation-delay-150" style={{ animationDirection: 'reverse' }} />
        </div>
        <p className="text-text-secondary font-medium">{message}</p>
      </div>
    </div>
  );
}

interface PageLoadingProps {
  message?: string;
}

export function PageLoading({ message = 'Loading...' }: PageLoadingProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-border" />
          <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-primary animate-spin" />
          <div className="absolute inset-2 w-12 h-12 rounded-full border-4 border-transparent border-t-accent animate-spin animation-delay-150" style={{ animationDirection: 'reverse' }} />
        </div>
        <p className="text-text-secondary font-medium">{message}</p>
      </div>
    </div>
  );
}

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn('rounded-2xl border border-border bg-surface overflow-hidden', className)}>
      <div className="aspect-[4/3] bg-background-elevated animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-background-elevated rounded animate-pulse" />
        <div className="h-3 bg-background-elevated rounded w-2/3 animate-pulse" />
        <div className="flex gap-2 mt-4">
          <div className="h-8 bg-background-elevated rounded flex-1 animate-pulse" />
          <div className="h-8 bg-background-elevated rounded flex-1 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export function SkeletonTable({ rows = 5, columns = 4 }: SkeletonTableProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-background-elevated rounded flex-1 animate-pulse" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="p-4 border-b border-border last:border-b-0 flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="h-4 bg-background-elevated rounded flex-1 animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  );
}

interface SkeletonStatsGridProps {
  count?: number;
}

export function SkeletonStatsGrid({ count = 4 }: SkeletonStatsGridProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-5 rounded-2xl bg-surface border border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-background-elevated animate-pulse" />
            <div className="h-3 bg-background-elevated rounded w-20 animate-pulse" />
          </div>
          <div className="h-7 bg-background-elevated rounded w-24 animate-pulse mb-2" />
          <div className="h-3 bg-background-elevated rounded w-16 animate-pulse" />
        </div>
      ))}
    </div>
  );
}
