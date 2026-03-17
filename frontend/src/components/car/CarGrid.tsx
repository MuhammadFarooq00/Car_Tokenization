import { useNextCarId } from '@/hooks/contracts/useCarShares';
import { CarCard } from './CarCard';
import { CarCardSkeleton } from './CarCardSkeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Car } from 'lucide-react';

interface CarGridProps {
  limit?: number;
  showEmpty?: boolean;
}

export function CarGrid({ limit, showEmpty = true }: CarGridProps) {
  const { data: nextCarId, isLoading } = useNextCarId();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: limit || 6 }).map((_, i) => (
          <CarCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const totalCars = nextCarId ? Number(nextCarId) - 1 : 0;
  const carIds = Array.from({ length: Math.min(totalCars, limit || totalCars) }, (_, i) =>
    BigInt(totalCars - i)
  );

  if (carIds.length === 0 && showEmpty) {
    return (
      <EmptyState
        icon={Car}
        title="No cars available"
        description="Be the first to tokenize a car on the platform"
        actionLabel="Create Car"
        actionHref="/create"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {carIds.map((carId) => (
        <CarCard key={carId.toString()} carId={carId} />
      ))}
    </div>
  );
}
