import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useRef, useState, useEffect, useCallback } from 'react';
import {
  ArrowRight,
  Car,
  Shield,
  TrendingUp,
  Users,
  Zap,
  Coins,
  ChevronRight,
  ChevronLeft,
  Wallet,
  BarChart3,
  Clock,
  Globe,
  Loader2,
} from 'lucide-react';
import { useCarMetadata } from '@/hooks/useCarMetadata';
import { getIpfsUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn, formatNumber, weiToEth } from '@/lib/utils';
import { ApiCarCard } from '@/components/car/ApiCarCard';
import { useCars } from '@/hooks/api/useCarsApi';
import { useMarketplaceListings } from '@/hooks/api/useMarketplaceApi';
import type { ApiCar, ApiMarketplaceListing } from '@/types/api';

// Sub-component to resolve IPFS image for a listing's car
function ListingCarImage({ metadataCID, alt }: { metadataCID?: string; alt: string }) {
  const { data: metadata } = useCarMetadata(metadataCID);
  const imageUrl = metadata?.image ? getIpfsUrl(metadata.image) : '/placeholder-car.svg';
  return (
    <img
      src={imageUrl}
      alt={alt}
      className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110"
      onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-car.svg'; }}
    />
  );
}

// Carousel Hook for smooth scrolling
function useCarousel(itemWidth: number = 320, gap: number = 24) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollPosition = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    checkScrollPosition();
    scrollEl.addEventListener('scroll', checkScrollPosition);
    window.addEventListener('resize', checkScrollPosition);

    return () => {
      scrollEl.removeEventListener('scroll', checkScrollPosition);
      window.removeEventListener('resize', checkScrollPosition);
    };
  }, [checkScrollPosition]);

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = (itemWidth + gap) * 2; // Scroll 2 cards at a time
    const newScrollLeft = scrollRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
    scrollRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
  }, [itemWidth, gap]);

  return { scrollRef, canScrollLeft, canScrollRight, scrollLeft: () => scroll('left'), scrollRight: () => scroll('right') };
}

const features = [
  {
    icon: Car,
    title: 'Fractional Ownership',
    description: 'Own shares of premium vehicles. Start with any amount and build your automotive portfolio.',
    color: 'primary' as const,
  },
  {
    icon: Shield,
    title: 'Secure & Transparent',
    description: 'All transactions recorded on blockchain. Complete transparency and security guaranteed.',
    color: 'accent' as const,
  },
  {
    icon: TrendingUp,
    title: 'Trade Anytime',
    description: 'Buy and sell shares on the marketplace. Full liquidity for your investments 24/7.',
    color: 'primary' as const,
  },
  {
    icon: Users,
    title: 'Earn Together',
    description: 'Receive your share of ride earnings. Profits distributed fairly to all shareholders.',
    color: 'accent' as const,
  },
];

const stats = [
  { value: '1,200+', label: 'Active Investors', icon: Users },
  { value: '$2.5M+', label: 'Total Volume', icon: BarChart3 },
  { value: '75+', label: 'Premium Cars', icon: Car },
  { value: '24/7', label: 'Live Trading', icon: Clock },
];

const howItWorks = [
  {
    step: '01',
    title: 'Connect Wallet',
    description: 'Link your crypto wallet to get started. We support all major wallets.',
    icon: Wallet,
  },
  {
    step: '02',
    title: 'Choose a Car',
    description: 'Browse our collection of premium and exotic vehicles available for investment.',
    icon: Car,
  },
  {
    step: '03',
    title: 'Buy Shares',
    description: 'Purchase fractional shares of your chosen vehicle. Start with any amount.',
    icon: Coins,
  },
  {
    step: '04',
    title: 'Earn & Trade',
    description: 'Receive earnings from rides and trade your shares on the marketplace.',
    icon: TrendingUp,
  },
];

