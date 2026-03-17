import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { useListing } from '@/hooks/contracts/useMarketplace';
import { useCarConfig } from '@/hooks/contracts/useCarShares';
import { useCarMetadata } from '@/hooks/useCarMetadata';
import { formatEth, formatAddress, getIpfsUrl, formatNumber } from '@/lib/utils';
import { ListingCardSkeleton } from './ListingCardSkeleton';
import { Coins, Package, User, ArrowUpRight, Verified, Clock, Wallet } from 'lucide-react';

interface ListingCardProps {
  listingId: bigint;
}

export function ListingCard({ listingId }: ListingCardProps) {
  const { data: listing, isLoading: listingLoading } = useListing(listingId);
  const { data: config, isLoading: configLoading } = useCarConfig(listing?.carId || 0n);
  const { data: metadata, isLoading: metadataLoading } = useCarMetadata(config?.metadataCID);

  if (listingLoading || configLoading || metadataLoading) {
    return <ListingCardSkeleton />;
  }

  if (!listing || !listing.active) {
    return null;
  }

  const imageUrl = metadata?.image ? getIpfsUrl(metadata.image) : '/placeholder-car.svg';
  const totalValue = listing.amount * listing.pricePerShare;

  // Calculate price comparison to primary sale (mock for now)
  const priceCompare = config ? Number((listing.pricePerShare * 100n) / config.pricePerShare) - 100 : 0;
  const isPriceUp = priceCompare > 0;
  const isPriceDown = priceCompare < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Link to={`/listing/${listingId}`} className="block h-full">
        <article className="group relative h-full overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-300 hover:border-accent/50 hover:shadow-xl hover:shadow-accent/10">
          {/* Image Container */}
          <div className="relative aspect-[16/10] overflow-hidden bg-background-elevated">
            <img
              src={imageUrl}
              alt={metadata?.name || `Car #${listing.carId}`}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-car.svg';
              }}
            />

            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Top badges */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              <Badge
                variant="accent"
                className="backdrop-blur-md bg-accent/20 border-accent/30"
              >
                Secondary Market
              </Badge>
              {isPriceDown && (
                <Badge
                  variant="success"
                  className="backdrop-blur-md bg-success/20 border-success/30"
                >
                  {priceCompare.toFixed(0)}% Below Primary
                </Badge>
              )}
              {isPriceUp && (
                <Badge
                  variant="warning"
                  className="backdrop-blur-md bg-warning/20 border-warning/30"
                >
                  +{priceCompare.toFixed(0)}% Premium
                </Badge>
              )}
            </div>

            {/* Quick view button */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-colors">
                <ArrowUpRight className="h-5 w-5" />
              </div>
            </div>

            {/* Bottom image info - Time listed */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/10 backdrop-blur-md text-xs font-medium text-white border border-white/10">
                  <Clock className="h-3 w-3" />
                  Listed 2h ago
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            {/* Title */}
            <h3 className="font-heading font-bold text-lg text-text-primary mb-3 line-clamp-1 group-hover:text-accent transition-colors">
              {metadata?.name || `Car #${listing.carId}`}
            </h3>

            {/* Seller Info */}
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-background-elevated/50 border border-border/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 shrink-0">
                <User className="h-5 w-5 text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-text-muted">Seller</p>
                <div className="flex items-center gap-1.5">
                  <p className="font-mono text-sm text-text-primary truncate">
                    {formatAddress(listing.seller)}
                  </p>
                  <Verified className="h-3.5 w-3.5 text-primary shrink-0" />
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-background-elevated/50 border border-border/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <Coins className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-text-muted truncate">Price/Share</p>
                  <p className="font-heading font-bold text-sm text-text-primary font-mono truncate">
                    {formatEth(listing.pricePerShare)} ETH
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-background-elevated/50 border border-border/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 shrink-0">
                  <Package className="h-5 w-5 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-text-muted truncate">Shares</p>
                  <p className="font-heading font-bold text-sm text-text-primary font-mono truncate">
                    {formatNumber(Number(listing.amount))}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Value */}
            <div className="pt-4 border-t border-border">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-text-secondary">
                  <Wallet className="h-4 w-4" />
                  <span className="text-sm">Total Value</span>
                </div>
                <div className="text-right">
                  <span className="font-heading font-bold text-xl text-gradient-gold">
                    {formatEth(totalValue)} ETH
                  </span>
                </div>
              </div>
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}
