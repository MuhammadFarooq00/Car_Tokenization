import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAccount, usePublicClient } from 'wagmi';
import { decodeEventLog } from 'viem';
import {
  ArrowLeft, Check, Tag, Coins, Shield, ChevronRight, Package,
  AlertCircle, Wallet, TrendingUp, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RequireWallet } from '@/components/wallet/RequireWallet';
import { useBalanceOf, useCarConfig, useIsApprovedForAll, useSetApprovalForAll } from '@/hooks/contracts/useCarShares';
import { useCreateListing, useMarketplaceContractAddress } from '@/hooks/contracts/useMarketplace';
import { MarketplaceABI } from '@/contracts/abis/Marketplace';
import { useCarMetadata } from '@/hooks/useCarMetadata';
import { formatEth, formatNumber, getIpfsUrl, parseEth, parseContractError } from '@/lib/utils';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useReportListingCreated } from '@/hooks/api/useBlockchainReportApi';

export function SellShares() {
  const { carId } = useParams<{ carId: string }>();
  const carIdBigInt = BigInt(carId || '0');
  const navigate = useNavigate();
  const { address } = useAccount();

  const marketplaceAddress = useMarketplaceContractAddress();

  const { data: balance, isLoading: balanceLoading } = useBalanceOf(address, carIdBigInt);
  const { data: config, isLoading: configLoading } = useCarConfig(carIdBigInt);
  const { data: metadata } = useCarMetadata(config?.metadataCID);
  const { data: isApproved, refetch: refetchApproval } = useIsApprovedForAll(address, marketplaceAddress);

  const { setApproval, isPending: approvalPending, isConfirming: approvalConfirming, isSuccess: approvalSuccess } = useSetApprovalForAll();
  const { createListing, hash, isPending, isConfirming, isSuccess, error } = useCreateListing();
  const publicClient = usePublicClient();
  const { mutateAsync: reportListingCreated } = useReportListingCreated();

  const [amount, setAmount] = useState('');
  const [pricePerShare, setPricePerShare] = useState('');
  const dbSavedRef = useRef(false);

  useEffect(() => {
    if (approvalSuccess) {
      refetchApproval();
    }
  }, [approvalSuccess, refetchApproval]);

  // After listing tx confirms, decode ListingCreated event and save to DB
  useEffect(() => {
    if (!isSuccess || !hash || !publicClient || dbSavedRef.current) return;
    dbSavedRef.current = true;

    const saveToDb = async () => {
      try {
        const receipt = await publicClient.getTransactionReceipt({ hash });

        // Decode ListingCreated event to get the on-chain listingId
        let listingId: number | null = null;
        for (const log of receipt.logs) {
          try {
            const decoded = decodeEventLog({
              abi: MarketplaceABI,
              data: log.data,
              topics: log.topics,
            });
            if (decoded.eventName === 'ListingCreated') {
              listingId = Number((decoded.args as { listingId: bigint }).listingId);
              break;
            }
          } catch {
            // Not a ListingCreated event, skip
          }
        }

        if (listingId === null) {
          console.error('Could not find ListingCreated event in tx receipt');
          return;
        }

        await reportListingCreated({
          txHash: hash,
          listingId,
          carId: Number(carIdBigInt),
          amount: Number(BigInt(amount || '0')),
          pricePerShare: parseEth(pricePerShare).toString(),
        });

        console.log(`Listing #${listingId} saved to DB`);
      } catch (err) {
        console.error('Failed to report listing creation to backend:', err);
      }
    };

    saveToDb();
  }, [isSuccess, hash, publicClient, carIdBigInt, amount, pricePerShare, reportListingCreated]);

  const isLoading = balanceLoading || configLoading;

  if (!address) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RequireWallet><div /></RequireWallet>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingState message="Loading..." />;
  }

  if (!balance || balance === 0n) {
    return (
      <ErrorState
        title="No shares to sell"
        message="You don't own any shares of this car"
        onRetry={() => navigate('/portfolio')}
      />
    );
  }

  const imageUrl = metadata?.image ? getIpfsUrl(metadata.image) : '/placeholder-car.svg';
  const amountBigInt = BigInt(amount || '0');
  const pricePerShareBigInt = parseEth(pricePerShare);
  const totalValue = amountBigInt * pricePerShareBigInt;

  const isValidAmount = amountBigInt > 0n && amountBigInt <= balance;
  const isValidPrice = pricePerShareBigInt > 0n;
  const needsApproval = !isApproved;

  const handleApprove = () => {
    if (marketplaceAddress) {
      setApproval(marketplaceAddress, true);
    }
  };

  const handleCreateListing = () => {
    if (isValidAmount && isValidPrice) {
      createListing(carIdBigInt, amountBigInt, pricePerShareBigInt);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-12">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg mx-auto text-center"
          >
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-success/20 to-emerald-500/20 mx-auto mb-8 border border-success/20">
              <Check className="h-12 w-12 text-success" />
            </div>
            <h1 className="font-heading text-3xl font-bold text-text-primary mb-4">
              Listing Created!
            </h1>
            <p className="text-text-secondary mb-10 leading-relaxed max-w-md mx-auto">
              Your shares are now listed on the marketplace and available for purchase by other investors.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate('/marketplace')} variant="glow" size="lg">
                View Marketplace
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/portfolio')}>
                Back to Portfolio
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Back navigation */}
      <div className="container pt-6">
        <Link
          to="/portfolio"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-accent transition-colors font-medium group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Portfolio
        </Link>
      </div>

      <div className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6"
            >
              <Tag className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-accent">Create Listing</span>
            </motion.div>

            <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-3">
              Sell Your <span className="text-gradient-gold">Shares</span>
            </h1>
            <p className="text-text-secondary text-lg">
              List your shares on the secondary marketplace for other investors
            </p>
          </div>

          <RequireWallet>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Car Info Card */}
              <div className="rounded-2xl border border-border bg-surface overflow-hidden">
                <div className="relative aspect-video bg-background-elevated">
                  <img
                    src={imageUrl}
                    alt={metadata?.name || `Car #${carId}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <Badge variant="default" className="backdrop-blur-md bg-primary/20 border-primary/30">
                      Your Holding
                    </Badge>
                  </div>
                </div>

                <div className="p-6">
                  <h2 className="font-heading font-bold text-xl text-text-primary mb-4">
                    {metadata?.name || `Car #${carId}`}
                  </h2>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-background-elevated border border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Wallet className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-text-secondary">Your Balance</span>
                      </div>
                      <span className="font-heading font-bold text-lg text-text-primary font-mono">
                        {formatNumber(Number(balance))} shares
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-background-elevated border border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                          <Coins className="h-5 w-5 text-accent" />
                        </div>
                        <span className="text-text-secondary">Primary Price</span>
                      </div>
                      <span className="font-heading font-semibold text-text-primary font-mono">
                        {formatEth(config?.pricePerShare || 0n)} ETH
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-background-elevated border border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                          <TrendingUp className="h-5 w-5 text-success" />
                        </div>
                        <span className="text-text-secondary">Current Value</span>
                      </div>
                      <span className="font-heading font-bold text-lg text-gradient font-mono">
                        {formatEth(balance * (config?.pricePerShare || 0n))} ETH
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Listing Form Card */}
              <div className="rounded-2xl border border-border bg-surface p-6">
                <h2 className="font-heading font-bold text-xl text-text-primary mb-6">Listing Details</h2>

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="amount" className="text-text-secondary">Shares to Sell</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min={1}
                      max={Number(balance)}
                      className="mt-2"
                      inputSize="lg"
                      placeholder="Enter amount"
                      leftIcon={<Package className="h-5 w-5" />}
                    />
                    <p className="text-xs text-text-muted mt-2">
                      Max: {formatNumber(Number(balance))} shares
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="price" className="text-text-secondary">Price per Share (ETH)</Label>
                    <Input
                      id="price"
                      value={pricePerShare}
                      onChange={(e) => setPricePerShare(e.target.value)}
                      placeholder="0.01"
                      className="mt-2"
                      inputSize="lg"
                      leftIcon={<Coins className="h-5 w-5" />}
                    />
                  </div>

                  <div className="h-px bg-border" />

                  {/* Summary */}
                  <div className="p-4 rounded-xl bg-background-elevated border border-border/50 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Total Value</span>
                      <span className="font-heading font-bold text-xl text-gradient-gold">
                        {formatEth(totalValue)} ETH
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted flex items-center gap-1">
                        <Info className="h-3.5 w-3.5" />
                        Platform Fee (2.5%)
                      </span>
                      <span className="text-text-secondary">Paid by buyer</span>
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 rounded-xl bg-error/10 border border-error/20 flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-error shrink-0 mt-0.5" />
                      <p className="text-sm text-error">
                        {parseContractError(error)}
                      </p>
                    </div>
                  )}

                  {needsApproval ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 flex items-start gap-3">
                        <Shield className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-warning">Approval Required</p>
                          <p className="text-sm text-warning/80 mt-1">
                            You need to approve the marketplace to transfer your shares before creating a listing.
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={handleApprove}
                        isLoading={approvalPending || approvalConfirming}
                        className="w-full"
                        size="lg"
                        variant="glow"
                      >
                        <Shield className="h-5 w-5 mr-2" />
                        Approve Marketplace
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={handleCreateListing}
                      disabled={!isValidAmount || !isValidPrice}
                      isLoading={isPending || isConfirming}
                      className="w-full"
                      size="lg"
                      variant="accent"
                    >
                      Create Listing
                      <ChevronRight className="h-5 w-5 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </RequireWallet>
        </motion.div>
      </div>
    </div>
  );
}
