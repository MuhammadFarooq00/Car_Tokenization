import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import {
  ArrowLeft, User, Coins, Package, ExternalLink, CheckCircle2,
  Share2, Heart, Clock, ChevronRight, TrendingUp, Shield, Verified,
  AlertCircle, Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useListing, useCalculateCost, useBuyFromListing } from '@/hooks/contracts/useMarketplace';
import { useCarConfig } from '@/hooks/contracts/useCarShares';
import { useCarMetadata } from '@/hooks/useCarMetadata';
import { formatEth, formatAddress, getIpfsUrl, formatNumber, parseContractError, cn } from '@/lib/utils';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { RequireWallet } from '@/components/wallet/RequireWallet';
import { useMarketplaceListing } from '@/hooks/api/useMarketplaceApi';
import { useCar } from '@/hooks/api/useCarsApi';
import { useReportListingFilled } from '@/hooks/api/useBlockchainReportApi';
import { useLikes } from '@/hooks/api/useLikes';

export function ListingDetail() {
  const { listingId } = useParams<{ listingId: string }>();
  const { address } = useAccount();

  const listingIdNum = parseInt(listingId || '0', 10);
  const listingIdBigInt = BigInt(listingId || '0');

  // Fetch from API for enrichment (car name for display fallback)
  const { data: apiListing } = useMarketplaceListing(listingIdNum);
  const apiCarId = apiListing?.carId ?? -1;
  const { data: apiCarData } = useCar(apiCarId);

  const { data: listing, isLoading, error, refetch } = useListing(listingIdBigInt);
  const { data: config } = useCarConfig(listing?.carId || 0n);
  const { data: metadata } = useCarMetadata(config?.metadataCID);

  const { isLiked, toggleLike } = useLikes();
  const [copied, setCopied] = useState(false);
  const carId = listing ? Number(listing.carId) : (apiCarId >= 0 ? apiCarId : 0);
  const liked = carId > 0 && isLiked(carId);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      if (navigator.share) navigator.share({ url });
    });
  };

  const [amount, setAmount] = useState('1');
  const amountBigInt = BigInt(amount || '0');

  const { data: costData } = useCalculateCost(listingIdBigInt, amountBigInt);
  const [baseCost, fee, totalRequired] = costData || [0n, 0n, 0n];

  const { execute, canExecute, simulateError, hash, isPending, isConfirming, isSuccess } = useBuyFromListing(
    listingIdBigInt,
    amountBigInt,
    totalRequired
  );

  const { mutateAsync: reportListingFilled } = useReportListingFilled();
  const dbSavedRef = useRef(false);

  // After successful purchase, save to DB immediately
  useEffect(() => {
    if (!isSuccess || !hash || dbSavedRef.current) return;
    dbSavedRef.current = true;

    const carId = listing ? Number(listing.carId) : (apiCarId >= 0 ? apiCarId : 0);
    reportListingFilled({
      txHash: hash,
      listingId: listingIdNum,
      amount: Number(amountBigInt),
      totalCost: totalRequired.toString(),
      carId,
    }).then(() => {
      console.log(`Listing #${listingIdNum} fill saved to DB`);
    }).catch((err: unknown) => {
      console.error('Failed to report listing fill to backend:', err);
    });
  }, [isSuccess, hash, listingIdNum, amountBigInt, totalRequired, listing, apiCarId, reportListingFilled]);

  if (isLoading) {
    return <LoadingState message="Loading listing details..." />;
  }

  if (error || !listing || !listing.active) {
    return (
      <ErrorState
        title="Listing not found"
        message="This listing doesn't exist or is no longer active"
        onRetry={refetch}
      />
    );
  }

  const imageUrl = metadata?.image ? getIpfsUrl(metadata.image) : '/placeholder-car.svg';
  const maxPurchase = Number(listing.amount);
  const isSeller = address?.toLowerCase() === listing.seller.toLowerCase();
  const totalListingValue = listing.amount * listing.pricePerShare;

  // Calculate price comparison to primary sale
  const priceCompare = config ? Number((listing.pricePerShare * 100n) / config.pricePerShare) - 100 : 0;
  const isPriceUp = priceCompare > 0;
  const isPriceDown = priceCompare < 0;

  const handleBuy = () => {
    execute();
  };

  const isValidAmount = amountBigInt > 0n && amountBigInt <= listing.amount;
  const canBuy = isValidAmount && canExecute && !isSeller;

  return (
    <div className="min-h-screen bg-background">
      {/* Back navigation */}
      <div className="container pb-0 pt-10">
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-accent transition-colors font-medium group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Marketplace
        </Link>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column - Image & Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-3 space-y-6"
          >
            {/* Main Image */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-background-elevated border border-border group">
              <img
                src={imageUrl}
                alt={metadata?.name || apiCarData?.name || `Car #${listing.carId}`}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Image overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

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

              {/* Top right actions */}
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={() => carId > 0 && toggleLike(carId)}
                  title={liked ? 'Remove from liked' : 'Add to liked'}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl backdrop-blur-md border transition-all duration-200 ${
                    liked
                      ? 'bg-error text-white border-error/50 shadow-lg shadow-error/30'
                      : 'bg-white/10 text-white border-white/20 hover:bg-error/80 hover:border-error/50'
                  }`}
                >
                  <Heart className={`h-5 w-5 transition-all duration-200 ${liked ? 'fill-white' : ''}`} />
                </button>
                <button
                  onClick={handleShare}
                  title={copied ? 'Link copied!' : 'Share this listing'}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl backdrop-blur-md border transition-all duration-200 ${
                    copied
                      ? 'bg-success text-white border-success/50'
                      : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                  }`}
                >
                  {copied ? <CheckCircle2 className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
                </button>
              </div>

              {/* Bottom info */}
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-md text-sm font-medium text-white border border-white/10">
                  <Clock className="h-4 w-4" />
                  Listed 2h ago
                </span>
              </div>
            </div>

            {/* Car Link */}
            <Link
              to={`/car/${listing.carId}`}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-surface border border-border text-primary hover:border-primary/50 font-medium transition-all group"
            >
              <ExternalLink className="h-4 w-4" />
              View Car Details
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            {/* Description */}
            {metadata?.description && (
              <div className="p-6 rounded-2xl bg-surface border border-border">
                <h3 className="font-heading font-semibold text-lg mb-3 text-text-primary">About this Car</h3>
                <p className="text-text-secondary leading-relaxed">{metadata.description}</p>
              </div>
            )}

            {/* Safety Info */}
            <div className="p-6 rounded-2xl bg-surface border border-border">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 shrink-0">
                  <Shield className="h-6 w-6 text-success" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-2 text-text-primary">Secure Transaction</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    This transaction is secured by smart contracts on the Ethereum blockchain.
                    Your shares will be transferred instantly upon successful payment.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Details & Buy */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Title Card */}
            <div className="p-6 rounded-2xl bg-surface border border-border">
              <h1 className="font-heading text-2xl md:text-3xl font-bold text-text-primary mb-4">
                {metadata?.name || apiCarData?.name || `Car #${listing.carId}`}
              </h1>

              {/* Seller Info */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-background-elevated border border-border/50">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 shrink-0">
                  <User className="h-6 w-6 text-accent" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-text-muted uppercase tracking-wide">Seller</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm text-text-primary truncate">
                      {formatAddress(listing.seller)}
                    </p>
                    <Verified className="h-4 w-4 text-primary shrink-0" />
                  </div>
                </div>
                {isSeller && (
                  <Badge variant="accent" className="shrink-0">You</Badge>
                )}
              </div>
            </div>

            {/* Listing Stats */}
            <div className="p-6 rounded-2xl bg-surface border border-border">
              <h3 className="font-heading font-semibold text-lg mb-4 text-text-primary">Listing Details</h3>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-background-elevated border border-border/50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                    <Coins className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Price/Share</p>
                    <p className="font-heading font-bold text-lg text-text-primary font-mono">
                      {formatEth(listing.pricePerShare)} ETH
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-background-elevated border border-border/50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 shrink-0">
                    <Package className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Available</p>
                    <p className="font-heading font-bold text-lg text-text-primary font-mono">
                      {formatNumber(Number(listing.amount))}
                    </p>
                  </div>
                </div>
              </div>

              {/* Price comparison */}
              {config && (isPriceUp || isPriceDown) && (
                <div className={cn(
                  'p-4 rounded-xl border mb-6',
                  isPriceDown ? 'bg-success/5 border-success/20' : 'bg-warning/5 border-warning/20'
                )}>
                  <div className="flex items-center gap-3">
                    <TrendingUp className={cn('h-5 w-5', isPriceDown ? 'text-success' : 'text-warning')} />
                    <div>
                      <p className={cn('text-sm font-medium', isPriceDown ? 'text-success' : 'text-warning')}>
                        {isPriceDown
                          ? `${Math.abs(priceCompare).toFixed(0)}% below primary sale price`
                          : `${priceCompare.toFixed(0)}% above primary sale price`
                        }
                      </p>
                      <p className="text-xs text-text-muted">
                        Primary: {formatEth(config.pricePerShare)} ETH/share
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="h-px bg-border mb-6" />

              {/* Total Value */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-text-secondary">
                  <Wallet className="h-5 w-5" />
                  <span className="font-medium">Total Listing Value</span>
                </div>
                <span className="font-heading text-2xl font-bold text-gradient-gold">
                  {formatEth(totalListingValue)} ETH
                </span>
              </div>
            </div>

            {/* Buy Section */}
            <div className="p-6 rounded-2xl bg-surface border border-border">
              <h3 className="font-heading font-bold text-lg mb-6 text-text-primary">Buy Shares</h3>

              {isSeller ? (
                <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-warning">This is your listing</p>
                    <p className="text-sm text-warning/80 mt-1">You cannot buy from your own listing.</p>
                  </div>
                </div>
              ) : (
                <RequireWallet>
                  <div className="space-y-5">
                    <div>
                      <Label htmlFor="amount" className="text-sm font-medium text-text-secondary">
                        Number of Shares
                      </Label>
                      <Input
                        id="amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min={1}
                        max={maxPurchase}
                        className="mt-2"
                        inputSize="lg"
                      />
                      <p className="text-xs text-text-muted mt-2">
                        Max: {formatNumber(maxPurchase)}
                      </p>
                    </div>

                    <div className="h-px bg-border" />

                    <div className="space-y-3 p-4 rounded-xl bg-background-elevated">
                      <div className="flex justify-between text-sm">
                        <span className="text-text-muted">Subtotal</span>
                        <span className="font-medium font-mono text-text-primary">{formatEth(baseCost)} ETH</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-muted">Platform Fee (2.5%)</span>
                        <span className="font-medium font-mono text-text-primary">{formatEth(fee)} ETH</span>
                      </div>
                      <div className="h-px bg-border" />
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-text-primary">Total</span>
                        <span className="font-heading font-bold text-xl text-gradient-gold">{formatEth(totalRequired)} ETH</span>
                      </div>
                    </div>

                    {simulateError && (
                      <div className="p-4 rounded-xl bg-error/10 border border-error/20">
                        <p className="text-sm text-error">
                          {parseContractError(simulateError)}
                        </p>
                      </div>
                    )}

                    {isSuccess && (
                      <div className="p-4 rounded-xl bg-success/10 border border-success/20 flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                        <p className="text-sm text-success">
                          Purchase successful! Shares have been added to your wallet.
                        </p>
                      </div>
                    )}

                    <Button
                      onClick={handleBuy}
                      disabled={!canBuy}
                      isLoading={isPending || isConfirming}
                      className="w-full"
                      size="lg"
                      variant="accent"
                    >
                      {isPending ? 'Confirming...' : isConfirming ? 'Processing...' : 'Buy Shares'}
                      <ChevronRight className="h-5 w-5 ml-2" />
                    </Button>
                  </div>
                </RequireWallet>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

