import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePortfolioSummary, usePortfolioHoldings } from '@/hooks/api/usePortfolioApi';
import { useMyListings, useMyTradeHistory } from '@/hooks/api/useMarketplaceApi';
import { useCancelListing } from '@/hooks/contracts/useMarketplace';
import { useCarMetadata } from '@/hooks/useCarMetadata';
import { formatEth, formatNumber, getIpfsUrl, weiToEth } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import type { ApiHolding, ApiMarketplaceListing } from '@/types/api';
import {
  Wallet, ShoppingBag, History, TrendingUp, ArrowRight, Briefcase,
  Package, Coins, Eye, MoreHorizontal, ChevronRight, Clock, DollarSign,
  PieChart, BarChart3, Loader2, XCircle, Tag,
  Zap, CheckCircle2, Pause, AlertCircle, UserCheck, UserX
} from 'lucide-react';
import { useReportListingCancelled } from '@/hooks/api/useBlockchainReportApi';

function HoldingCard({ holding }: { holding: ApiHolding }) {
  const { data: metadata } = useCarMetadata(holding.car.metadataCID);

  const imageUrl = metadata?.image ? getIpfsUrl(metadata.image) : '/placeholder-car.svg';
  const ownershipPercent = holding.car.totalShares > 0
    ? ((holding.shares / holding.car.totalShares) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="group"
    >
      <div className="overflow-hidden rounded-2xl border border-border bg-surface hover:border-primary/30 transition-all duration-300">
        <div className="flex flex-col md:flex-row">
          {/* Image */}
          <div className="relative w-full md:w-56 h-44 md:h-auto flex-shrink-0 bg-background-elevated">
            <img
              src={imageUrl}
              alt={holding.car.name || `Car #${holding.car.id}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-black/40" />

            {/* Ownership badge */}
            <div className="absolute top-3 left-3">
              <Badge variant="default" className="backdrop-blur-md bg-primary/20 border-primary/30">
                <PieChart className="h-3 w-3 mr-1" />
                {ownershipPercent.toFixed(1)}% Ownership
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-5 md:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-bold text-lg text-text-primary mb-1 group-hover:text-primary transition-colors">
                    {holding.car.name || `Car #${holding.car.id}`}
                  </h3>
                  <p className="text-sm text-text-secondary">
                    {holding.car.make} {holding.car.model} ({holding.car.year})
                  </p>
                  {/* Status badges */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {holding.car.status === 'active' && holding.car.primarySaleActive && (
                      <Badge variant="warning" className="text-xs gap-1">
                        <Zap className="h-3 w-3" />Sale Open
                      </Badge>
                    )}
                    {holding.car.status === 'active' && !holding.car.primarySaleActive && (
                      <Badge variant="success" className="text-xs gap-1">
                        <CheckCircle2 className="h-3 w-3" />On Road
                      </Badge>
                    )}
                    {holding.car.status === 'paused' && (
                      <Badge variant="accent" className="text-xs gap-1">
                        <Pause className="h-3 w-3" />Paused
                      </Badge>
                    )}
                    {holding.car.status === 'retired' && (
                      <Badge variant="default" className="text-xs gap-1">
                        <AlertCircle className="h-3 w-3" />Retired
                      </Badge>
                    )}
                    {/* Driver badge */}
                    {holding.car.assignedDriver ? (
                      <Badge variant="default" className="text-xs gap-1 bg-info/10 text-info border-info/20">
                        <UserCheck className="h-3 w-3" />
                        Driver: {holding.car.assignedDriver.user.name}
                      </Badge>
                    ) : (
                      <Badge variant="default" className="text-xs gap-1 bg-warning/10 text-warning border-warning/20">
                        <UserX className="h-3 w-3" />No Driver Assigned
                      </Badge>
                    )}
                  </div>
                </div>
                <button className="p-2 rounded-lg hover:bg-background-elevated transition-colors text-text-muted hover:text-text-primary shrink-0">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="p-3 rounded-xl bg-background-elevated/50 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="h-4 w-4 text-primary" />
                    <span className="text-xs text-text-muted">Shares</span>
                  </div>
                  <p className="font-heading font-bold text-text-primary font-mono">
                    {formatNumber(holding.shares)}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-background-elevated/50 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Coins className="h-4 w-4 text-accent" />
                    <span className="text-xs text-text-muted">Per Share</span>
                  </div>
                  <p className="font-heading font-bold text-text-primary font-mono">
                    {formatEth(BigInt(holding.car.pricePerShare))}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-background-elevated/50 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="h-4 w-4 text-success" />
                    <span className="text-xs text-text-muted">Value</span>
                  </div>
                  <p className="font-heading font-bold text-gradient font-mono">
                    {formatEth(BigInt(holding.value))}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link to={`/car/${holding.car.id}`} className="inline-flex items-center justify-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>View Details</span>
                </Link>
              </Button>
              <Button asChild variant="glow" size="sm" className="flex-1">
                <Link to={`/sell/${holding.car.id}`} className="inline-flex items-center justify-center gap-2">
                  <span>Sell Shares</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function HoldingsTab() {
  const { data: holdings, isLoading } = usePortfolioHoldings();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!holdings || holdings.length === 0 ? (
        <EmptyState
          icon={<Wallet className="h-10 w-10 text-primary" />}
          iconBg="from-primary/10 to-accent/10"
          title="No Holdings Yet"
          description="Start investing in tokenized vehicles and build your automotive portfolio. Browse our collection of premium cars to get started."
          action={
            <Button asChild variant="glow">
              <Link to="/discover" className="inline-flex items-center gap-2">
                <span>Browse Cars</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          }
        />
      ) : (
        holdings.map((holding) => <HoldingCard key={holding.car.id} holding={holding} />)
      )}
    </div>
  );
}

function ListingCard({ listing }: { listing: ApiMarketplaceListing }) {
  const metadataCID = listing.car?.metadataCID;
  const { data: metadata } = useCarMetadata(metadataCID);
  const { cancelListing, hash, isPending, isConfirming, isSuccess } = useCancelListing();
  const { mutateAsync: reportCancelled } = useReportListingCancelled();
  const dbSavedRef = useRef(false);

  // After cancel tx confirms, report to backend
  useEffect(() => {
    if (!isSuccess || !hash || dbSavedRef.current) return;
    dbSavedRef.current = true;

    reportCancelled({
      txHash: hash,
      listingId: listing.listingId,
    }).then(() => {
      console.log(`Listing #${listing.listingId} cancellation saved to DB`);
    }).catch((err: unknown) => {
      console.error('Failed to report listing cancellation to backend:', err);
    });
  }, [isSuccess, hash, listing.listingId, reportCancelled]);

  const imageUrl = metadata?.image ? getIpfsUrl(metadata.image) : '/placeholder-car.svg';
  const carName = listing.car?.name || metadata?.name || `Car #${listing.carId}`;
  const pricePerShareWei = BigInt(listing.pricePerShare);
  const totalValue = pricePerShareWei * BigInt(listing.amount);

  if (isSuccess) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="group"
    >
      <div className="overflow-hidden rounded-2xl border border-border bg-surface hover:border-accent/30 transition-all duration-300">
        <div className="flex flex-col md:flex-row">
          <div className="relative w-full md:w-56 h-44 md:h-auto flex-shrink-0 bg-background-elevated">
            <img
              src={imageUrl}
              alt={carName}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-car.svg'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-black/40" />
            <div className="absolute top-3 left-3">
              <Badge variant="default" className="backdrop-blur-md bg-accent/20 border-accent/30">
                <Tag className="h-3 w-3 mr-1" />
                Active Listing
              </Badge>
            </div>
            <div className="absolute top-3 right-3">
              <Badge variant="default" className="backdrop-blur-md bg-black/40 border-white/20">
                #{listing.listingId}
              </Badge>
            </div>
          </div>

          <div className="flex-1 p-5 md:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-heading font-bold text-lg text-text-primary mb-1 group-hover:text-accent transition-colors">
                    {carName}
                  </h3>
                  <p className="text-sm text-text-secondary">
                    Listing #{listing.listingId} &middot; Selling {listing.amount} shares
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="p-3 rounded-xl bg-background-elevated/50 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="h-4 w-4 text-accent" />
                    <span className="text-xs text-text-muted">Shares Listed</span>
                  </div>
                  <p className="font-heading font-bold text-text-primary font-mono">
                    {formatNumber(listing.amount)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-background-elevated/50 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Coins className="h-4 w-4 text-primary" />
                    <span className="text-xs text-text-muted">Price/Share</span>
                  </div>
                  <p className="font-heading font-bold text-text-primary font-mono">
                    {formatEth(pricePerShareWei)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-background-elevated/50 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="h-4 w-4 text-success" />
                    <span className="text-xs text-text-muted">Total Value</span>
                  </div>
                  <p className="font-heading font-bold text-gradient font-mono">
                    {formatEth(totalValue)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link to={`/car/${listing.carId}`} className="inline-flex items-center justify-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>View Car</span>
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50"
                onClick={() => cancelListing(BigInt(listing.listingId))}
                disabled={isPending || isConfirming}
              >
                {isPending || isConfirming ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{isConfirming ? 'Confirming...' : 'Cancelling...'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center gap-2">
                    <XCircle className="h-4 w-4" />
                    <span>Cancel Listing</span>
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ListingsTab() {
  const { data: listingsData, isLoading } = useMyListings();
  const myListings = listingsData?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (myListings.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="h-10 w-10 text-accent" />}
        iconBg="from-accent/10 to-warning/10"
        title="No Active Listings"
        description="You haven't listed any shares for sale yet. Visit your holdings to create a listing and start earning from the secondary market."
        action={
          <Button asChild variant="outline">
            <Link to="/portfolio" className="inline-flex items-center gap-2">
              <span>View Your Holdings</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {myListings.map((listing) => (
        <ListingCard key={listing.listingId} listing={listing} />
      ))}
    </div>
  );
}

function HistoryTab() {
  const { data: tradeHistory, isLoading } = useMyTradeHistory();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tradeHistory?.data || tradeHistory.data.length === 0) {
    return (
      <EmptyState
        icon={<History className="h-10 w-10 text-info" />}
        iconBg="from-info/10 to-primary/10"
        title="No Transaction History"
        description="Your transaction history will appear here once you start trading. Buy your first shares to begin building your portfolio."
        action={
          <Button asChild variant="outline">
            <Link to="/discover" className="inline-flex items-center gap-2">
              <span>Start Trading</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />
    );
  }

  const typeLabels: Record<string, string> = {
    car_created: 'Car Created',
    primary_purchase: 'Primary Purchase',
    listing_created: 'Listing Created',
    listing_filled: 'Listing Filled',
    listing_cancelled: 'Listing Cancelled',
  };

  const typeColors: Record<string, string> = {
    car_created: 'text-blue-400',
    primary_purchase: 'text-primary',
    listing_created: 'text-accent',
    listing_filled: 'text-success',
    listing_cancelled: 'text-text-muted',
  };

  return (
    <div className="space-y-3">
      {tradeHistory.data.map((tx) => (
        <motion.div
          key={tx.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-border hover:border-primary/30 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <History className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className={`font-heading font-semibold ${typeColors[tx.type] || 'text-text-primary'}`}>
                {typeLabels[tx.type] || tx.type}
              </p>
              <p className="text-sm text-text-muted">
                Car #{tx.carId} &middot; {tx.amount} shares &middot; {new Date(tx.timestamp).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-heading font-bold font-mono text-text-primary">
              {weiToEth(tx.price)} ETH
            </p>
            <a
              href={`https://etherscan.io/tx/${tx.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              View Tx
            </a>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

interface EmptyStateProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}

function EmptyState({ icon, iconBg, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${iconBg} mb-6`}>
        {icon}
      </div>
      <h3 className="font-heading text-xl font-bold text-text-primary mb-2">{title}</h3>
      <p className="text-text-secondary max-w-md mb-8 leading-relaxed">{description}</p>
      {action}
    </div>
  );
}

export function Portfolio() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'holdings';
  const { data: portfolioData } = usePortfolioSummary();
  const { data: listingsData } = useMyListings();
  const activeListingsCount = listingsData?.data?.length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header Section */}
      <section className="relative py-16 lg:py-20 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

        <div className="container relative">
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
              <Briefcase className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Your Portfolio</span>
            </motion.div>

            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-4">
              Manage Your{' '}
              <span className="text-gradient">Investments</span>
            </h1>
            <p className="text-lg md:text-xl text-text-secondary leading-relaxed max-w-2xl">
              Track your car share holdings, manage active listings, and review your complete transaction history.
            </p>
          </motion.div>

          {/* Quick Stats - shown for all logged in users, no wallet needed */}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              <div className="p-5 rounded-2xl bg-surface border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm text-text-muted">Total Holdings</span>
                </div>
                <p className="font-heading text-2xl font-bold text-text-primary font-mono">{portfolioData?.totalCarsInvested ?? 0}</p>
              </div>

              <div className="p-5 rounded-2xl bg-surface border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                    <BarChart3 className="h-5 w-5 text-accent" />
                  </div>
                  <span className="text-sm text-text-muted">Portfolio Value</span>
                </div>
                <p className="font-heading text-2xl font-bold text-gradient-gold font-mono">{portfolioData ? weiToEth(portfolioData.totalValue) : '0'} ETH</p>
              </div>

              <div className="p-5 rounded-2xl bg-surface border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
                    <TrendingUp className="h-5 w-5 text-success" />
                  </div>
                  <span className="text-sm text-text-muted">Total Earnings</span>
                </div>
                <p className="font-heading text-2xl font-bold text-success font-mono">+{portfolioData ? weiToEth(portfolioData.totalDividends) : '0'} ETH</p>
              </div>

              <div className="p-5 rounded-2xl bg-surface border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10">
                    <Clock className="h-5 w-5 text-info" />
                  </div>
                  <span className="text-sm text-text-muted">Active Listings</span>
                </div>
                <p className="font-heading text-2xl font-bold text-text-primary font-mono">{activeListingsCount}</p>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Content - no wallet requirement, uses DB data */}
      <section className="container py-12">
        <Tabs defaultValue={initialTab} className="w-full" onValueChange={(v) => setSearchParams({ tab: v }, { replace: true })}>
          <TabsList className="mb-8 p-1 bg-surface border border-border">
            <TabsTrigger value="holdings" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <Wallet className="h-4 w-4" />
              Holdings
            </TabsTrigger>
            <TabsTrigger value="listings" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <TrendingUp className="h-4 w-4" />
              Active Listings
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <History className="h-4 w-4" />
              Transaction History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="holdings">
            <HoldingsTab />
          </TabsContent>

          <TabsContent value="listings">
            <ListingsTab />
          </TabsContent>

          <TabsContent value="history">
            <HistoryTab />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
