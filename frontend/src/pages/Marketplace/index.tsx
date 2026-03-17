import { motion } from 'framer-motion';
import { Search, TrendingUp, ArrowUpDown, DollarSign, Tag, LayoutGrid, List, ChevronLeft, ChevronRight, X, ShoppingBag, Loader2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatNumber, weiToEth } from '@/lib/utils';
import { useMarketplaceListings } from '@/hooks/api/useMarketplaceApi';
import { useCars } from '@/hooks/api/useCarsApi';
import { DecorativeCardStack } from '@/components/ui/decorative-card-stack';
import { useCarMetadata } from '@/hooks/useCarMetadata';
import { getIpfsUrl } from '@/lib/utils';
import type { ApiMarketplaceListing, ApiCar } from '@/types/api';

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

const ITEMS_PER_PAGE = 12;

const sortOptions = [
  { id: 'shares-high', label: 'Most Shares', icon: Tag },
  { id: 'price-low', label: 'Price: Low to High', icon: ArrowUpDown },
  { id: 'price-high', label: 'Price: High to Low', icon: DollarSign },
];

export function Marketplace() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('shares-high');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch data from API
  const { data: listingsResponse, isLoading: listingsLoading, error: listingsError, refetch } = useMarketplaceListings({ page: 1, limit: 100 });
  const { data: carsResponse } = useCars({ page: 1, limit: 100 });

  const allListings: ApiMarketplaceListing[] = listingsResponse?.data ?? [];
  const allCars: ApiCar[] = carsResponse?.data ?? [];

  // Build a carId -> car map for enriching listings
  const carMap = useMemo(() => {
    const map = new Map<number, ApiCar>();
    allCars.forEach(car => map.set(car.id, car));
    return map;
  }, [allCars]);

  // Filter and sort listings
  const filteredListings = useMemo(() => {
    let result = allListings.filter(l => l.active);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(listing => {
        const car = carMap.get(listing.carId);
        return car
          ? car.name.toLowerCase().includes(query) ||
            car.make.toLowerCase().includes(query) ||
            car.model.toLowerCase().includes(query)
          : false;
      });
    }

    switch (sortBy) {
      case 'shares-high':
        result.sort((a, b) => b.amount - a.amount);
        break;
      case 'price-low':
        result.sort((a, b) => Number(BigInt(a.pricePerShare) - BigInt(b.pricePerShare)));
        break;
      case 'price-high':
        result.sort((a, b) => Number(BigInt(b.pricePerShare) - BigInt(a.pricePerShare)));
        break;
    }

    return result;
  }, [allListings, searchQuery, sortBy, carMap]);

  const totalPages = Math.ceil(filteredListings.length / ITEMS_PER_PAGE);
  const paginatedListings = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredListings.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredListings, currentPage]);

  const handleFilterChange = (setter: (value: string) => void, value: string) => {
    setter(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSortBy('shares-high');
    setCurrentPage(1);
  };

  const isLoading = listingsLoading;
  const error = listingsError;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header Section */}
      <section className="relative py-16 lg:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-background to-background" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

        <div className="container relative">
          <div className="flex items-start gap-8">
            <div className="flex-1 min-w-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-3xl"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6"
                >
                  <TrendingUp className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium text-accent">Secondary Market</span>
                </motion.div>

                <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-4">
                  Share{' '}
                  <span className="text-gradient-gold">Marketplace</span>
                </h1>
                <p className="text-lg md:text-xl text-text-secondary leading-relaxed max-w-2xl">
                  Browse secondary listings from other shareholders. Find great deals on premium car shares and build your portfolio.
                </p>
              </motion.div>

              {/* Search and filters */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-10"
              >
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="relative flex-1 max-w-2xl">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                      <Search className="h-5 w-5" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
                      placeholder="Search listings by car name or make..."
                      className="w-full h-14 pl-12 pr-4 rounded-2xl border border-border bg-surface text-text-primary text-base placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => handleFilterChange(setSearchQuery, '')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <div className="flex items-center gap-1 p-1.5 rounded-xl bg-surface border border-border">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={cn(
                          'p-2.5 rounded-lg transition-all duration-200',
                          viewMode === 'grid' ? 'bg-accent text-white shadow-md' : 'text-text-muted hover:text-text-primary'
                        )}
                        aria-label="Grid view"
                      >
                        <LayoutGrid className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={cn(
                          'p-2.5 rounded-lg transition-all duration-200',
                          viewMode === 'list' ? 'bg-accent text-white shadow-md' : 'text-text-muted hover:text-text-primary'
                        )}
                        aria-label="List view"
                      >
                        <List className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sort pills */}
                <div className="flex flex-wrap items-center gap-3 mt-6">
                  {sortOptions.map((option) => {
                    const Icon = option.icon;
                    const isActive = sortBy === option.id;
                    return (
                      <button
                        key={option.id}
                        onClick={() => setSortBy(option.id)}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                          isActive
                            ? 'bg-accent text-white shadow-lg shadow-accent/25'
                            : 'bg-surface border border-border text-text-secondary hover:border-accent/50 hover:text-text-primary'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="hidden xl:flex items-center justify-center shrink-0"
            >
              <DecorativeCardStack variant="accent" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border bg-surface/50">
        <div className="container py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-heading font-bold text-text-primary font-mono">{filteredListings.length}</span>
                <span className="text-sm text-text-muted">Active Listings</span>
              </div>
            </div>
            {filteredListings.length > 0 && (
              <p className="text-sm text-text-muted">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredListings.length)} of {filteredListings.length}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Listings Grid */}
      <section className="container py-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-accent mb-4" />
            <p className="text-text-secondary">Loading marketplace listings...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <ShoppingBag className="h-16 w-16 mx-auto text-text-muted mb-4" />
            <h3 className="text-xl font-heading font-semibold text-text-primary mb-2">Failed to load listings</h3>
            <p className="text-text-secondary mb-6">{error instanceof Error ? error.message : 'Something went wrong'}</p>
            <Button variant="outline" onClick={() => refetch()}>Try Again</Button>
          </div>
        ) : paginatedListings.length > 0 ? (
          <>
            <div className={cn(
              'grid gap-6',
              viewMode === 'grid'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'grid-cols-1'
            )}>
              {paginatedListings.map((listing) => {
                const car = carMap.get(listing.carId);
                return (
                  <Link key={listing.listingId} to={`/listing/${listing.listingId}`} className="block h-full">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -4 }}
                      className="h-full"
                    >
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
                            <Button size="sm" variant="outline" className="text-xs">
                              View Details
                            </Button>
                          </div>
                        </div>
                      </article>
                    </motion.div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="gap-1">
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    const showPage = page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1);
                    const showEllipsis = page === currentPage - 2 || page === currentPage + 2;
                    if (!showPage && !showEllipsis) return null;
                    if (showEllipsis) return <span key={page} className="px-2 text-text-muted">...</span>;
                    return (
                      <button key={page} onClick={() => setCurrentPage(page)} className={cn('w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200', page === currentPage ? 'bg-accent text-white shadow-md' : 'text-text-secondary hover:bg-surface hover:text-text-primary')}>
                        {page}
                      </button>
                    );
                  })}
                </div>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="gap-1">
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <ShoppingBag className="h-16 w-16 mx-auto text-text-muted mb-4" />
            <h3 className="text-xl font-heading font-semibold text-text-primary mb-2">No listings found</h3>
            <p className="text-text-secondary mb-6">
              {searchQuery ? 'Try adjusting your search query' : 'No active listings on the marketplace yet'}
            </p>
            {searchQuery && (
              <Button variant="outline" onClick={clearFilters}>Clear Search</Button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