// Carousel Navigation Button Component
function CarouselButton({
  direction,
  onClick,
  disabled
}: {
  direction: 'left' | 'right';
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'absolute top-1/2 -translate-y-1/2 z-20',
        'flex items-center justify-center',
        'w-12 h-12 rounded-full',
        'bg-background/90 backdrop-blur-sm',
        'border border-border shadow-lg',
        'text-text-primary hover:text-accent',
        'hover:border-accent/50 hover:bg-background',
        'transition-all duration-300',
        'disabled:opacity-0 disabled:pointer-events-none',
        direction === 'left' ? 'left-2 md:left-4' : 'right-2 md:right-4'
      )}
      aria-label={direction === 'left' ? 'Previous' : 'Next'}
    >
      {direction === 'left' ? (
        <ChevronLeft className="h-6 w-6" />
      ) : (
        <ChevronRight className="h-6 w-6" />
      )}
    </button>
  );
}

// Featured Cars Carousel Component
function FeaturedCarsCarousel() {
  const { scrollRef, canScrollLeft, canScrollRight, scrollLeft, scrollRight } = useCarousel(300, 24);
  const { data: carsResponse, isLoading } = useCars({ page: 1, limit: 12 });
  const featuredCars: ApiCar[] = (carsResponse?.data ?? []).filter(c => c.status === 'active');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (featuredCars.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted">No featured cars available yet</div>
    );
  }

  return (
    <div className="relative">
      {/* Left fade gradient */}
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-20 md:w-32 z-10 pointer-events-none',
          'bg-gradient-to-r from-background to-transparent',
          'transition-opacity duration-300',
          canScrollLeft ? 'opacity-100' : 'opacity-0'
        )}
      />

      {/* Right fade gradient */}
      <div
        className={cn(
          'absolute right-0 top-0 bottom-0 w-20 md:w-32 z-10 pointer-events-none',
          'bg-gradient-to-l from-background to-transparent',
          'transition-opacity duration-300',
          canScrollRight ? 'opacity-100' : 'opacity-0'
        )}
      />

      {/* Navigation Buttons */}
      <CarouselButton direction="left" onClick={scrollLeft} disabled={!canScrollLeft} />
      <CarouselButton direction="right" onClick={scrollRight} disabled={!canScrollRight} />

      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4 -mb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {featuredCars.map((car) => (
          <motion.div
            key={car.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex-shrink-0 w-[280px] sm:w-[300px] md:w-[320px]"
          >
            <ApiCarCard car={car} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Recent Listings Carousel Component
function RecentListingsCarousel() {
  const { scrollRef, canScrollLeft, canScrollRight, scrollLeft, scrollRight } = useCarousel(300, 24);
  const { data: listingsResponse, isLoading: listingsLoading } = useMarketplaceListings({ page: 1, limit: 12 });
  const { data: carsResponse } = useCars({ page: 1, limit: 100 });

  const allListings: ApiMarketplaceListing[] = (listingsResponse?.data ?? []).filter(l => l.active);
  const allCars: ApiCar[] = carsResponse?.data ?? [];

  // Build carId -> car map
  const carMap = new Map<number, ApiCar>();
  allCars.forEach(car => carMap.set(car.id, car));

  if (listingsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (allListings.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted">No marketplace listings yet</div>
    );
  }

  return (
    <div className="relative">
      {/* Left fade gradient */}
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-20 md:w-32 z-10 pointer-events-none',
          'bg-gradient-to-r from-surface to-transparent',
          'transition-opacity duration-300',
          canScrollLeft ? 'opacity-100' : 'opacity-0'
        )}
      />

      {/* Right fade gradient */}
      <div
        className={cn(
          'absolute right-0 top-0 bottom-0 w-20 md:w-32 z-10 pointer-events-none',
          'bg-gradient-to-l from-surface to-transparent',
          'transition-opacity duration-300',
          canScrollRight ? 'opacity-100' : 'opacity-0'
        )}
      />

      {/* Navigation Buttons */}
      <CarouselButton direction="left" onClick={scrollLeft} disabled={!canScrollLeft} />
      <CarouselButton direction="right" onClick={scrollRight} disabled={!canScrollRight} />

      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4 -mb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {allListings.map((listing) => {
          const car = carMap.get(listing.carId);
          return (
            <motion.div
              key={listing.listingId}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.1 }}
              className="flex-shrink-0 w-[280px] sm:w-[300px] md:w-[320px]"
            >
              <Link to={`/listing/${listing.listingId}`} className="block h-full">
                <article className="group/card relative h-full overflow-hidden rounded-xl border border-border bg-surface transition-all duration-300 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/10">
                  <div className="relative overflow-hidden bg-background-elevated aspect-[16/10]">
                    <ListingCarImage metadataCID={car?.metadataCID} alt={car?.name || `Car #${listing.carId}`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute top-3 left-3">
                      <Badge variant="success" size="sm" dot dotColor="success" className="backdrop-blur-md bg-success/20 border-success/30 text-xs">
                        Active
                      </Badge>
                    </div>
                    {car && (
                      <div className="absolute bottom-3 left-3 flex gap-1">
                        <span className="px-2 py-0.5 rounded-md bg-white/10 backdrop-blur-md text-xs font-medium text-white border border-white/10">{car.year}</span>
                        <span className="px-2 py-0.5 rounded-md bg-white/10 backdrop-blur-md text-xs font-medium text-white border border-white/10">{car.make}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0">
                        <h3 className="font-heading font-bold text-sm text-text-primary mb-1 line-clamp-1 group-hover/card:text-accent transition-colors">
                          {car?.name || `Car #${listing.carId}`}
                        </h3>
                        <p className="text-xs text-text-muted font-mono truncate">
                          Seller: {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="p-3 rounded-lg bg-background-elevated/50 border border-border/50">
                        <p className="text-[10px] text-text-muted mb-1">Shares</p>
                        <p className="font-heading font-bold text-sm text-text-primary font-mono">{formatNumber(listing.amount)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-background-elevated/50 border border-border/50">
                        <p className="text-[10px] text-text-muted mb-1">Price/Share</p>
                        <p className="font-heading font-bold text-sm text-text-primary font-mono">{weiToEth(listing.pricePerShare)} ETH</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <div>
                        <p className="text-[10px] text-text-muted">Total Cost</p>
                        <p className="font-heading font-bold text-sm text-accent font-mono">
                          {weiToEth((BigInt(listing.pricePerShare) * BigInt(listing.amount)).toString())} ETH
                        </p>
                      </div>
                      <Button size="sm" variant="outline" className="text-xs">View</Button>
                    </div>
                  </div>
                </article>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export function Home() {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center gradient-hero">
        {/* Animated glow orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-float" />
          <div
            className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] animate-float"
            style={{ animationDelay: '1.5s' }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-primary/5 rounded-full blur-[150px]" />
        </div>

        <div className="container flex justify-center  relative z-10 py-20 lg:py-28">
          <div className="max-w-4xl  text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="default" size="lg" className="mb-8">
                <Zap className="h-3.5 w-3.5 mr-1.5" />
                Powered by Blockchain Technology
              </Badge>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-display mb-6 text-balance"
            >
              Own a Piece of{' '}
              <span className="gradient-text">Premium Vehicles</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl text-center text-text-secondary mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Invest in luxury and exotic cars through tokenized shares.
              Earn from rides, trade anytime, and build your automotive portfolio.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button asChild size="xl" variant="glow" className="group">
                <Link to="/discover" className="flex items-center justify-center bg-primary/70 rounded-lg px-4 py-2 gap-x-2 hover:bg-primary/80" >
                  <span>Explore Cars</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="xl">
                <Link to="/signup" className="flex items-center justify-center bg-[#d4a574]/50 rounded-lg px-4 py-2 gap-x-2 hover:bg-[#d4a574]/60">
                  <span>Get Started Free</span>
                  <Wallet className="h-4 w-4" />
                </Link>
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-20 pt-12 border-t border-border/30"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} className="text-center group">
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary-muted text-primary mb-3 group-hover:scale-110 transition-transform">
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="text-2xl md:text-3xl font-bold font-heading text-text-primary mb-1">
                        {stat.value}
                      </p>
                      <p className="text-sm text-text-muted">{stat.label}</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute -bottom-6 z-10 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-text-muted/30 flex items-start justify-center p-1.5">
            <div className="w-1.5 h-2.5 rounded-full bg-text-muted/50 animate-pulse" />
          </div>
        </div>
      </section>

        {/* Featured Cars Section */}
      <section className="py-24 relative">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
          >
            <div>
              <Badge variant="success" className="mb-3">Live Now</Badge>
              <h2 className="text-headline mb-2">Featured Cars</h2>
              <p className="text-text-secondary">
                Discover the latest tokenized vehicles available for investment
              </p>
            </div>
            <Button asChild variant="outline" className="group shrink-0">
              <Link to="/discover" className="flex items-center justify-center bg-primary/70 rounded-lg px-4 py-2 gap-x-2">
                <span>View All Cars</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </motion.div>

          <FeaturedCarsCarousel />
        </div>
      </section>

      {/* Marketplace Section */}
      <section className="py-24 bg-surface relative">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
          >
            <div>
              <Badge variant="accent" className="mb-3">Secondary Market</Badge>
              <h2 className="text-headline mb-2">Recent Listings</h2>
              <p className="text-text-secondary">
                Browse the marketplace for shares from other investors
              </p>
            </div>
            <Button asChild variant="outline" className="group shrink-0">
              <Link to="/marketplace" className="flex items-center justify-center bg-accent/70 rounded-lg px-4 py-2 gap-x-2 hover:bg-accent/80">
                <span>View Marketplace</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </motion.div>

          <RecentListingsCarousel />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-surface relative">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <Badge variant="accent" className="mb-4">How It Works</Badge>
            <h2 className="text-headline mb-4">Start Investing in 4 Simple Steps</h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              From connecting your wallet to earning passive income - it's that easy
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card variant="default" hover="glow" className="p-6 h-full relative group">
                    {/* Step number */}
                    <span className="absolute top-4 right-4 text-4xl font-bold font-heading text-border group-hover:text-primary/20 transition-colors">
                      {item.step}
                    </span>

                    <div className="w-12 h-12 rounded-xl bg-primary-muted text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Icon className="h-6 w-6" />
                    </div>

                    <h3 className="font-heading font-semibold text-lg text-text-primary mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {item.description}
                    </p>

                    {/* Connector line (except last) */}
                    {index < howItWorks.length - 1 && (
                      <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-border" />
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative gradient-mesh">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <Badge variant="default" className="mb-4">Features</Badge>
            <h2 className="text-headline mb-4">Why Choose CarShares?</h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              The most trusted platform for fractional car ownership and investment
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card variant="elevated" hover="lift" className="p-8 h-full">
                    <div className="flex items-start gap-5">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                          feature.color === 'primary'
                            ? 'bg-primary-muted text-primary'
                            : 'bg-accent-muted text-accent'
                        }`}
                      >
                        <Icon className="h-7 w-7" />
                      </div>
                      <div>
                        <h3 className="font-heading font-semibold text-xl text-text-primary mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-text-secondary leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>



      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative rounded-3xl overflow-hidden"
          >
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary-dark/30 to-background" />
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent/20 rounded-full blur-[100px]" />
              <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-primary-light/20 rounded-full blur-[80px]" />
            </div>

            {/* Pattern overlay */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }} />
            </div>

            <div className="relative px-8 py-16 md:px-16 md:py-24 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/90 text-sm font-medium mb-6">
                <Globe className="h-4 w-4" />
                Join 1,200+ investors worldwide
              </div>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-heading mb-4 text-white">
                Ready to Start Your Journey?
              </h2>
              <p className="text-white/70 max-w-xl mx-auto mb-10 text-lg">
                Connect your wallet and start investing in premium vehicles today.
                No minimum investment required.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 shadow-xl shadow-black/20">
                  <Link to="/signup" className="inline-flex items-center gap-2">
                    <span>Create Account</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 hover:border-white/50"
                >
                  <Link to="/discover" className="inline-flex items-center gap-2">Explore First
                    <Wallet className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
