import { Skeleton } from '@/components/ui/skeleton';

export function CarCardSkeleton() {
  return (
    <div className="h-full overflow-hidden rounded-2xl border border-border bg-surface">
      {/* Image placeholder */}
      <div className="relative aspect-[16/10] bg-background-elevated">
        <Skeleton className="absolute inset-0" />

        {/* Badge placeholder */}
        <div className="absolute top-4 left-4">
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title & Description */}
        <div className="mb-4">
          <Skeleton className="h-6 w-3/4 mb-2 rounded-lg" />
          <Skeleton className="h-4 w-full mb-1 rounded-lg" />
          <Skeleton className="h-4 w-2/3 rounded-lg" />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-background-elevated/50 border border-border/50">
            <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
            <div className="flex-1 min-w-0">
              <Skeleton className="h-3 w-16 mb-1.5 rounded" />
              <Skeleton className="h-4 w-20 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-background-elevated/50 border border-border/50">
            <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
            <div className="flex-1 min-w-0">
              <Skeleton className="h-3 w-14 mb-1.5 rounded" />
              <Skeleton className="h-4 w-16 rounded" />
            </div>
          </div>
        </div>

        {/* Progress section */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}
