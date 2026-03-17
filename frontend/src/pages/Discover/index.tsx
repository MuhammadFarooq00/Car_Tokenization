import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, Car, Sparkles, TrendingUp, Filter, Grid3X3, LayoutList, ChevronDown, ChevronLeft, ChevronRight, X, Loader2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCars } from '@/hooks/api/useCarsApi';
import { ApiCarCard } from '@/components/car/ApiCarCard';
import { DecorativeCardStack } from '@/components/ui/decorative-card-stack';
import type { ApiCar } from '@/types/api';

const ITEMS_PER_PAGE = 12;

const statusFilters = [
  { id: 'all', label: 'All Cars', icon: Car },
  { id: 'sale_open', label: 'Sale Open', icon: Sparkles },
  { id: 'on_road', label: 'On Road', icon: TrendingUp },
  { id: 'sold_out', label: 'Sold Out', icon: Filter },
];

const categoryFilters = [
  { id: 'all', label: 'All Categories' },
  { id: 'sports', label: 'Sports' },
  { id: 'supercar', label: 'Supercar' },
  { id: 'luxury', label: 'Luxury' },
  { id: 'classic', label: 'Classic' },
  { id: 'suv', label: 'SUV' },
];

const sortOptions = [
  { id: 'newest', label: 'Newest First' },
  { id: 'oldest', label: 'Oldest First' },
  { id: 'price-low', label: 'Price: Low to High' },
  { id: 'price-high', label: 'Price: High to Low' },
  { id: 'available', label: 'Most Available' },
  { id: 'funded', label: 'Most Funded' },
];

