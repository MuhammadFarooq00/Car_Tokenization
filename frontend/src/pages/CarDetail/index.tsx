import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import {
  ArrowLeft, User, Coins, Package, TrendingUp, CheckCircle2,
  Share2, Heart, Wallet, Info, ChevronRight, Sparkles, Users,
  Calendar, Gauge, Fuel, MapPin, Check
} from 'lucide-react';
import { useLikes } from '@/hooks/api/useLikes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCarConfig, useGlobalFeeBps, useBuyPrimary, useBalanceOf } from '@/hooks/contracts/useCarShares';
import { useCarMetadata } from '@/hooks/useCarMetadata';
import { formatEth, formatAddress, getIpfsUrl, formatNumber, calculateTotalCost, parseContractError, weiToEth } from '@/lib/utils';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { RequireWallet } from '@/components/wallet/RequireWallet';
import { useCar } from '@/hooks/api/useCarsApi';
import { useReportPrimaryPurchase } from '@/hooks/api/useBlockchainReportApi';
import type { ApiCar } from '@/types/api';

export function CarDetail() {
  const { carId } = useParams<{ carId: string }>();
  const carIdNum = parseInt(carId || '0', 10);
  const carIdBigInt = BigInt(carId || '0');
  const { address } = useAccount();

  // Fetch car data from API
  const { data: apiCar, isLoading: apiLoading } = useCar(carIdNum);

  // Try to get contract data first
  const { data: config, isLoading: configLoading, refetch } = useCarConfig(carIdBigInt);
  const { data: metadata } = useCarMetadata(config?.metadataCID);
  const { data: feeBps } = useGlobalFeeBps();
  const { data: userBalance } = useBalanceOf(address, carIdBigInt);

  const [amount, setAmount] = useState('1');
  const amountBigInt = BigInt(amount || '0');
  const pricePerShare = config?.pricePerShare || 0n;
  const { baseCost, fee, total } = calculateTotalCost(amountBigInt, pricePerShare, Number(feeBps || 250n));

  const { execute, canExecute, simulateError, hash, isPending, isConfirming, isSuccess } = useBuyPrimary(
    carIdBigInt,
    amountBigInt,
    total
  );

  // If loading
  if (configLoading || apiLoading) {
    return <LoadingState message="Loading car details..." />;
  }

  // If we have contract data, use it
  if (config && config.totalSupply > 0n) {
    return <ContractCarDetail
      carId={carId!}
      carIdNum={carIdNum}
      config={config}
      metadata={metadata}
      userBalance={userBalance}
      address={address}
      amount={amount}
      setAmount={setAmount}
      amountBigInt={amountBigInt}
      baseCost={baseCost}
      fee={fee}
      total={total}
      hash={hash}
      execute={execute}
      canExecute={canExecute}
      simulateError={simulateError}
      isPending={isPending}
      isConfirming={isConfirming}
      isSuccess={isSuccess}
      dbSharesDistributed={apiCar?.sharesDistributed}
    />;
  }

  // Otherwise, try API data as fallback
  if (apiCar) {
    return <ApiCarDetail car={apiCar} />;
  }

  // No data found
  return (
    <ErrorState
      title="Car not found"
      message="This car doesn't exist or has been removed"
      onRetry={refetch}
    />
  );
}

// ─── Shared Like + Share buttons ──────────────────────────────────────────────

function CarActionButtons({ carId }: { carId: number }) {
  const { isLiked, toggleLike } = useLikes();
  const [copied, setCopied] = useState(false);
  const liked = isLiked(carId);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // Fallback: open native share if available
      if (navigator.share) {
        navigator.share({ url });
      }
    });
  };

  return (
    <div className="absolute top-4 right-4 flex gap-2">
      <button
        onClick={() => toggleLike(carId)}
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
        title={copied ? 'Link copied!' : 'Share this car'}
        className={`flex h-10 w-10 items-center justify-center rounded-xl backdrop-blur-md border transition-all duration-200 ${
          copied
            ? 'bg-success text-white border-success/50'
            : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
        }`}
      >
        {copied ? <Check className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
      </button>
    </div>
  );
}

