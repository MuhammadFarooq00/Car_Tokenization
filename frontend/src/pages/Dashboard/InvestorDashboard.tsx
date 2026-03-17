import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  TrendingUp, Wallet, PieChart, ArrowUpRight, ArrowDownRight,
  Car, Package, Clock, ChevronRight, Eye, BarChart3,
  ExternalLink, X, CheckCircle2, Loader2, Tag, Coins,
  Zap, UserCheck, UserX, Pause, AlertCircle, History, Send,
  Navigation, Receipt, DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import {
  usePortfolioSummary,
  usePortfolioHoldings,
  useCarRevenueForInvestor,
  useCarDistributionHistory,
  useInvestorCarDividendHistory,
} from '@/hooks/api/usePortfolioApi';
import { useMyListings } from '@/hooks/api/useMarketplaceApi';
import { useCarHistory } from '@/hooks/api/useCarsApi';
import { useCarMetadata } from '@/hooks/useCarMetadata';
import { getIpfsUrl, weiToEth, formatEth } from '@/lib/utils';
import type {
  TransactionType,
  ApiMarketplaceListing,
  ApiHolding,
  ApiCarHistory,
  ApiCarDistributionHistory,
  ApiInvestorCarDividendHistory,
} from '@/types/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function HoldingImage({ metadataCID, alt }: { metadataCID: string; alt: string }) {
  const { data: metadata } = useCarMetadata(metadataCID);
  const src = metadata?.image ? getIpfsUrl(metadata.image) : '/placeholder-car.svg';
  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-car.svg'; }}
    />
  );
}

function mapTxType(type: TransactionType): 'buy' | 'sell' {
  switch (type) {
    case 'primary_purchase':
    case 'listing_filled':
      return 'buy';
    case 'car_created':
    case 'listing_created':
    case 'listing_cancelled':
      return 'sell';
  }
}