export function Discover() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [makeFilter, setMakeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch cars from API
  const { data: carsResponse, isLoading, error, refetch } = useCars({ page: 1, limit: 100 });
  const allCars: ApiCar[] = carsResponse?.data ?? [];

  // Derive make filters from API data
  const makeFilters = useMemo(() =>
    [...new Set(allCars.map(car => car.make))].sort(),
    [allCars],
  );

  // Filter and sort cars (client-side since backend doesn't support all filters)
  const filteredCars = useMemo(() => {
    let result = [...allCars];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(car =>
        car.name.toLowerCase().includes(query) ||
        car.make.toLowerCase().includes(query) ||
        car.model.toLowerCase().includes(query) ||
        car.year.toString().includes(query)
      );
    }

    if (statusFilter === 'sale_open') {
      result = result.filter(car => car.status === 'active' && (car.primarySaleActive ?? true));
    } else if (statusFilter === 'on_road') {
      result = result.filter(car => car.status === 'active' && !(car.primarySaleActive ?? true));
    } else if (statusFilter !== 'all') {
      result = result.filter(car => car.status === statusFilter);
    }

    if (makeFilter !== 'all') {
      result = result.filter(car => car.make === makeFilter);
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'price-low':
        result.sort((a, b) => Number(BigInt(a.pricePerShare) - BigInt(b.pricePerShare)));
        break;
      case 'price-high':
        result.sort((a, b) => Number(BigInt(b.pricePerShare) - BigInt(a.pricePerShare)));
        break;
      case 'available':
        result.sort((a, b) => b.totalShares - a.totalShares);
        break;
    }

    return result;
  }, [allCars, searchQuery, statusFilter, categoryFilter, makeFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredCars.length / ITEMS_PER_PAGE);
  const paginatedCars = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCars.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredCars, currentPage]);

  // Reset page when filters change
  const handleFilterChange = (setter: (value: string) => void, value: string) => {
    setter(value);
    setCurrentPage(1);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setMakeFilter('all');
    setSortBy('newest');
    setCurrentPage(1);
  };

  const activeFiltersCount = [
    statusFilter !== 'all',
    categoryFilter !== 'all',
    makeFilter !== 'all',
    searchQuery !== '',
  ].filter(Boolean).length;

  // Stats
  const activeCars = allCars.filter(c => c.status === 'active').length;
  const totalValueWei = allCars.reduce((sum, car) => sum + BigInt(car.pricePerShare) * BigInt(car.totalShares), 0n);
  const totalValueEth = Number(totalValueWei) / 1e18;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header Section */}
      <section className="relative py-16 lg:py-20 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

        <div className="container relative">
          {/* Hero content wrapper with decorative cards on xl */}
          <div className="flex items-start gap-8">
            {/* Left content */}
            <div className="flex-1 min-w-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-3xl"
              >
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
                >
                  <Car className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Browse Collection</span>
                </motion.div>

                <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-4">
                  Discover{' '}
                  <span className="text-gradient">Premium Vehicles</span>
                </h1>
                <p className="text-lg md:text-xl text-text-secondary leading-relaxed max-w-2xl">
                  Browse all tokenized vehicles available on the platform. Find your next investment opportunity in our curated collection of premium cars.
                </p>
              </motion.div>

              {/* Search and filters */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-10"
              >
            {/* Search bar */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1 max-w-2xl">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                  <Search className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
                  placeholder="Search cars by name, make, model, or year..."
                  className="w-full h-14 pl-12 pr-4 rounded-2xl border border-border bg-surface text-text-primary text-base placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
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
                <Button
                  variant="outline"
                  size="lg"
                  className={cn("h-14 px-6 gap-2", showFilters && "border-primary text-primary")}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <SlidersHorizontal className="h-5 w-5" />
                  <span className="hidden sm:inline">Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="flex items-center justify-center w-5 h-5 text-xs font-bold bg-primary text-white rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>

                {/* View mode toggle */}
                <div className="flex items-center gap-1 p-1.5 rounded-xl bg-surface border border-border">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      'p-2.5 rounded-lg transition-all duration-200',
                      viewMode === 'grid'
                        ? 'bg-primary text-white shadow-md'
                        : 'text-text-muted hover:text-text-primary'
                    )}
                    aria-label="Grid view"
                  >
                    <Grid3X3 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      'p-2.5 rounded-lg transition-all duration-200',
                      viewMode === 'list'
                        ? 'bg-primary text-white shadow-md'
                        : 'text-text-muted hover:text-text-primary'
                    )}
                    aria-label="List view"
                  >
                    <LayoutList className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded Filters Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="mt-6 p-6 rounded-2xl bg-surface border border-border overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Category Filter */}
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">Category</label>
                      <div className="relative">
                        <select
                          value={categoryFilter}
                          onChange={(e) => handleFilterChange(setCategoryFilter, e.target.value)}
                          className="w-full h-11 px-4 pr-10 rounded-xl border border-border bg-background text-text-primary text-sm appearance-none focus:outline-none focus:border-primary"
                        >
                          {categoryFilters.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
                      </div>
                    </div>

                    {/* Make Filter */}
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">Make</label>
                      <div className="relative">
                        <select
                          value={makeFilter}
                          onChange={(e) => handleFilterChange(setMakeFilter, e.target.value)}
                          className="w-full h-11 px-4 pr-10 rounded-xl border border-border bg-background text-text-primary text-sm appearance-none focus:outline-none focus:border-primary"
                        >
                          <option value="all">All Makes</option>
                          {makeFilters.map(make => (
                            <option key={make} value={make}>{make}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
                      </div>
                    </div>

                    {/* Sort By */}
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">Sort By</label>
                      <div className="relative">
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="w-full h-11 px-4 pr-10 rounded-xl border border-border bg-background text-text-primary text-sm appearance-none focus:outline-none focus:border-primary"
                        >
                          {sortOptions.map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
                      </div>
                    </div>

                    {/* Clear Filters */}
                    <div className="flex items-end">
                      <Button
                        variant="ghost"
                        onClick={clearFilters}
                        disabled={activeFiltersCount === 0}
                        className="w-full h-11"
                      >
                        Clear All Filters
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Status filter pills */}
            <div className="flex flex-wrap items-center gap-3 mt-6">
              {statusFilters.map((filter) => {
                const Icon = filter.icon;
                const isActive = statusFilter === filter.id;
                return (
                  <button
                    key={filter.id}
                    onClick={() => handleFilterChange(setStatusFilter, filter.id)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-primary text-white shadow-lg shadow-primary/25'
                        : 'bg-surface border border-border text-text-secondary hover:border-primary/50 hover:text-text-primary'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {filter.label}
                  </button>
                );
              })}

              <div className="h-6 w-px bg-border mx-2 hidden sm:block" />

              {/* Quick sort dropdown */}
              <div className="relative">
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-surface border border-border text-text-secondary hover:border-primary/50 hover:text-text-primary transition-all duration-200">
                  <Filter className="h-4 w-4" />
                  {sortOptions.find(s => s.id === sortBy)?.label}
                </button>
              </div>
            </div>
          </motion.div>
            </div>

            {/* Decorative Card Stack - Only visible on xl screens */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="hidden xl:flex items-center justify-center shrink-0"
            >
              <DecorativeCardStack variant="primary" />
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
                <span className="text-2xl font-heading font-bold text-text-primary font-mono">{filteredCars.length}</span>
                <span className="text-sm text-text-muted">
                  {filteredCars.length === allCars.length ? 'Total Cars' : 'Matching Cars'}
                </span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <span className="text-2xl font-heading font-bold text-success font-mono">{activeCars}</span>
                <span className="text-sm text-text-muted">Active Sales</span>
              </div>
              <div className="h-4 w-px bg-border hidden sm:block" />
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-2xl font-heading font-bold text-accent font-mono">{totalValueEth.toFixed(2)} ETH</span>
                <span className="text-sm text-text-muted">Total Value</span>
              </div>
            </div>
            <p className="text-sm text-text-muted">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredCars.length)} of {filteredCars.length}
            </p>
          </div>
        </div>
      </section>

      {/* Cars Grid */}
      <section className="container py-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-text-secondary">Loading cars...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <Car className="h-16 w-16 mx-auto text-text-muted mb-4" />
            <h3 className="text-xl font-heading font-semibold text-text-primary mb-2">Failed to load cars</h3>
            <p className="text-text-secondary mb-6">{error instanceof Error ? error.message : 'Something went wrong'}</p>
            <Button variant="outline" onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        ) : paginatedCars.length > 0 ? (
          <>
            <div className={cn(
              'grid gap-6',
              viewMode === 'grid'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'grid-cols-1'
            )}>
              {paginatedCars.map((car) => (
                <ApiCarCard key={car.id} car={car} variant={viewMode === 'list' ? 'compact' : 'default'} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first, last, current, and pages around current
                    const showPage = page === 1 || page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1);
                    const showEllipsis = page === currentPage - 2 || page === currentPage + 2;

                    if (!showPage && !showEllipsis) return null;
                    if (showEllipsis) return <span key={page} className="px-2 text-text-muted">...</span>;

                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          'w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200',
                          page === currentPage
                            ? 'bg-primary text-white shadow-md'
                            : 'text-text-secondary hover:bg-surface hover:text-text-primary'
                        )}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <Car className="h-16 w-16 mx-auto text-text-muted mb-4" />
            <h3 className="text-xl font-heading font-semibold text-text-primary mb-2">No cars found</h3>
            <p className="text-text-secondary mb-6">Try adjusting your filters or search query</p>
            <Button variant="outline" onClick={clearFilters}>
              Clear All Filters
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
