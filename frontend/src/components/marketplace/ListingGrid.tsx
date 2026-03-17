import { useNextListingId } from '@/hooks/contracts/useMarketplace';
import { ListingCard } from './ListingCard';
import { ListingCardSkeleton } from './ListingCardSkeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ShoppingBag } from 'lucide-react';

interface ListingGridProps {
  limit?: number;
  showEmpty?: boolean;
}

export function ListingGrid({ limit, showEmpty = true }: ListingGridProps) {
  const { data: nextListingId, isLoading } = useNextListingId();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: limit || 6 }).map((_, i) => (
          <ListingCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const totalListings = nextListingId ? Number(nextListingId) - 1 : 0;
  const listingIds = Array.from(
    { length: Math.min(totalListings, limit || totalListings) },
    (_, i) => BigInt(totalListings - i)
  );

  if (listingIds.length === 0 && showEmpty) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="No listings available"
        description="Check back later or create your own listing"
        actionLabel="View Cars"
        actionHref="/discover"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {listingIds.map((listingId) => (
        <ListingCard key={listingId.toString()} listingId={listingId} />
      ))}
    </div>
  );
}
