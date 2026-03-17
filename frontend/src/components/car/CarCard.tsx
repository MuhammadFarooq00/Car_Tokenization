import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { useCarConfig } from '@/hooks/contracts/useCarShares';
import { useCarMetadata } from '@/hooks/useCarMetadata';
import { formatEth, getIpfsUrl, formatNumber } from '@/lib/utils';
import { CarCardSkeleton } from './CarCardSkeleton';
import { TrendingUp, Coins, Clock, Users, ArrowUpRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CarCardProps {
  carId: bigint;
  variant?: 'default' | 'compact' | 'featured';
}

export function CarCard({ carId, variant = 'default' }: CarCardProps) {
  const { data: config, isLoading: configLoading } = useCarConfig(carId);
  const { data: metadata, isLoading: metadataLoading } = useCarMetadata(config?.metadataCID);
  const [imgLoaded, setImgLoaded] = useState(false);

  if (configLoading || metadataLoading) {
    return <CarCardSkeleton />;
  }

  if (!config || config.totalSupply === 0n) {
    return null;
  }

  const imageUrl = metadata?.image ? getIpfsUrl(metadata.image) : '/placeholder-car.svg';
  const soldPercent = Number((config.sharesSold * 100n) / config.totalSupply);
  const availableShares = config.remainingPublicSupply;
  const isSaleActive = config.primarySaleActive;
  const isAlmostSoldOut = soldPercent >= 80;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Link to={`/car/${carId}`} className="block h-full">
        <article
          className={cn(
            'group relative h-full overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-300',
            'hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10',
            variant === 'featured' && 'md:flex md:flex-row'
          )}
        >
          {/* Image Container */}
          <div
            className={cn(
              'relative overflow-hidden bg-background-elevated',
              variant === 'featured' ? 'md:w-1/2 aspect-[16/10] md:aspect-auto' : 'aspect-[16/10]'
            )}
          >
            {!imgLoaded && <div className="absolute inset-0 bg-background-elevated animate-pulse" />}
            <img
              src={imageUrl}
              alt={metadata?.name || `Car #${carId}`}
              className={cn(
                'w-full h-full object-cover transition-all duration-500 group-hover:scale-110',
                imgLoaded ? 'opacity-100' : 'opacity-0'
              )}
              onLoad={() => setImgLoaded(true)}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-car.svg';
                setImgLoaded(true);
              }}
            />

            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              {isSaleActive && (
                <Badge
                  variant="success"
                  dot
                  dotColor="success"
                  className="backdrop-blur-md bg-success/20 border-success/30"
                >
                  Active Sale
                </Badge>
              )}
              {isAlmostSoldOut && (
                <Badge
                  variant="warning"
                  className="backdrop-blur-md bg-warning/20 border-warning/30"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Almost Sold Out
                </Badge>
              )}
            </div>

            {/* Quick view button */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-colors">
                <ArrowUpRight className="h-5 w-5" />
              </div>
            </div>

            {/* Bottom image info */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center gap-2">
                {metadata?.attributes?.find((a: { trait_type: string }) => a.trait_type === 'Year')?.value && (
                  <span className="px-2 py-1 rounded-lg bg-white/10 backdrop-blur-md text-xs font-medium text-white border border-white/10">
                    {metadata?.attributes?.find((a: { trait_type: string }) => a.trait_type === 'Year')?.value}
                  </span>
                )}
                {metadata?.attributes?.find((a: { trait_type: string }) => a.trait_type === 'Make')?.value && (
                  <span className="px-2 py-1 rounded-lg bg-white/10 backdrop-blur-md text-xs font-medium text-white border border-white/10">
                    {metadata?.attributes?.find((a: { trait_type: string }) => a.trait_type === 'Make')?.value}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className={cn('p-5', variant === 'featured' && 'md:w-1/2 md:p-6 md:flex md:flex-col md:justify-center')}>
            {/* Title & Description */}
            <div className="mb-4">
              <h3 className="font-heading font-bold text-lg text-text-primary mb-1.5 line-clamp-1 group-hover:text-primary transition-colors">
                {metadata?.name || `Car #${carId}`}
              </h3>
              <p className="text-sm text-text-secondary line-clamp-2 leading-relaxed">
                {metadata?.description || 'Premium tokenized vehicle available for investment'}
              </p>
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
                    {formatEth(config.pricePerShare)} ETH
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-background-elevated/50 border border-border/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 shrink-0">
                  <TrendingUp className="h-5 w-5 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-text-muted truncate">Available</p>
                  <p className="font-heading font-bold text-sm text-text-primary font-mono truncate">
                    {formatNumber(Number(availableShares))}
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Section */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 text-text-secondary">
                  <Users className="h-3.5 w-3.5" />
                  {soldPercent.toFixed(0)}% funded
                </span>
                <span className="text-text-muted font-mono">
                  {formatNumber(Number(config.totalSupply))} shares
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-background-tertiary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${soldPercent}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    soldPercent >= 80
                      ? 'bg-gradient-to-r from-warning to-warning-hover'
                      : 'bg-gradient-to-r from-primary via-primary-hover to-accent'
                  )}
                  style={{
                    boxShadow: soldPercent > 0 ? '0 0 12px rgba(14, 165, 233, 0.5)' : 'none',
                  }}
                />
              </div>
            </div>

            {/* Featured variant: Extra info */}
            {variant === 'featured' && (
              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <span>Featured Investment</span>
                </div>
                <span className="text-sm font-medium text-primary group-hover:underline">
                  View Details →
                </span>
              </div>
            )}
          </div>
        </article>
      </Link>
    </motion.div>
  );
}
