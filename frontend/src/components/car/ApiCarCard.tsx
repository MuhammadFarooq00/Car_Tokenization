import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { formatNumber, getIpfsUrl, weiToEth } from '@/lib/utils';
import { TrendingUp, Coins, ArrowUpRight, Users, Zap, CheckCircle2, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCarMetadata } from '@/hooks/useCarMetadata';
import { useLikes } from '@/hooks/api/useLikes';
import type { ApiCar } from '@/types/api';

interface ApiCarCardProps {
  car: ApiCar;
  variant?: 'default' | 'compact';
}

export function ApiCarCard({ car, variant = 'default' }: ApiCarCardProps) {
  const { data: metadata } = useCarMetadata(car.metadataCID);
  const imageUrl = metadata?.image ? getIpfsUrl(metadata.image) : '/placeholder-car.svg';
  const priceEth = weiToEth(car.pricePerShare);
  const totalValueEth = weiToEth((BigInt(car.pricePerShare) * BigInt(car.totalShares)).toString());
  const { isLiked, toggleLike } = useLikes();
  const [imgLoaded, setImgLoaded] = useState(false);

  // primarySaleActive=true → shares still for sale; false → car is on-road (sale closed)
  const saleOpen = car.primarySaleActive ?? true; // default true for backwards-compat
  const isActive = car.status === 'active';
  // sharesDistributed includes owner's initial allocation + all primary buyers (DB holdings)
  const distributed = car.sharesDistributed ?? car.sharesSold;
  const soldPct = car.totalShares > 0
    ? Math.round((distributed / car.totalShares) * 100)
    : 0;

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ x: 4 }}
        className="w-full"
      >
        <Link to={`/car/${car.id}`} className="block">
          <article
            className={cn(
              'group/card relative flex overflow-hidden rounded-xl border border-border bg-surface transition-all duration-300',
              'hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10',
              'h-[140px] sm:h-[160px]'
            )}
          >
            <div className="relative w-[180px] sm:w-[220px] md:w-[280px] shrink-0 overflow-hidden">
              {!imgLoaded && <div className="absolute inset-0 bg-background-elevated animate-pulse" />}
              <img
                src={imageUrl}
                alt={car.name}
                className={cn('w-full h-full object-cover transition-all duration-500 group-hover/card:scale-110', imgLoaded ? 'opacity-100' : 'opacity-0')}
                onLoad={() => setImgLoaded(true)}
                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-car.svg'; setImgLoaded(true); }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-surface/80" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute top-2 left-2">
                {isActive && saleOpen && (
                  <Badge variant="warning" size="sm" className="backdrop-blur-md bg-warning/20 border-warning/30 text-[10px]">
                    <Zap className="h-2.5 w-2.5 mr-0.5" />
                    Sale Open
                  </Badge>
                )}
                {isActive && !saleOpen && (
                  <Badge variant="success" size="sm" className="backdrop-blur-md bg-success/20 border-success/30 text-[10px]">
                    <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                    On Road
                  </Badge>
                )}
              </div>
              <div className="absolute bottom-2 left-2 flex gap-1">
                <span className="px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-sm text-[10px] font-medium text-white">{car.year}</span>
                <span className="px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-sm text-[10px] font-medium text-white">{car.make}</span>
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-between p-3 sm:p-4 min-w-0">
              <div>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-heading font-bold text-sm sm:text-base text-text-primary line-clamp-1 group-hover/card:text-primary transition-colors">{car.name}</h3>
                  <div className="shrink-0 opacity-0 group-hover/card:opacity-100 transition-opacity">
                    <ArrowUpRight className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10">
                    <Coins className="h-3 w-3 text-primary" />
                  </div>
                  <div>
                    <p className="text-[9px] text-text-muted leading-none">Price</p>
                    <p className="font-bold text-xs text-text-primary font-mono">{priceEth} ETH</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-accent/10">
                    <TrendingUp className="h-3 w-3 text-accent" />
                  </div>
                  <div>
                    <p className="text-[9px] text-text-muted leading-none">Shares</p>
                    <p className="font-bold text-xs text-text-primary font-mono">{formatNumber(car.totalShares)}</p>
                  </div>
                </div>
              </div>
              <div className="mt-2">
                <div className="flex justify-between items-center text-[9px] mb-1">
                  <span className="flex items-center gap-1 text-text-secondary">
                    <Users className="h-2.5 w-2.5" />
                    {totalValueEth} ETH total
                  </span>
                  <span className="text-text-muted font-mono">{formatNumber(car.totalShares)} shares</span>
                </div>
              </div>
            </div>
          </article>
        </Link>
      </motion.div>
    );
  }

  // Default Grid View
  const liked = isLiked(car.id);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Link to={`/car/${car.id}`} className="block h-full">
        <article
          className={cn(
            'group/card relative h-full overflow-hidden rounded-xl border border-border bg-surface transition-all duration-300',
            'hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10'
          )}
        >
          <div className="relative overflow-hidden bg-background-elevated aspect-[16/10]">
            {!imgLoaded && <div className="absolute inset-0 bg-background-elevated animate-pulse" />}
            <img
              src={imageUrl}
              alt={car.name}
              className={cn('w-full h-full object-cover transition-all duration-500 group-hover/card:scale-110', imgLoaded ? 'opacity-100' : 'opacity-0')}
              onLoad={() => setImgLoaded(true)}
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-car.svg'; setImgLoaded(true); }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
              {isActive && saleOpen && (
                <Badge variant="warning" size="sm" className="backdrop-blur-md bg-warning/20 border-warning/30 text-xs">
                  <Zap className="h-3 w-3 mr-1" />
                  Sale Open
                </Badge>
              )}
              {isActive && !saleOpen && (
                <Badge variant="success" size="sm" className="backdrop-blur-md bg-success/20 border-success/30 text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  On Road
                </Badge>
              )}
              {car.status === 'paused' && (
                <Badge variant="accent" size="sm" className="backdrop-blur-md bg-accent/20 border-accent/30 text-xs">
                  Paused
                </Badge>
              )}
              {car.status === 'retired' && (
                <Badge variant="default" size="sm" className="backdrop-blur-md bg-primary/20 border-primary/30 text-xs">
                  Retired
                </Badge>
              )}
            </div>
            {/* Heart button — stopPropagation prevents the Link from firing */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleLike(car.id); }}
                title={liked ? 'Remove from liked' : 'Add to liked'}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg backdrop-blur-md border transition-all duration-200',
                  liked
                    ? 'bg-error text-white border-error/50 opacity-100'
                    : 'bg-white/10 text-white border-white/20 hover:bg-error/80 opacity-0 group-hover/card:opacity-100'
                )}
              >
                <Heart className={cn('h-4 w-4', liked && 'fill-white')} />
              </button>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white transition-colors opacity-0 group-hover/card:opacity-100">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
            <div className="absolute bottom-3 left-3 right-3">
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-white/10 backdrop-blur-md text-xs font-medium text-white border border-white/10">{car.year}</span>
                <span className="px-2 py-0.5 rounded-md bg-white/10 backdrop-blur-md text-xs font-medium text-white border border-white/10">{car.make}</span>
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="mb-3">
              <h3 className="font-heading font-bold text-sm text-text-primary mb-1 line-clamp-1 group-hover/card:text-primary transition-colors">{car.name}</h3>
              <p className="text-xs text-text-secondary line-clamp-1 leading-relaxed">{car.make} {car.model} - {car.year}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-background-elevated/50 border border-border/50">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 shrink-0">
                  <Coins className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-text-muted">Price</p>
                  <p className="font-heading font-bold text-xs text-text-primary font-mono">{priceEth} ETH</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-background-elevated/50 border border-border/50">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/10 shrink-0">
                  <TrendingUp className="h-3.5 w-3.5 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-text-muted">Shares</p>
                  <p className="font-heading font-bold text-xs text-text-primary font-mono">{formatNumber(car.totalShares)}</p>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px]">
                <span className="flex items-center gap-1 text-text-secondary">
                  <Users className="h-3 w-3" />
                  {totalValueEth} ETH total value
                </span>
                {saleOpen && (
                  <span className="font-mono text-text-muted">
                    {formatNumber(distributed)}/{formatNumber(car.totalShares)} distributed
                  </span>
                )}
                {!saleOpen && (
                  <span className="text-success font-medium">On Road</span>
                )}
              </div>
              {saleOpen && (
                <div className="w-full h-1.5 rounded-full bg-background-elevated overflow-hidden">
                  <div
                    className="h-full rounded-full bg-warning transition-all"
                    style={{ width: `${soldPct}%` }}
                  />
                </div>
              )}
              {!saleOpen && (
                <div className="w-full h-1.5 rounded-full bg-success/20 overflow-hidden">
                  <div className="h-full w-full rounded-full bg-success" />
                </div>
              )}
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}