function InvestorListingRow({ listing }: { listing: ApiMarketplaceListing }) {
  const metadataCID = listing.car?.metadataCID;
  const { data: metadata } = useCarMetadata(metadataCID);
  const imageUrl = metadata?.image ? getIpfsUrl(metadata.image) : '/placeholder-car.svg';
  const carName = listing.car?.name || metadata?.name || `Car #${listing.carId}`;

  return (
    <Link to={`/listing/${listing.listingId}`} className="block">
      <div className="p-4 hover:bg-background-elevated/50 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-20 h-14 rounded-xl overflow-hidden bg-background-elevated shrink-0">
            <img
              src={imageUrl}
              alt={carName}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-car.svg'; }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-semibold text-text-primary hover:text-accent transition-colors truncate">
              {carName}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-text-muted flex items-center gap-1">
                <Package className="h-3 w-3" />
                {listing.amount} shares
              </span>
              <span className="text-sm text-accent font-medium flex items-center gap-1">
                <Coins className="h-3 w-3" />
                {formatEth(BigInt(listing.pricePerShare))}/share
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono font-bold text-text-primary">
              {formatEth(BigInt(listing.pricePerShare) * BigInt(listing.amount))} ETH
            </p>
            <p className="text-xs text-accent">Active</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Car Revenue History Modal ─────────────────────────────────────────────────

function CarHistoryModal({ carId, onClose }: { carId: number; onClose: () => void }) {
  const { data, isLoading } = useCarHistory(carId);
  const history = data as ApiCarHistory | undefined;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-surface rounded-2xl border border-border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-border bg-surface">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <History className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-xl text-text-primary">Revenue History</h2>
              {history && <p className="text-sm text-text-muted">{history.carName}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-background-hover transition-colors">
            <X className="h-5 w-5 text-text-muted" />
          </button>
        </div>

        {/* Summary */}
        {history && (
          <div className="grid grid-cols-3 gap-3 p-5 border-b border-border">
            <div className="p-3 rounded-xl bg-success/5 border border-success/20 text-center">
              <p className="text-lg font-bold text-success">{weiToEth(history.summary.totalGross, 4)} ETH</p>
              <p className="text-xs text-text-muted mt-0.5">Total Rides Income</p>
            </div>
            <div className="p-3 rounded-xl bg-error/5 border border-error/20 text-center">
              <p className="text-lg font-bold text-error">-{weiToEth(history.summary.totalApprovedExpenses, 4)} ETH</p>
              <p className="text-xs text-text-muted mt-0.5">Approved Expenses</p>
            </div>
            <div className="p-3 rounded-xl bg-accent/5 border border-accent/20 text-center">
              <p className="text-lg font-bold text-accent">{weiToEth(history.summary.netRevenue, 4)} ETH</p>
              <p className="text-xs text-text-muted mt-0.5">Net Revenue</p>
            </div>
          </div>
        )}

        {/* Events */}
        <div className="p-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
          ) : !history || history.events.length === 0 ? (
            <div className="text-center py-10 text-text-muted">
              <History className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No events yet for this car.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.events.map((event) => (
                <div
                  key={`${event.type}-${event.id}`}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                    event.type === 'ride'
                      ? 'bg-success/5 border-success/20'
                      : event.type === 'expense'
                      ? 'bg-error/5 border-error/20'
                      : 'bg-accent/5 border-accent/20'
                  }`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${
                    event.type === 'ride' ? 'bg-success/10' : event.type === 'expense' ? 'bg-error/10' : 'bg-accent/10'
                  }`}>
                    {event.type === 'ride' ? (
                      <Navigation className="h-5 w-5 text-success" />
                    ) : event.type === 'expense' ? (
                      <Receipt className="h-5 w-5 text-error" />
                    ) : (
                      <Send className="h-5 w-5 text-accent" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        {event.type === 'ride' && (
                          <>
                            <p className="font-medium text-text-primary text-sm">{event.pickup} → {event.dropoff}</p>
                            <p className="text-xs text-text-muted mt-0.5">
                              Driver: {event.driverName ?? 'Unknown'}{event.distance ? ` · ${event.distance.toFixed(1)} km` : ''}
                            </p>
                          </>
                        )}
                        {event.type === 'expense' && (
                          <>
                            <p className="font-medium text-text-primary text-sm">
                              {event.expenseType?.charAt(0).toUpperCase()}{event.expenseType?.slice(1)} Expense
                            </p>
                            <p className="text-xs text-text-muted mt-0.5">
                              By: {event.submittedBy ?? 'Unknown'}{event.description ? ` · ${event.description}` : ''}
                            </p>
                          </>
                        )}
                        {event.type === 'dividend' && (
                          <>
                            <p className="font-medium text-text-primary text-sm">Earnings Distributed</p>
                            {event.txHash && (
                              <a
                                href={`https://hoodi.etherscan.io/tx/${event.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-accent hover:underline inline-flex items-center gap-1 mt-0.5"
                              >
                                {event.txHash.slice(0, 10)}...{event.txHash.slice(-6)}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        {event.type === 'ride' && (
                          <>
                            <p className="font-mono text-sm font-bold text-success">+{weiToEth(event.grossEarnings ?? '0', 4)} ETH</p>
                            <p className="text-[10px] text-text-muted">gross fare</p>
                          </>
                        )}
                        {event.type === 'expense' && (
                          <>
                            <p className="font-mono text-sm font-bold text-error">-{weiToEth(event.amount ?? '0', 4)} ETH</p>
                            <Badge
                              variant={event.status === 'approved' ? 'success' : event.status === 'rejected' ? 'error' : 'warning'}
                              className="text-[10px]"
                            >
                              {event.status}
                            </Badge>
                          </>
                        )}
                        {event.type === 'dividend' && (
                          <p className="font-mono text-sm font-bold text-accent">{weiToEth(event.amount ?? '0', 4)} ETH</p>
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] text-text-muted mt-1.5 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Distribution History Modal (investor view) ────────────────────────────────

function DistributionHistoryModal({ carId, carName, onClose }: { carId: number; carName: string; onClose: () => void }) {
  const { data, isLoading } = useCarDistributionHistory(carId);
  const history = data as ApiCarDistributionHistory | undefined;
  const distributions = history?.distributions ?? [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-surface rounded-2xl border border-border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-border bg-surface">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <Send className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-xl text-text-primary">Distribution History</h2>
              <p className="text-sm text-text-muted">{carName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-background-hover transition-colors">
            <X className="h-5 w-5 text-text-muted" />
          </button>
        </div>

        {!isLoading && distributions.length > 0 && (
          <div className="grid grid-cols-3 gap-3 p-5 border-b border-border">
            <div className="p-3 rounded-xl bg-accent/5 border border-accent/20 text-center">
              <p className="text-lg font-bold text-accent">{distributions.length}</p>
              <p className="text-xs text-text-muted mt-0.5">Total Distributions</p>
            </div>
            <div className="p-3 rounded-xl bg-success/5 border border-success/20 text-center">
              <p className="text-lg font-bold text-success">
                {weiToEth(
                  distributions.reduce((s, d) => (BigInt(s) + BigInt(d.totalAmount)).toString(), '0'),
                  4,
                )} ETH
              </p>
              <p className="text-xs text-text-muted mt-0.5">Total Distributed</p>
            </div>
            <div className="p-3 rounded-xl bg-background-elevated text-center">
              <p className="text-lg font-bold text-text-primary">{distributions[0]?.recipients.length ?? 0}</p>
              <p className="text-xs text-text-muted mt-0.5">Recipients (Latest)</p>
            </div>
          </div>
        )}

        <div className="p-5 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-7 w-7 animate-spin text-accent" />
            </div>
          ) : distributions.length === 0 ? (
            <div className="text-center py-10">
              <Send className="h-10 w-10 text-text-muted mx-auto mb-3 opacity-30" />
              <p className="text-text-muted">No distributions yet.</p>
              <p className="text-xs text-text-muted mt-1">Earnings will appear here once the car owner distributes to shareholders.</p>
            </div>
          ) : (
            distributions.map((dist, idx) => (
              <div key={`${dist.txHash}-${idx}`} className="rounded-xl border border-border overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-accent/5 border-b border-border">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <div>
                      <p className="text-sm font-semibold text-text-primary">
                        {new Date(dist.distributedAt).toLocaleDateString()} at{' '}
                        {new Date(dist.distributedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-xs text-text-muted font-mono truncate max-w-[220px]" title={dist.txHash}>
                        {dist.txHash.startsWith('0x') ? `${dist.txHash.slice(0, 10)}…${dist.txHash.slice(-6)}` : dist.txHash}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-accent">{weiToEth(dist.totalAmount, 4)} ETH</p>
                    <p className="text-xs text-text-muted">Total sent</p>
                  </div>
                </div>
                <div className="divide-y divide-border/50">
                  {dist.recipients.map((r) => (
                    <div key={r.userId} className="flex items-center justify-between px-4 py-2.5 hover:bg-background-elevated/50">
                      <div>
                        <p className="text-sm text-text-primary">{r.name}</p>
                        {r.walletAddress && (
                          <p className="text-xs text-text-muted font-mono">{r.walletAddress.slice(0, 8)}…{r.walletAddress.slice(-6)}</p>
                        )}
                      </div>
                      <p className="font-mono text-sm font-semibold text-success">+{weiToEth(r.amount, 4)} ETH</p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="sticky bottom-0 flex items-center justify-end p-5 border-t border-border bg-surface">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Investor Dividend History Modal ──────────────────────────────────────────

function InvestorDividendHistoryModal({ carId, carName, onClose }: { carId: number; carName: string; onClose: () => void }) {
  const { data, isLoading } = useInvestorCarDividendHistory(carId);
  const history = data as ApiInvestorCarDividendHistory | undefined;
  const dividends = history?.dividends ?? [];
  const totalClaimed = history?.totalClaimed ?? '0';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-surface rounded-2xl border border-border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-border bg-surface">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
              <Wallet className="h-5 w-5 text-success" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-xl text-text-primary">Rewards Received</h2>
              <p className="text-sm text-text-muted">{carName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-background-hover transition-colors">
            <X className="h-5 w-5 text-text-muted" />
          </button>
        </div>

        {!isLoading && (
          <div className="grid grid-cols-2 gap-3 p-5 border-b border-border">
            <div className="p-3 rounded-xl bg-success/5 border border-success/20 text-center">
              <p className="text-lg font-bold text-success">{weiToEth(totalClaimed, 4)} ETH</p>
              <p className="text-xs text-text-muted mt-0.5">Total Received</p>
            </div>
            <div className="p-3 rounded-xl bg-background-elevated text-center">
              <p className="text-lg font-bold text-text-primary">{dividends.length}</p>
              <p className="text-xs text-text-muted mt-0.5">Payments</p>
            </div>
          </div>
        )}

        <div className="p-5 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-7 w-7 animate-spin text-success" />
            </div>
          ) : dividends.length === 0 ? (
            <div className="text-center py-10">
              <Wallet className="h-10 w-10 text-text-muted mx-auto mb-3 opacity-30" />
              <p className="text-text-muted">No rewards received yet.</p>
              <p className="text-xs text-text-muted mt-1">
                Rewards appear here when the car owner distributes earnings to shareholders.
              </p>
            </div>
          ) : (
            dividends.map((d) => (
              <div key={d.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-background-elevated/30 hover:bg-background-elevated/60 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Dividend Received</p>
                    <p className="text-xs text-text-muted">
                      {new Date(d.paidAt ?? d.createdAt).toLocaleDateString()} at{' '}
                      {new Date(d.paidAt ?? d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-semibold text-success">+{weiToEth(d.amount, 4)} ETH</p>
                  <Badge variant="success" className="text-[10px] mt-1">completed</Badge>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="sticky bottom-0 flex items-center justify-end p-5 border-t border-border bg-surface">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Invested Car Card ─────────────────────────────────────────────────────────

function InvestedCarCard({ holding }: { holding: ApiHolding }) {
  const [showHistory, setShowHistory] = useState(false);
  const [showDividendHistory, setShowDividendHistory] = useState(false);
  const [showDistributionHistory, setShowDistributionHistory] = useState(false);
  const { data: revenueData, isLoading: revLoading } = useCarRevenueForInvestor(holding.car.id);

  // Use true ownership (held + escrowed) from revenueData when available
  const myTrueShares = revenueData?.myTrueShares ?? holding.shares;
  const myEscrowedShares = revenueData?.myEscrowedShares ?? 0;
  const ownershipPct = revenueData
    ? revenueData.ownershipPct.toFixed(1)
    : holding.car.totalShares > 0
      ? ((holding.shares / holding.car.totalShares) * 100).toFixed(1)
      : '0';

  const pendingDividends = revenueData?.myPendingDividends ?? '0';
  const hasPending = BigInt(pendingDividends) > 0n;

  return (
    <>
      <div className="rounded-2xl border border-border bg-surface overflow-hidden hover:border-primary/30 transition-colors">
        {/* Image */}
        <div className="relative h-36 bg-background-elevated">
          <HoldingImage metadataCID={holding.car.metadataCID} alt={holding.car.name} />
          <div className="absolute top-3 right-3">
            <Badge variant="default" className="backdrop-blur-md">
              <TrendingUp className="h-3 w-3 mr-1" />
              {ownershipPct}%
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="font-heading font-bold text-base text-text-primary mb-0.5">{holding.car.name}</h3>
          <p className="text-xs text-text-muted mb-2">
            {holding.car.make} {holding.car.model} ({holding.car.year})
          </p>

          {/* Status + Driver badges */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {holding.car.status === 'active' && holding.car.primarySaleActive && (
              <Badge variant="warning" className="text-[10px] gap-1 px-2 py-0.5">
                <Zap className="h-2.5 w-2.5" />Sale Open
              </Badge>
            )}
            {holding.car.status === 'active' && !holding.car.primarySaleActive && (
              <Badge variant="success" className="text-[10px] gap-1 px-2 py-0.5">
                <CheckCircle2 className="h-2.5 w-2.5" />On Road
              </Badge>
            )}
            {holding.car.status === 'paused' && (
              <Badge variant="accent" className="text-[10px] gap-1 px-2 py-0.5">
                <Pause className="h-2.5 w-2.5" />Paused
              </Badge>
            )}
            {holding.car.status === 'retired' && (
              <Badge variant="default" className="text-[10px] gap-1 px-2 py-0.5">
                <AlertCircle className="h-2.5 w-2.5" />Retired
              </Badge>
            )}
            {holding.car.assignedDriver ? (
              <Badge variant="default" className="text-[10px] gap-1 px-2 py-0.5 bg-info/10 text-info border-info/20">
                <UserCheck className="h-2.5 w-2.5" />{holding.car.assignedDriver.user.name}
              </Badge>
            ) : (
              <Badge variant="default" className="text-[10px] gap-1 px-2 py-0.5 bg-warning/10 text-warning border-warning/20">
                <UserX className="h-2.5 w-2.5" />No Driver
              </Badge>
            )}
          </div>

          {/* Revenue stats */}
          {revLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : revenueData ? (
            <>
              {myEscrowedShares > 0 && (
                <div className="flex items-center gap-1.5 mb-3 px-2.5 py-1.5 rounded-lg bg-warning/10 border border-warning/20">
                  <AlertCircle className="h-3 w-3 text-warning shrink-0" />
                  <p className="text-[10px] text-warning leading-tight">
                    {myEscrowedShares} share{myEscrowedShares > 1 ? 's' : ''} in active listing — earning revenue but not yet distributed
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="p-2.5 rounded-xl bg-background-elevated/50">
                  <p className="text-[10px] text-text-muted mb-0.5">My Shares</p>
                  <p className="font-mono text-xs font-medium text-text-primary">
                    {myTrueShares} / {revenueData.totalShares}
                  </p>
                  {myEscrowedShares > 0 && (
                    <p className="text-[10px] text-warning mt-0.5">
                      {revenueData.myShares} held + {myEscrowedShares} listed
                    </p>
                  )}
                </div>
                <div className="p-2.5 rounded-xl bg-background-elevated/50">
                  <p className="text-[10px] text-text-muted mb-0.5">My Earned</p>
                  <p className="font-mono text-xs font-medium text-success">
                    {weiToEth(revenueData.myEarnedRevenue, 4)} ETH
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-background-elevated/50">
                  <p className="text-[10px] text-text-muted mb-0.5">Claimed</p>
                  <p className="font-mono text-xs font-medium text-text-muted">
                    {weiToEth(revenueData.myClaimedDividends, 4)} ETH
                  </p>
                </div>
                <div className={`p-2.5 rounded-xl ${hasPending ? 'bg-accent/10 border border-accent/20' : 'bg-background-elevated/50'}`}>
                  <p className="text-[10px] text-text-muted mb-0.5">Pending</p>
                  <p className={`font-mono text-xs font-medium ${hasPending ? 'text-accent' : 'text-text-muted'}`}>
                    {weiToEth(pendingDividends, 4)} ETH
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="p-2.5 rounded-xl bg-background-elevated/50">
                <p className="text-[10px] text-text-muted mb-0.5">My Shares</p>
                <p className="font-mono text-xs font-medium text-text-primary">
                  {holding.shares} / {holding.car.totalShares}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-background-elevated/50">
                <p className="text-[10px] text-text-muted mb-0.5">Value</p>
                <p className="font-mono text-xs font-medium text-success">
                  {weiToEth(holding.value, 4)} ETH
                </p>
              </div>
            </div>
          )}

          {/* Ownership progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-text-muted">Ownership</span>
              <span className="text-xs font-mono text-text-muted">{ownershipPct}%</span>
            </div>
            <Progress value={parseFloat(ownershipPct)} className="h-1.5" />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mb-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => setShowHistory(true)}
            >
              <History className="h-3.5 w-3.5 mr-1" />
              History
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => setShowDistributionHistory(true)}
            >
              <Send className="h-3.5 w-3.5 mr-1" />
              Dist. History
            </Button>
          </div>
          <Button
            variant={hasPending ? 'accent' : 'ghost'}
            size="sm"
            className="w-full text-xs"
            disabled={!hasPending}
            onClick={() => hasPending && setShowDividendHistory(true)}
            title={!hasPending ? 'No pending dividends — wait for owner to distribute' : 'View your received rewards for this car'}
          >
            <Wallet className="h-3.5 w-3.5 mr-1" />
            {hasPending ? `Claim ${weiToEth(pendingDividends, 3)} ETH` : 'No Pending'}
          </Button>

          <Link
            to={`/car/${holding.car.id}`}
            className="mt-2 flex items-center justify-center gap-1 w-full h-9 px-4 rounded-xl text-xs font-semibold text-text-secondary hover:bg-background-hover hover:text-text-primary transition-all"
          >
            <span>View Car Detail</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <AnimatePresence>
        {showHistory && <CarHistoryModal carId={holding.car.id} onClose={() => setShowHistory(false)} />}
        {showDividendHistory && (
          <InvestorDividendHistoryModal
            carId={holding.car.id}
            carName={holding.car.name}
            onClose={() => setShowDividendHistory(false)}
          />
        )}
        {showDistributionHistory && (
          <DistributionHistoryModal
            carId={holding.car.id}
            carName={holding.car.name}
            onClose={() => setShowDistributionHistory(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Main Investor Dashboard ───────────────────────────────────────────────────

export function InvestorDashboard() {
  const { user } = useAuth();
  const { data: portfolio, isLoading } = usePortfolioSummary();
  const { data: holdings, isLoading: holdingsLoading } = usePortfolioHoldings();
  const { data: listingsData } = useMyListings();
  const myListings = listingsData?.data ?? [];

  const allHoldings = holdings ?? [];
  const totalValue = portfolio ? weiToEth(portfolio.totalValue) : '0';
  const totalShares = allHoldings.reduce((sum, h) => sum + h.shares, 0);
  const totalHoldings = portfolio?.totalCarsInvested ?? 0;
  const totalDividends = portfolio ? weiToEth(portfolio.totalDividends) : '0';
  const recentTransactions = (portfolio?.recentTransactions ?? []).slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <section className="relative py-12 lg:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-6"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Investor Dashboard</span>
              </div>
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-2">
                Welcome back, {user?.name?.split(' ')[0] || 'Investor'}
              </h1>
              <p className="text-text-secondary">
                Track your investments, dividends, and portfolio performance
              </p>
            </div>

            <div className="flex gap-3">
              <Button asChild variant="outline">
                <Link to="/portfolio" className="flex items-center justify-center bg-primary/70 rounded-lg px-4 py-2 gap-x-2 hover:bg-primary/80">
                  <Eye className="h-4 w-4" />
                  <span>Full Portfolio</span>
                </Link>
              </Button>
              <Button asChild variant="glow">
                <Link to="/discover" className="flex items-center justify-center bg-[#d4a574]/50 rounded-lg px-4 py-2 gap-x-2 hover:bg-[#d4a574]/60">
                  <span>Invest Now</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container py-12">
        {/* Stats Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16 mb-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-text-muted">Loading portfolio...</span>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            <div className="p-5 rounded-2xl bg-surface border border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm text-text-muted">Portfolio Value</span>
              </div>
              <p className="font-heading text-2xl font-bold text-gradient font-mono">{totalValue} ETH</p>
              <div className="flex items-center gap-1 mt-2">
                <ArrowUpRight className="h-4 w-4 text-text-muted" />
                <span className="text-xs text-text-muted">Current value</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                  <Package className="h-5 w-5 text-accent" />
                </div>
                <span className="text-sm text-text-muted">Total Shares</span>
              </div>
              <p className="font-heading text-2xl font-bold text-text-primary font-mono">{totalShares}</p>
              <p className="text-sm text-text-muted mt-2">Across {totalHoldings} cars</p>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
                  <DollarSign className="h-5 w-5 text-success" />
                </div>
                <span className="text-sm text-text-muted">Dividends Received</span>
              </div>
              <p className="font-heading text-2xl font-bold text-success font-mono">{totalDividends} ETH</p>
              <p className="text-sm text-text-muted mt-2">Total received</p>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10">
                  <BarChart3 className="h-5 w-5 text-info" />
                </div>
                <span className="text-sm text-text-muted">Cars Invested</span>
              </div>
              <p className="font-heading text-2xl font-bold text-text-primary font-mono">{totalHoldings}</p>
              <p className="text-sm text-text-muted mt-2">Unique vehicles</p>
            </div>
          </motion.div>
        )}

        {/* ─── Invested Car Cards (full feature, same as OwnerDashboard) ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-xl text-text-primary">My Investments</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/portfolio" className="inline-flex items-center gap-1">
                <span>Full Portfolio</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {holdingsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : allHoldings.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface p-12 text-center">
              <TrendingUp className="h-14 w-14 text-text-muted mx-auto mb-4 opacity-30" />
              <h3 className="font-heading font-bold text-lg text-text-primary mb-2">No Investments Yet</h3>
              <p className="text-text-muted mb-6 max-w-md mx-auto">
                You haven't invested in any vehicles yet. Browse the marketplace to buy shares in tokenized cars.
              </p>
              <div className="flex gap-3 justify-center">
                <Button asChild variant="accent">
                  <Link to="/discover" className="inline-flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span>Discover Cars</span>
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/marketplace" className="inline-flex items-center gap-2">
                    <span>Marketplace</span>
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allHoldings.map((holding) => (
                <InvestedCarCard key={holding.car.id} holding={holding} />
              ))}
            </div>
          )}
        </motion.div>

        {/* ─── Investment Breakdown Table ─── */}
        {allHoldings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <div className="rounded-2xl border border-border bg-surface overflow-hidden">
              <div className="p-6 border-b border-border flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-lg text-text-primary">Investment Breakdown</h2>
                  <p className="text-sm text-text-muted">Per-vehicle investment details</p>
                </div>
              </div>

              <div className="divide-y divide-border">
                {allHoldings.map((holding) => {
                  const ownershipPct = holding.car.totalShares > 0
                    ? ((holding.shares / holding.car.totalShares) * 100).toFixed(1)
                    : '0';
                  const saleOpen = holding.car.primarySaleActive;
                  const driver = holding.car.assignedDriver;
                  return (
                    <div key={holding.car.id} className="p-4 hover:bg-background-elevated/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-8 rounded-lg overflow-hidden bg-background-elevated shrink-0">
                            <HoldingImage metadataCID={holding.car.metadataCID} alt={holding.car.name} />
                          </div>
                          <div>
                            <Link
                              to={`/car/${holding.car.id}`}
                              className="font-medium text-text-primary hover:text-primary transition-colors"
                            >
                              {holding.car.name}
                            </Link>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-xs text-text-muted">
                                {holding.car.make} {holding.car.model} ({holding.car.year})
                              </p>
                              {saleOpen && (
                                <Badge variant="warning" className="text-[10px] gap-1 px-1.5 py-0">
                                  <Zap className="h-2.5 w-2.5" />Sale
                                </Badge>
                              )}
                              {!saleOpen && (
                                <Badge variant="success" className="text-[10px] gap-1 px-1.5 py-0">
                                  <CheckCircle2 className="h-2.5 w-2.5" />On Road
                                </Badge>
                              )}
                              {driver ? (
                                <Badge variant="default" className="text-[10px] bg-info/10 text-info border-info/20 px-1.5 py-0">
                                  <UserCheck className="h-2.5 w-2.5 mr-0.5" />{driver.user.name}
                                </Badge>
                              ) : (
                                <Badge variant="default" className="text-[10px] bg-warning/10 text-warning border-warning/20 px-1.5 py-0">
                                  <UserX className="h-2.5 w-2.5 mr-0.5" />No Driver
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-medium text-text-primary">
                            {holding.shares} / {holding.car.totalShares} shares
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-text-muted">{ownershipPct}% ownership</span>
                            <span className="font-mono text-xs text-success">{weiToEth(holding.value, 4)} ETH</span>
                          </div>
                        </div>
                      </div>
                      <Progress value={parseFloat(ownershipPct)} className="h-1.5 mt-3" />
                    </div>
                  );
                })}
              </div>

              <div className="p-4 bg-background-elevated border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-muted">Total Portfolio Value</span>
                  <span className="font-mono font-bold text-lg text-success">{totalValue} ETH</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── Holdings + Recent Activity side-by-side ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Holdings quick list */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="lg:col-span-2"
          >
            <div className="rounded-2xl border border-border bg-surface overflow-hidden">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Car className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-lg text-text-primary">Your Holdings</h2>
                    <p className="text-sm text-text-muted">{allHoldings.length} cars in portfolio</p>
                  </div>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/portfolio" className="inline-flex items-center gap-1">
                    <span>View All</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="divide-y divide-border">
                {allHoldings.map((holding) => {
                  const saleOpen = holding.car.primarySaleActive;
                  const carStatus = holding.car.status;
                  const driver = holding.car.assignedDriver;
                  return (
                    <div key={holding.car.id} className="p-4 hover:bg-background-elevated/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-14 rounded-xl overflow-hidden bg-background-elevated shrink-0">
                          <HoldingImage metadataCID={holding.car.metadataCID} alt={`${holding.car.year} ${holding.car.make} ${holding.car.model}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/car/${holding.car.id}`}
                            className="font-heading font-semibold text-text-primary hover:text-primary transition-colors truncate block"
                          >
                            {`${holding.car.year} ${holding.car.make} ${holding.car.model}`}
                          </Link>
                          <div className="flex items-center flex-wrap gap-2 mt-1">
                            <span className="text-sm text-text-muted">{holding.shares} shares</span>
                            <Badge variant="default" className="text-xs">
                              <PieChart className="h-3 w-3 mr-1" />
                              {Math.round(holding.shares / holding.car.totalShares * 100)}% owned
                            </Badge>
                            {carStatus === 'active' && saleOpen && (
                              <Badge variant="warning" className="text-xs gap-1">
                                <Zap className="h-3 w-3" />Sale Open
                              </Badge>
                            )}
                            {carStatus === 'active' && !saleOpen && (
                              <Badge variant="success" className="text-xs gap-1">
                                <CheckCircle2 className="h-3 w-3" />On Road
                              </Badge>
                            )}
                            {carStatus === 'paused' && (
                              <Badge variant="accent" className="text-xs gap-1">
                                <Pause className="h-3 w-3" />Paused
                              </Badge>
                            )}
                            {carStatus === 'retired' && (
                              <Badge variant="default" className="text-xs gap-1">
                                <AlertCircle className="h-3 w-3" />Retired
                              </Badge>
                            )}
                            {driver ? (
                              <Badge variant="default" className="text-xs gap-1 bg-info/10 text-info border-info/20">
                                <UserCheck className="h-3 w-3" />{driver.user.name}
                              </Badge>
                            ) : (
                              <Badge variant="default" className="text-xs gap-1 bg-warning/10 text-warning border-warning/20">
                                <UserX className="h-3 w-3" />No Driver
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-heading font-bold text-text-primary font-mono">{weiToEth(holding.value)} ETH</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {allHoldings.length === 0 && (
                  <div className="p-8 text-center text-text-muted">
                    <Car className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No holdings yet. Browse cars to start investing.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="rounded-2xl border border-border bg-surface overflow-hidden">
              <div className="p-6 border-b border-border flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                  <Clock className="h-5 w-5 text-accent" />
                </div>
                <h2 className="font-heading font-bold text-lg text-text-primary">Recent Activity</h2>
              </div>

              <div className="divide-y divide-border">
                {recentTransactions.map((tx) => {
                  const displayType = mapTxType(tx.type);
                  return (
                    <div key={tx.id} className="p-4 hover:bg-background-elevated/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${
                          displayType === 'buy' ? 'bg-primary/10' : 'bg-error/10'
                        }`}>
                          {displayType === 'buy' ? (
                            <ArrowDownRight className="h-5 w-5 text-primary" />
                          ) : (
                            <ArrowUpRight className="h-5 w-5 text-error" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary capitalize">
                            {displayType} {tx.amount} shares
                          </p>
                          <p className="text-xs text-text-muted truncate">{`Car #${tx.carId}`}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-mono font-medium ${displayType === 'sell' ? 'text-success' : 'text-text-primary'}`}>
                            {displayType === 'sell' ? '+' : '-'}{weiToEth(tx.price)} ETH
                          </p>
                          <p className="text-xs text-text-muted">{new Date(tx.timestamp).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {recentTransactions.length === 0 && (
                  <div className="p-8 text-center text-text-muted">
                    <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No transactions yet.</p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border">
                <Button asChild variant="ghost" className="w-full">
                  <Link to="/portfolio" className="inline-flex items-center justify-center gap-2">
                    <span>View All Transactions</span>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Active Listings */}
        {myListings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mb-8"
          >
            <div className="rounded-2xl border border-border bg-surface overflow-hidden">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                    <Tag className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-lg text-text-primary">Active Listings</h2>
                    <p className="text-sm text-text-muted">{myListings.length} listing{myListings.length !== 1 ? 's' : ''} on marketplace</p>
                  </div>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/portfolio" className="inline-flex items-center gap-1">
                    <span>View All</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="divide-y divide-border">
                {myListings.slice(0, 5).map((listing) => (
                  <InvestorListingRow key={listing.listingId} listing={listing} />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Actions CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="font-heading font-bold text-lg text-text-primary mb-1">
                Ready to expand your portfolio?
              </h3>
              <p className="text-text-secondary">
                Discover new investment opportunities in premium tokenized vehicles
              </p>
            </div>
            <div className="flex gap-3">
              <Button asChild variant="outline">
                <Link to="/marketplace" className="flex items-center justify-center bg-primary/70 rounded-lg px-4 py-2 gap-x-2 hover:bg-primary/80">
                  <span>Browse Marketplace</span>
                </Link>
              </Button>
              <Button asChild variant="accent">
                <Link to="/discover" className="flex items-center justify-center bg-[#d4a574]/50 rounded-lg px-4 py-2 gap-x-2 hover:bg-[#d4a574]/60">
                  <span>Explore Cars</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