// API Car Detail Component (fallback when no on-chain data)
function ApiCarDetail({ car }: { car: ApiCar }) {
  const { data: carMetadata } = useCarMetadata(car.metadataCID);
  const carImageUrl = carMetadata?.image ? getIpfsUrl(carMetadata.image) : '/placeholder-car.svg';
  const priceEth = weiToEth(car.pricePerShare);
  const totalValueEth = weiToEth((BigInt(car.pricePerShare) * BigInt(car.totalShares)).toString());
  const isSaleActive = car.status === 'active';

  return (
    <div className="min-h-screen bg-background">
      {/* Back navigation */}
      <div className="container pt-6">
        <Link
          to="/discover"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-primary transition-colors font-medium group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Discover
        </Link>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-3 space-y-6"
          >
            {/* Main Image */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-background-elevated border border-border group">
              <img
                src={carImageUrl}
                alt={car.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-car.svg'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              <div className="absolute top-4 left-4">
                <Badge
                  variant={isSaleActive ? 'success' : 'secondary'}
                  dot={isSaleActive}
                  dotColor="success"
                  className="backdrop-blur-md"
                >
                  {isSaleActive ? 'Active Sale' : car.status === 'paused' ? 'Paused' : 'Retired'}
                </Badge>
              </div>

              <CarActionButtons carId={car.id} />

              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-md text-sm font-medium text-white border border-white/10">{car.year}</span>
                  <span className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-md text-sm font-medium text-white border border-white/10">{car.make}</span>
                  <span className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-md text-sm font-medium text-white border border-white/10">{car.model}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="p-6 rounded-2xl bg-surface border border-border">
              <h3 className="font-heading font-semibold text-lg mb-3 text-text-primary">About this Car</h3>
              <p className="text-text-secondary leading-relaxed">
                {car.make} {car.model} ({car.year}) - A premium vehicle available for fractional ownership through tokenized shares on the blockchain.
              </p>
            </div>
          </motion.div>

          {/* Right Column - Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Title & Status */}
            <div className="p-6 rounded-2xl bg-surface border border-border">
              <h1 className="font-heading text-2xl md:text-3xl font-bold text-text-primary mb-3">
                {car.name}
              </h1>
              <p className="text-sm text-text-secondary">
                {car.make} {car.model} &middot; {car.year}
              </p>
            </div>

            {/* Stats Card */}
            <div className="p-6 rounded-2xl bg-surface border border-border">
              <h3 className="font-heading font-semibold text-lg mb-4 text-text-primary">Investment Details</h3>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-background-elevated border border-border/50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                    <Coins className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Price/Share</p>
                    <p className="font-heading font-bold text-lg text-text-primary font-mono">
                      {priceEth} ETH
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-background-elevated border border-border/50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 shrink-0">
                    <Package className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Total Shares</p>
                    <p className="font-heading font-bold text-lg text-text-primary font-mono">
                      {formatNumber(car.totalShares)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-border">
                <span className="text-text-secondary font-medium">Total Value</span>
                <span className="font-heading text-2xl font-bold text-gradient-gold">{totalValueEth} ETH</span>
              </div>
            </div>

            {/* CTA */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 text-center">
              <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-heading font-bold text-lg text-text-primary mb-2">
                {isSaleActive ? 'Connect Wallet to Buy' : 'Sale Not Active'}
              </h3>
              <p className="text-text-secondary text-sm mb-4">
                {isSaleActive
                  ? 'Connect your wallet and buy shares directly from the blockchain.'
                  : 'Check the marketplace for secondary listings.'}
              </p>
              <Button asChild variant={isSaleActive ? 'glow' : 'outline'}>
                <Link to={isSaleActive ? '/discover' : '/marketplace'}>
                  {isSaleActive ? 'Browse Cars' : 'View Marketplace'}
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Contract Car Detail Component (original implementation)
function ContractCarDetail({
  carId,
  carIdNum,
  config,
  metadata,
  userBalance,
  address,
  amount,
  setAmount,
  amountBigInt,
  baseCost,
  fee,
  total,
  hash,
  execute,
  canExecute,
  simulateError,
  isPending,
  isConfirming,
  isSuccess,
  dbSharesDistributed,
}: any) {
  const { mutateAsync: reportPurchase } = useReportPrimaryPurchase();
  const dbSavedRef = useRef(false);

  // After successful primary purchase, save to DB immediately
  useEffect(() => {
    if (!isSuccess || !hash || dbSavedRef.current) return;
    dbSavedRef.current = true;

    reportPurchase({
      txHash: hash,
      carId: carIdNum,
      amount: Number(amountBigInt),
      totalCost: total.toString(),
    }).then(() => {
      console.log(`Primary purchase saved to DB: carId=${carIdNum}, amount=${Number(amountBigInt)}`);
    }).catch((err: unknown) => {
      console.error('Failed to report primary purchase to backend:', err);
    });
  }, [isSuccess, hash, carIdNum, amountBigInt, total, reportPurchase]);

  const imageUrl = metadata?.image ? getIpfsUrl(metadata.image) : '/placeholder-car.svg';
  // Use DB sharesDistributed (owner allocation + all buyers) if available; fallback to on-chain sharesSold
  const totalDistributed = dbSharesDistributed != null
    ? BigInt(dbSharesDistributed)
    : config.sharesSold;
  const soldPercent = config.totalSupply > 0n
    ? Number((totalDistributed * 100n) / config.totalSupply)
    : 0;
  const minPurchase = Number(config.minPrimaryBuy);
  const maxPurchase = Number(config.remainingPublicSupply);

  const handleBuy = () => {
    execute();
  };

  const isValidAmount = amountBigInt >= config.minPrimaryBuy && amountBigInt <= config.remainingPublicSupply;
  const canBuy = config.primarySaleActive && isValidAmount && canExecute;

  // Extract attributes from metadata
  const getAttribute = (traitType: string) => {
    return metadata?.attributes?.find((attr: { trait_type: string }) => attr.trait_type === traitType)?.value;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Back navigation */}
      <div className="container pt-6">
        <Link
          to="/discover"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-primary transition-colors font-medium group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Discover
        </Link>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column - Image & Attributes */}
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
                alt={metadata?.name || `Car #${carId}`}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Image overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Top actions */}
              <CarActionButtons carId={carIdNum} />

              {/* Bottom info */}
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                <div className="flex flex-wrap gap-2">
                  {getAttribute('Year') && (
                    <span className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-md text-sm font-medium text-white border border-white/10">
                      {getAttribute('Year')}
                    </span>
                  )}
                  {getAttribute('Make') && (
                    <span className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-md text-sm font-medium text-white border border-white/10">
                      {getAttribute('Make')}
                    </span>
                  )}
                  {getAttribute('Model') && (
                    <span className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-md text-sm font-medium text-white border border-white/10">
                      {getAttribute('Model')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Attributes Grid */}
            {metadata?.attributes && metadata.attributes.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {metadata.attributes.map((attr: { trait_type: string; value: string | number }) => {
                  const iconMap: Record<string, React.ReactNode> = {
                    'Year': <Calendar className="h-4 w-4 text-primary" />,
                    'Make': <Sparkles className="h-4 w-4 text-accent" />,
                    'Model': <Gauge className="h-4 w-4 text-success" />,
                    'Mileage': <MapPin className="h-4 w-4 text-warning" />,
                    'Fuel Type': <Fuel className="h-4 w-4 text-info" />,
                    'Color': <div className="h-4 w-4 rounded-full bg-gradient-to-r from-primary to-accent" />,
                  };

                  return (
                    <div
                      key={attr.trait_type}
                      className="flex items-center gap-3 p-4 rounded-xl bg-surface border border-border hover:border-primary/30 transition-colors"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background-elevated">
                        {iconMap[attr.trait_type] || <Info className="h-4 w-4 text-text-muted" />}
                      </div>
                      <div>
                        <p className="text-xs text-text-muted uppercase tracking-wide">{attr.trait_type}</p>
                        <p className="font-semibold text-text-primary">{attr.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Description */}
            {metadata?.description && (
              <div className="p-6 rounded-2xl bg-surface border border-border">
                <h3 className="font-heading font-semibold text-lg mb-3 text-text-primary">About this Car</h3>
                <p className="text-text-secondary leading-relaxed">{metadata.description}</p>
              </div>
            )}
          </motion.div>

          {/* Right Column - Details & Buy */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Title & Status */}
            <div className="p-6 rounded-2xl bg-surface border border-border">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="font-heading text-2xl md:text-3xl font-bold text-text-primary mb-3">
                    {metadata?.name || `Car #${carId}`}
                  </h1>
                  <div className="flex items-center gap-2 text-text-secondary">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10">
                      <User className="h-4 w-4 text-accent" />
                    </div>
                    <span className="text-sm font-mono">{formatAddress(config.owner)}</span>
                  </div>
                </div>
                {config.primarySaleActive ? (
                  <Badge variant="success" dot dotColor="success" className="shrink-0">
                    Active Sale
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="shrink-0">Sale Ended</Badge>
                )}
              </div>
            </div>

            {/* Stats Card */}
            <div className="p-6 rounded-2xl bg-surface border border-border">
              <h3 className="font-heading font-semibold text-lg mb-4 text-text-primary">Sale Statistics</h3>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-background-elevated border border-border/50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                    <Coins className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Price/Share</p>
                    <p className="font-heading font-bold text-lg text-text-primary font-mono">
                      {formatEth(config.pricePerShare)} ETH
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-background-elevated border border-border/50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 shrink-0">
                    <Package className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Total Shares</p>
                    <p className="font-heading font-bold text-lg text-text-primary font-mono">
                      {formatNumber(Number(config.totalSupply))}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-background-elevated border border-border/50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 shrink-0">
                    <TrendingUp className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Available</p>
                    <p className="font-heading font-bold text-lg text-text-primary font-mono">
                      {formatNumber(Number(config.remainingPublicSupply))}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-background-elevated border border-border/50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info/10 shrink-0">
                    <Users className="h-6 w-6 text-info" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Distributed</p>
                    <p className="font-heading font-bold text-lg text-text-primary font-mono">
                      {soldPercent.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Section */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Share Distribution</span>
                  <span className="text-text-secondary font-mono">
                    {formatNumber(Number(totalDistributed))} / {formatNumber(Number(config.totalSupply))}
                  </span>
                </div>
                <div className="h-3 bg-background-tertiary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${soldPercent}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="h-full bg-gradient-to-r from-primary via-primary-hover to-accent rounded-full"
                    style={{ boxShadow: '0 0 12px rgba(14, 165, 233, 0.5)' }}
                  />
                </div>
              </div>
            </div>

            {/* Your Holdings */}
            {address && userBalance !== undefined && userBalance > 0n && (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                      <Wallet className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-text-primary">Your Holdings</h3>
                      <p className="text-sm text-text-secondary">You own shares of this car</p>
                    </div>
                  </div>
                  <p className="font-heading text-3xl font-bold text-gradient">
                    {formatNumber(Number(userBalance))}
                  </p>
                </div>
              </div>
            )}

            {/* Buy Section */}
            {config.primarySaleActive && (
              <div className="p-6 rounded-2xl bg-surface border border-border">
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="font-heading font-bold text-lg text-text-primary">Buy Shares</h3>
                </div>

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
                        min={minPurchase}
                        max={maxPurchase}
                        className="mt-2"
                        inputSize="lg"
                      />
                      <p className="text-xs text-text-muted mt-2">
                        Min: {minPurchase} | Max: {formatNumber(maxPurchase)}
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
                        <span className="font-heading font-bold text-xl text-gradient-gold">{formatEth(total)} ETH</span>
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
                      variant="glow"
                    >
                      {isPending ? 'Confirming...' : isConfirming ? 'Processing...' : 'Buy Shares'}
                      <ChevronRight className="h-5 w-5 ml-2" />
                    </Button>
                  </div>
                </RequireWallet>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
