import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Car, Users, DollarSign, ChevronRight, Plus, Eye,
  Gauge, Fuel, Wrench, CheckCircle2, AlertCircle, BarChart3, X, Calendar, Receipt, Loader2,
  UserCheck, UserX, Pause, Navigation, MapPin, TrendingUp, PieChart, Wallet, ArrowUpDown, History,
  Send, Zap, Clock, AlertTriangle, ExternalLink, UserPlus, Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import {
  useMyOwnedCars,
  useOwnerCarRides,
  useOwnerCarExpenses,
  useOwnerShareholders,
  useReviewExpenseAsOwner,
  useSubmitOwnerExpense,
  useFleetShareOverview,
  useCarRevenueStats,
  useCarHistory,
  useFleetRevenueStats,
} from '@/hooks/api/useCarsApi';
import {
  usePortfolioHoldings,
  useCarRevenueForInvestor,
  useCarDistributionHistory,
  useInvestorCarDividendHistory,
} from '@/hooks/api/usePortfolioApi';
import { useCarMetadata } from '@/hooks/useCarMetadata';
import { getIpfsUrl, weiToEth } from '@/lib/utils';
import { useEarningsSummary } from '@/hooks/api/useEarningsApi';
import { useApplicationsForMyCars, useDriverUsersList, useAssignDriverToCar } from '@/hooks/api/useDriverApi';
import type { ApiDriverUser } from '@/hooks/api/useDriverApi';
import { useDepositEarnings, useDistributeEarnings, useBurnPublicSupply } from '@/hooks/contracts/useCarShares';
import { useReportPublicSupplyWithdrawn } from '@/hooks/api/useCarsApi';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/api/keys';
import { api } from '@/lib/api-client';
import { parseEther, formatEther } from 'viem';
import type { ApiCar, ApiExpense, ApiRide, ApiHolding, ApiCarHistory, ApiCarRevenueStats, ApiCarDistributionHistory, ApiInvestorCarDividendHistory } from '@/types/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function CarImage({ metadataCID, alt }: { metadataCID: string; alt: string }) {
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

// ─── Car History Modal ─────────────────────────────────────────────────────────

export function CarHistoryModal({ carId, onClose }: { carId: number; onClose: () => void }) {
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
              <h2 className="font-heading font-bold text-xl text-text-primary">
                Revenue History
              </h2>
              {history && (
                <p className="text-sm text-text-muted">{history.carName}</p>
              )}
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
                            <p className="font-medium text-text-primary text-sm">
                              {event.pickup} → {event.dropoff}
                            </p>
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
                              By: {event.submittedBy ?? 'Unknown'}
                              {event.description ? ` · ${event.description}` : ''}
                            </p>
                          </>
                        )}
                        {event.type === 'dividend' && (
                          <>
                            <p className="font-medium text-text-primary text-sm">
                              Earnings Distributed
                            </p>
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
                            <p className="font-mono text-sm font-bold text-success">
                              +{weiToEth(event.grossEarnings ?? '0', 4)} ETH
                            </p>
                            <p className="text-[10px] text-text-muted">gross fare</p>
                          </>
                        )}
                        {event.type === 'expense' && (
                          <>
                            <p className="font-mono text-sm font-bold text-error">
                              -{weiToEth(event.amount ?? '0', 4)} ETH
                            </p>
                            <Badge
                              variant={event.status === 'approved' ? 'success' : event.status === 'rejected' ? 'error' : 'warning'}
                              className="text-[10px]"
                            >
                              {event.status}
                            </Badge>
                          </>
                        )}
                        {event.type === 'dividend' && (
                          <p className="font-mono text-sm font-bold text-accent">
                            {weiToEth(event.amount ?? '0', 4)} ETH
                          </p>
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

// ─── Withdraw Public Supply Modal ─────────────────────────────────────────────
// Owner calls burnPublicSupply() to close the primary sale and release the
// car for road operations. Unsold shares are burned, reducing totalSupply.

export function WithdrawSupplyModal({ car, onClose }: { car: ApiCar; onClose: () => void }) {
  const reportWithdraw = useReportPublicSupplyWithdrawn();
  const { burn, hash, isPending, isConfirming, isSuccess, error, reset } = useBurnPublicSupply();
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const unsoldShares = car.remainingPublicSupply ?? 0;
  const soldShares = car.sharesSold ?? 0;
  const publicSupply = car.publicSupply ?? 0;

  // allSold = contract already auto-closed the sale when last share was bought.
  // burnPublicSupply() would revert with InsufficientPublicSupply in this case.
  // We only need to sync the DB — no on-chain tx required.
  const allSold = unsoldShares === 0;

  // After on-chain tx confirmed (unsold shares case) — report to backend
  useEffect(() => {
    if (isSuccess && hash) {
      reportWithdraw.mutate(
        { txHash: hash, carId: car.id, amount: unsoldShares },
        { onSuccess: () => { onClose(); } },
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, hash]);

  // All-sold path: just sync DB without any on-chain tx
  const handleSyncOnly = async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      await reportWithdraw.mutateAsync(
        { txHash: `0x${'0'.repeat(64)}`, carId: car.id, amount: 0 },
      );
      setSynced(true);
      setTimeout(() => onClose(), 1500);
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : 'Failed to sync. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

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
        className="w-full max-w-md bg-surface rounded-2xl border border-border shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
              <Zap className="h-5 w-5 text-warning" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-xl text-text-primary">Close Share Sale</h2>
              <p className="text-sm text-text-muted">{car.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-background-hover transition-colors">
            <X className="h-5 w-5 text-text-muted" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Info banner */}
          {allSold ? (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-success/5 border border-success/20">
              <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-text-primary mb-1">All shares sold — sale already closed on-chain!</p>
                <p className="text-text-muted text-xs">
                  The contract automatically closed the sale when the last share was purchased.
                  Click below to sync your dashboard and clear the car for road operations.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/5 border border-warning/20">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-text-primary mb-1">This action is irreversible</p>
                <p className="text-text-muted text-xs">
                  Closes the primary sale permanently. Unsold shares will be burned (destroyed),
                  reducing the total share count. Your assigned driver will be notified.
                </p>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-background-elevated text-center">
              <p className="text-lg font-bold text-text-primary">{publicSupply}</p>
              <p className="text-[10px] text-text-muted mt-0.5">Total Public Supply</p>
            </div>
            <div className="p-3 rounded-xl bg-success/5 border border-success/20 text-center">
              <p className="text-lg font-bold text-success">{soldShares}</p>
              <p className="text-[10px] text-text-muted mt-0.5">Shares Sold</p>
            </div>
            <div className={`p-3 rounded-xl text-center ${unsoldShares > 0 ? 'bg-accent/5 border border-accent/20' : 'bg-background-elevated'}`}>
              <p className={`text-lg font-bold ${unsoldShares > 0 ? 'text-accent' : 'text-text-muted'}`}>{unsoldShares}</p>
              <p className="text-[10px] text-text-muted mt-0.5">Unsold → Burned</p>
            </div>
          </div>

          {unsoldShares > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-accent/5 border border-accent/20">
              <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
              <p className="text-xs text-text-secondary">
                <span className="font-medium text-accent">{unsoldShares} unsold shares</span> will be permanently burned,
                reducing the total supply of this car.
              </p>
            </div>
          )}

          {/* Action */}
          {(isSuccess || synced) ? (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-success/5 border border-success/20">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm font-medium text-success">Sale closed successfully!</p>
                <p className="text-xs text-text-muted">Your driver has been notified. Updating records…</p>
              </div>
            </div>
          ) : allSold ? (
            // All-sold path: no contract tx needed, just sync DB
            <>
              {syncError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-error/5 border border-error/20">
                  <AlertCircle className="h-4 w-4 text-error shrink-0 mt-0.5" />
                  <p className="text-xs text-error">{syncError}</p>
                </div>
              )}
              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  variant="accent"
                  className="flex-1"
                  disabled={syncing}
                  onClick={handleSyncOnly}
                >
                  {syncing ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Syncing…</>
                  ) : (
                    <><Zap className="h-4 w-4 mr-2" />Go On-Road</>
                  )}
                </Button>
              </div>
            </>
          ) : (
            // Unsold shares path: call burnPublicSupply on-chain
            <>
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-error/5 border border-error/20">
                  <AlertCircle className="h-4 w-4 text-error shrink-0 mt-0.5" />
                  <p className="text-xs text-error">{error.message.slice(0, 120)}</p>
                </div>
              )}
              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => { reset(); onClose(); }}>
                  Cancel
                </Button>
                <Button
                  variant="accent"
                  className="flex-1"
                  disabled={isPending || isConfirming}
                  onClick={() => burn(BigInt(car.id))}
                >
                  {isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Confirm in Wallet</>
                  ) : isConfirming ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Confirming…</>
                  ) : (
                    <><Zap className="h-4 w-4 mr-2" />Close Sale & Go On-Road</>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Distribute Modal ──────────────────────────────────────────────────────────

export function DistributeModal({ car, onClose }: { car: ApiCar; onClose: () => void }) {
  const DEPOSIT_KEY = `deposit_done_car_${car.id}`;
  const [depositEthStr, setDepositEthStr] = useState('');
  const [depositDone, setDepositDone] = useState(() => localStorage.getItem(`deposit_done_car_${car.id}`) === 'true');
  const [reportStatus, setReportStatus] = useState<'idle' | 'reporting' | 'done' | 'error'>('idle');
  const [reportError, setReportError] = useState<string | null>(null);
  const reportedRef = useRef(false);
  // Snapshot captured at tx success so stale closure values don't matter
  const pendingReportPayload = useRef<object | null>(null);
  const queryClient = useQueryClient();

  const { data: revenueStats, isLoading: statsLoading } = useCarRevenueStats(car.id);
  const stats = revenueStats as ApiCarRevenueStats | undefined;

  const { deposit, isPending: depositPending, isConfirming: depositConfirming, isSuccess: depositSuccess, error: depositError } = useDepositEarnings();
  const { distribute, isPending: distributePending, isConfirming: distributeConfirming, isSuccess: distributeSuccess, hash: distributeHash, error: distributeError } = useDistributeEarnings();

  const shareholders = stats?.shareholders ?? [];
  const undistributed = stats?.undistributedRevenue ?? '0';

  // Shareholders eligible to receive distributions = those with a wallet address.
  // We use trueShares (held + escrowed) so sellers earn for ALL their shares
  // until a buyer actually purchases them.
  const eligibleShareholders = shareholders.filter((s) => !!s.walletAddress);
  const eligibleTotalShares = eligibleShareholders.reduce((sum, s) => sum + BigInt(s.trueShares), 0n);
  // Deposit the full undistributed amount — every share (held or listed) earns this round.
  const liquidDepositAmount = BigInt(undistributed);

  // Persist deposit success to localStorage so it survives modal close/reopen
  useEffect(() => {
    if (depositSuccess) {
      localStorage.setItem(DEPOSIT_KEY, 'true');
      setDepositDone(true);
    }
  }, [depositSuccess, DEPOSIT_KEY]);

  // Clear persisted deposit flag once distribution is fully done
  useEffect(() => {
    if (distributeSuccess) {
      localStorage.removeItem(DEPOSIT_KEY);
      setDepositDone(false);
    }
  }, [distributeSuccess, DEPOSIT_KEY]);

  // Auto-fill deposit input with the proportional liquid amount once stats load
  useEffect(() => {
    if (liquidDepositAmount > 0n && !depositEthStr) {
      setDepositEthStr(formatEther(liquidDepositAmount));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liquidDepositAmount.toString()]);

  const doReport = async () => {
    if (reportedRef.current || !pendingReportPayload.current) return;
    reportedRef.current = true;
    setReportStatus('reporting');
    setReportError(null);
    try {
      await api.post('/blockchain/report/earnings-distributed', pendingReportPayload.current);
      setReportStatus('done');
      queryClient.invalidateQueries({ queryKey: queryKeys.revenue.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolio.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.cars.all });
    } catch (e) {
      reportedRef.current = false; // allow manual retry
      setReportStatus('error');
      setReportError(e instanceof Error ? e.message : 'Failed to sync with server. Click Retry.');
    }
  };

  // After on-chain tx confirmed — snapshot payload then call backend
  useEffect(() => {
    if (!distributeSuccess || !distributeHash || !stats || reportedRef.current) return;
    const eligible = shareholders.filter((s) => !!s.walletAddress);
    // Record each holder's dividend based on their TRUE shares / full car supply.
    // Sellers retain earnings for escrowed shares until a buyer purchases them.
    const totalDenom = BigInt(car.totalShares || 1);
    pendingReportPayload.current = {
      carId: car.id,
      totalAmount: liquidDepositAmount.toString(),
      txHash: distributeHash,
      blockNumber: 0,
      shareholders: eligible.map((s) => ({
        userId: s.userId,
        amount: (BigInt(undistributed) * BigInt(s.trueShares) / totalDenom).toString(),
      })),
    };
    doReport();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distributeSuccess, distributeHash]);

  const handleDeposit = () => {
    if (!depositEthStr) return;
    deposit(BigInt(car.id), parseEther(depositEthStr));
  };

  const handleDistribute = () => {
    if (!stats || eligibleShareholders.length === 0) return;
    // Use trueShares (held + escrowed) per holder so sellers earn for listed shares.
    // eligibleTotalShares = sum of trueShares for wallet holders, which equals
    // car.totalShares when all shares have a wallet (contract requires sum == totalShares).
    distribute(
      BigInt(car.id),
      eligibleShareholders.map((s) => s.walletAddress as `0x${string}`),
      eligibleShareholders.map((s) => BigInt(s.trueShares)),
      eligibleTotalShares,
    );
  };

  const canDistribute = BigInt(undistributed) > 0n && shareholders.some((s) => s.walletAddress) && depositDone;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-xl bg-surface rounded-2xl border border-border shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <Send className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-xl text-text-primary">Distribute Earnings</h2>
              <p className="text-sm text-text-muted">{car.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-background-hover transition-colors">
            <X className="h-5 w-5 text-text-muted" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {statsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-7 w-7 animate-spin text-accent" />
            </div>
          ) : (
            <>
              {/* Revenue summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-background-elevated text-center">
                  <p className="text-xs text-text-muted mb-1">Rides Income</p>
                  <p className="font-mono font-bold text-success text-sm">
                    {weiToEth(stats?.totalRidesGross ?? '0', 4)} ETH
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-background-elevated text-center">
                  <p className="text-xs text-text-muted mb-1">Expenses</p>
                  <p className="font-mono font-bold text-error text-sm">
                    -{weiToEth(stats?.totalApprovedExpenses ?? '0', 4)} ETH
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-accent/5 border border-accent/20 text-center">
                  <p className="text-xs text-text-muted mb-1">Undistributed</p>
                  <p className="font-mono font-bold text-accent text-sm">
                    {weiToEth(undistributed, 4)} ETH
                  </p>
                </div>
              </div>

              {/* Shareholder breakdown */}
              {shareholders.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-text-secondary mb-2">Per-Shareholder Split</p>
                  <div className="rounded-xl border border-border overflow-hidden">
                    {shareholders.map((s, i) => {
                      // Use trueShares — sellers earn for ALL shares (held + listed)
                      // until a buyer actually purchases them.
                      const totalDenom = BigInt(car.totalShares || 1);
                      const earned = s.walletAddress && totalDenom > 0n
                        ? (BigInt(undistributed) * BigInt(s.trueShares) / totalDenom)
                        : 0n;
                      return (
                        <div
                          key={s.userId}
                          className={`flex items-center justify-between px-4 py-3 ${
                            i < shareholders.length - 1 ? 'border-b border-border' : ''
                          } hover:bg-background-elevated/50`}
                        >
                          <div>
                            <p className="text-sm font-medium text-text-primary">
                              {s.name}{s.isOwner ? ' (Owner)' : ''}
                            </p>
                            <p className="text-xs text-text-muted">
                              {s.trueShares} shares{s.sharesInEscrow > 0 ? ` (${s.shares} held + ${s.sharesInEscrow} listed)` : ''} · {s.percentage.toFixed(1)}%
                              {!s.walletAddress && (
                                <span className="ml-1 text-warning">· No wallet</span>
                              )}
                            </p>
                          </div>
                          <p className={`font-mono text-sm font-bold ${s.walletAddress ? 'text-accent' : 'text-text-muted'}`}>
                            {s.walletAddress ? `${formatEther(earned)} ETH` : '—'}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {shareholders.some((s) => !s.walletAddress) && (
                    <div className="flex items-start gap-2 mt-2 p-3 rounded-xl bg-warning/5 border border-warning/20">
                      <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                      <p className="text-xs text-warning">
                        Some shareholders don't have a wallet connected. Distribution will skip them.
                      </p>
                    </div>
                  )}

                  {(stats?.totalEscrowedShares ?? 0) > 0 && (
                    <div className="flex items-start gap-2 mt-2 p-3 rounded-xl bg-warning/5 border border-warning/20">
                      <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                      <p className="text-xs text-warning">
                        <strong>{stats!.totalEscrowedShares} shares</strong> are currently in active marketplace listings.
                        These shares earn revenue based on true ownership but will <strong>not receive this distribution</strong> —
                        they have no wallet in the contract call. The sellers will receive their portion in a future distribution once their listing resolves.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Deposit ETH step */}
              <div className="rounded-xl border border-border p-4 space-y-3">
                <p className="text-sm font-medium text-text-primary flex items-center gap-2">
                  <Zap className="h-4 w-4 text-warning" />
                  Step 1 — Deposit ETH to Contract
                </p>
                <p className="text-xs text-text-muted">
                  Deposit {formatEther(liquidDepositAmount)} ETH to distribute to all shareholders.
                  Sellers earn for their listed shares until a buyer purchases them.
                </p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.0001"
                    placeholder={formatEther(liquidDepositAmount)}
                    value={depositEthStr}
                    onChange={(e) => setDepositEthStr(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-background-elevated border border-border text-text-primary text-sm focus:outline-none focus:border-accent"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeposit}
                    disabled={!depositEthStr || Number(depositEthStr) < Number(formatEther(liquidDepositAmount)) || depositPending || depositConfirming}
                  >
                    {depositPending || depositConfirming ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Deposit'
                    )}
                  </Button>
                </div>
                {depositDone && (
                  <p className="text-xs text-success flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Deposit confirmed — ready to distribute
                  </p>
                )}
                {depositError && (
                  <p className="text-xs text-error">{depositError.message.slice(0, 100)}</p>
                )}
              </div>

              {/* Distribute step */}
              <div className={`rounded-xl border p-4 space-y-3 transition-colors ${depositDone ? 'border-accent/40' : 'border-border opacity-60'}`}>
                <p className="text-sm font-medium text-text-primary flex items-center gap-2">
                  <Send className={`h-4 w-4 ${depositDone ? 'text-accent' : 'text-text-muted'}`} />
                  Step 2 — Distribute to Shareholders
                  {!depositDone && <span className="ml-auto text-xs text-warning font-normal">Complete Step 1 first</span>}
                </p>
                <p className="text-xs text-text-muted">
                  Calls the smart contract to send ETH to each shareholder proportionally.
                  Requires ETH to be deposited first.
                </p>

                {distributeSuccess ? (
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-success/5 border border-success/20">
                      <p className="text-sm text-success flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        On-chain distribution confirmed!
                      </p>
                      {distributeHash && (
                        <a
                          href={`https://hoodi.etherscan.io/tx/${distributeHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-accent hover:underline inline-flex items-center gap-1 mt-1"
                        >
                          View on Etherscan <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    {/* DB sync status */}
                    {reportStatus === 'reporting' && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <p className="text-xs text-primary">Syncing dividend records to database…</p>
                      </div>
                    )}
                    {reportStatus === 'done' && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-success/5 border border-success/20">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <p className="text-xs text-success">Dividend records saved. Shareholders notified.</p>
                      </div>
                    )}
                    {reportStatus === 'error' && (
                      <div className="p-3 rounded-xl bg-error/5 border border-error/20 space-y-2">
                        <p className="text-xs text-error flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          {reportError}
                        </p>
                        <Button size="sm" variant="outline" className="w-full text-xs" onClick={doReport}>
                          Retry Sync
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Button
                    variant="accent"
                    className="w-full"
                    onClick={handleDistribute}
                    // disabled={!canDistribute || distributePending || distributeConfirming}
                  >
                    {distributePending || distributeConfirming ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        {distributePending ? 'Confirm in Wallet...' : 'Confirming...'}
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Distribute {weiToEth(undistributed, 4)} ETH
                      </>
                    )}
                  </Button>
                )}
                {distributeError && (
                  <p className="text-xs text-error">{distributeError.message.slice(0, 100)}</p>
                )}
              </div>

              {!canDistribute && BigInt(undistributed) === 0n && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-info/5 border border-info/20">
                  <AlertCircle className="h-4 w-4 text-info shrink-0 mt-0.5" />
                  <p className="text-xs text-info">
                    No undistributed revenue for this car yet. Revenue accumulates from rides after deducting approved expenses.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-border shrink-0">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Invested Car Card (enhanced) ─────────────────────────────────────────────

// ─── Distribution History Modal (Fleet/Owner view) ────────────────────────────

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
        {/* Header */}
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

        {/* Summary */}
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
              <p className="text-lg font-bold text-text-primary">
                {distributions[0]?.recipients.length ?? 0}
              </p>
              <p className="text-xs text-text-muted mt-0.5">Recipients (Latest)</p>
            </div>
          </div>
        )}

        {/* Distribution events */}
        <div className="p-5 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-7 w-7 animate-spin text-accent" />
            </div>
          ) : distributions.length === 0 ? (
            <div className="text-center py-10">
              <Send className="h-10 w-10 text-text-muted mx-auto mb-3 opacity-30" />
              <p className="text-text-muted">No distributions yet.</p>
              <p className="text-xs text-text-muted mt-1">Earnings will appear here once you distribute to shareholders.</p>
            </div>
          ) : (
            distributions.map((dist, idx) => (
              <div key={`${dist.txHash}-${idx}`} className="rounded-xl border border-border overflow-hidden">
                {/* Distribution event header */}
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

                {/* Per-recipient breakdown */}
                <div className="divide-y divide-border/50">
                  {dist.recipients.map((r) => (
                    <div key={r.userId} className="flex items-center justify-between px-4 py-2.5 hover:bg-background-elevated/50">
                      <div>
                        <p className="text-sm text-text-primary">{r.name}</p>
                        {r.walletAddress && (
                          <p className="text-xs text-text-muted font-mono">
                            {r.walletAddress.slice(0, 8)}…{r.walletAddress.slice(-6)}
                          </p>
                        )}
                      </div>
                      <p className="font-mono text-sm font-semibold text-success">
                        +{weiToEth(r.amount, 4)} ETH
                      </p>
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

// ─── Investor Dividend History Modal (My Investments view) ────────────────────

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
        {/* Header */}
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

        {/* Summary */}
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

        {/* Dividend records */}
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

function InvestedCarCard({ holding }: { holding: ApiHolding }) {
  const [showHistory, setShowHistory] = useState(false);
  const [showDividendHistory, setShowDividendHistory] = useState(false);
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
          <CarImage metadataCID={holding.car.metadataCID} alt={holding.car.name} />
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

          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-text-muted">Ownership</span>
              <span className="text-xs font-mono text-text-muted">{ownershipPct}%</span>
            </div>
            <Progress value={parseFloat(ownershipPct)} className="h-1.5" />
          </div>

          <div className="flex gap-2">
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
              variant={hasPending ? 'accent' : 'ghost'}
              size="sm"
              className="flex-1 text-xs"
              disabled={!hasPending}
              onClick={() => hasPending && setShowDividendHistory(true)}
              title={!hasPending ? 'No pending dividends — wait for owner to distribute' : 'View your received rewards for this car'}
            >
              <Wallet className="h-3.5 w-3.5 mr-1" />
              {hasPending ? `Claim ${weiToEth(pendingDividends, 3)} ETH` : 'No Pending'}
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showHistory && (
          <CarHistoryModal carId={holding.car.id} onClose={() => setShowHistory(false)} />
        )}
        {showDividendHistory && (
          <InvestorDividendHistoryModal
            carId={holding.car.id}
            carName={holding.car.name}
            onClose={() => setShowDividendHistory(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Assign Driver Modal ───────────────────────────────────────────────────────

export function AssignDriverModal({ car, onClose }: { car: ApiCar; onClose: () => void }) {
  const { data: driverUsers, isLoading } = useDriverUsersList();
  const { mutateAsync: assignDriver, isPending } = useAssignDriverToCar();
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const drivers = (driverUsers ?? []) as ApiDriverUser[];

  const handleAssign = async () => {
    if (!selectedDriverId) return;
    setError(null);
    try {
      await assignDriver({ carId: car.id, driverUserId: selectedDriverId });
      setSuccess(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to assign driver';
      setError(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-primary via-accent to-primary" />

        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-heading text-lg font-bold text-text-primary">Assign Driver</h2>
              <p className="text-xs text-text-muted mt-0.5">{car.name}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-background-elevated transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {success ? (
            <div className="text-center py-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10 mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <p className="font-medium text-text-primary mb-1">Driver Assigned!</p>
              <p className="text-sm text-text-muted">They have been notified and can now log rides for this car.</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={onClose}>Close</Button>
            </div>
          ) : (
            <>
              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
                </div>
              ) : drivers.length === 0 ? (
                <div className="text-center py-8">
                  <UserPlus className="h-10 w-10 text-text-muted mx-auto mb-3" />
                  <p className="text-sm font-medium text-text-primary">No drivers available</p>
                  <p className="text-xs text-text-muted mt-1">No users have registered as a driver yet.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1 mb-4">
                  {drivers.map((d) => {
                    const isSelected = selectedDriverId === d.id;
                    const isCurrentDriver = car.assignedDriver?.user?.id === d.id;
                    return (
                      <button
                        key={d.id}
                        onClick={() => setSelectedDriverId(d.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-border-hover hover:bg-background-elevated'
                        }`}
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 shrink-0 overflow-hidden">
                          {d.avatar ? (
                            <img src={d.avatar} alt={d.name} className="w-full h-full object-cover" />
                          ) : (
                            <Gauge className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">
                            {d.name}
                            {isCurrentDriver && (
                              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-info/10 text-info">Current</span>
                            )}
                          </p>
                          <p className="text-xs text-text-muted">
                            {d.driverProfile ? (
                              <>
                                {d.driverProfile.totalRides} rides
                                {d.driverProfile.rating != null && (
                                  <span className="ml-2 inline-flex items-center gap-0.5">
                                    <Star className="h-2.5 w-2.5 fill-warning text-warning" />
                                    {d.driverProfile.rating.toFixed(1)}
                                  </span>
                                )}
                                {d.driverProfile.experience > 0 && ` · ${d.driverProfile.experience} yrs exp`}
                              </>
                            ) : (
                              'New driver'
                            )}
                          </p>
                        </div>
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-error/10 border border-error/20 flex items-center gap-2 mb-3">
                  <AlertCircle className="h-4 w-4 text-error shrink-0" />
                  <p className="text-xs text-error">{error}</p>
                </div>
              )}

              <Button
                variant="accent"
                className="w-full"
                onClick={handleAssign}
                disabled={!selectedDriverId || isPending}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Assign Driver
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Per-Car Fleet Card (enhanced) ────────────────────────────────────────────

function FleetCarCard({ car }: { car: ApiCar }) {
  const [showHistory, setShowHistory] = useState(false);
  const [showDistribute, setShowDistribute] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showDistributions, setShowDistributions] = useState(false);
  const [showAssignDriver, setShowAssignDriver] = useState(false);
  const { data: revenueStats } = useCarRevenueStats(car.id);
  const stats = revenueStats as ApiCarRevenueStats | undefined;

  const saleActive = car.primarySaleActive ?? true;
  const driverStatus = car.assignedDriver ? 'active' : 'pending';
  const undistributed = stats?.undistributedRevenue ?? '0';
  const hasUndistributed = BigInt(undistributed) > 0n;

  return (
    <>
      <div className={`rounded-2xl border bg-surface overflow-hidden transition-colors ${
        saleActive ? 'border-warning/40 hover:border-warning/60' : 'border-border hover:border-accent/30'
      }`}>
        {/* Image */}
        <div className="relative h-40 bg-background-elevated">
          <CarImage metadataCID={car.metadataCID} alt={car.name} />
          <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
            {saleActive ? (
              <Badge variant="warning" className="backdrop-blur-md">
                <Zap className="h-3 w-3 mr-1" />
                Sale Open
              </Badge>
            ) : car.assignedDriver ? (
              <Badge variant="success" className="backdrop-blur-md">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                On Road
              </Badge>
            ) : (
              <Badge variant="warning" className="backdrop-blur-md">
                <AlertCircle className="h-3 w-3 mr-1" />
                Needs Driver
              </Badge>
            )}
          </div>
        </div>

        {/* Primary sale active banner */}
        {saleActive && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-warning/5 border-b border-warning/20">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
              <p className="text-xs text-warning font-medium truncate">
                Share sale open — car not cleared for road operations
              </p>
            </div>
            <Button
              variant="warning"
              size="sm"
              className="text-xs shrink-0 h-7 px-3"
              onClick={() => setShowWithdraw(true)}
            >
              <Zap className="h-3 w-3 mr-1" />
              Close Sale
            </Button>
          </div>
        )}

        {/* Content */}
        <div className="p-5">
          <h3 className="font-heading font-bold text-base text-text-primary mb-3">{car.name}</h3>

          {/* Driver row */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-background-elevated mb-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${
              driverStatus === 'active' ? 'bg-success/10' : 'bg-warning/10'
            }`}>
              <Gauge className={`h-4 w-4 ${driverStatus === 'active' ? 'text-success' : 'text-warning'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-text-muted">Driver</p>
              <p className="text-xs font-medium text-text-primary truncate">
                {car.assignedDriver?.user?.name || 'No driver assigned'}
              </p>
            </div>
            <button
              onClick={() => setShowAssignDriver(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-medium transition-colors shrink-0"
              title="Assign a driver to this car"
            >
              <UserPlus className="h-3 w-3" />
              {car.assignedDriver ? 'Change' : 'Assign'}
            </button>
          </div>

          {/* Revenue stats */}
          {stats ? (
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="p-2.5 rounded-xl bg-success/5 border border-success/10">
                <p className="text-[10px] text-text-muted mb-0.5">Rides Income</p>
                <p className="font-mono text-xs font-bold text-success">+{weiToEth(stats.totalRidesGross, 4)} ETH</p>
              </div>
              <div className="p-2.5 rounded-xl bg-error/5 border border-error/10">
                <p className="text-[10px] text-text-muted mb-0.5">Expenses</p>
                <p className="font-mono text-xs font-bold text-error">-{weiToEth(stats.totalApprovedExpenses, 4)} ETH</p>
              </div>
              <div className="p-2.5 rounded-xl bg-accent/5 border border-accent/20 col-span-2">
                <p className="text-[10px] text-text-muted mb-0.5">Net Revenue (Undistributed)</p>
                <p className="font-mono text-sm font-bold text-accent">
                  {weiToEth(stats.netCarRevenue, 4)} ETH
                  {hasUndistributed && (
                    <span className="text-[10px] text-text-muted ml-1">
                      ({weiToEth(undistributed, 4)} ETH pending)
                    </span>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="p-2.5 rounded-xl bg-background-elevated/50">
                <p className="text-[10px] text-text-muted mb-0.5">Total Shares</p>
                <p className="font-mono text-xs font-medium text-text-primary">{car.totalShares}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-background-elevated/50">
                <p className="text-[10px] text-text-muted mb-0.5">Price/Share</p>
                <p className="font-mono text-xs font-medium text-success">{weiToEth(car.pricePerShare)} ETH</p>
              </div>
            </div>
          )}

          {/* Shareholder breakdown (mini) */}
          {stats && stats.shareholders.length > 0 && (
            <div className="rounded-xl border border-border overflow-hidden mb-3">
              <p className="text-[10px] text-text-muted px-3 pt-2 pb-1">Shareholder Revenue Split</p>
              {stats.shareholders.slice(0, 3).map((s, i) => (
                <div
                  key={s.userId}
                  className={`flex items-center justify-between px-3 py-2 text-xs ${
                    i < Math.min(stats.shareholders.length, 3) - 1 ? 'border-b border-border/50' : ''
                  }`}
                >
                  <span className="text-text-secondary">
                    {s.name}{s.isOwner ? ' (Owner)' : ''} · {s.percentage.toFixed(1)}%
                  </span>
                  <span className="font-mono text-accent">{weiToEth(s.earnedRevenue, 4)} ETH</span>
                </div>
              ))}
              {stats.shareholders.length > 3 && (
                <p className="text-[10px] text-text-muted px-3 py-1.5">
                  +{stats.shareholders.length - 3} more shareholders
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
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
              onClick={() => setShowDistributions(true)}
            >
              <Send className="h-3.5 w-3.5 mr-1" />
              Dist. History
            </Button>
          </div>
          <Button
            variant={hasUndistributed ? 'accent' : 'outline'}
            size="sm"
            className="w-full mt-2 text-xs"
            onClick={() => setShowDistribute(true)}
          >
            <Send className="h-3.5 w-3.5 mr-1" />
            {hasUndistributed ? `Distribute ${weiToEth(undistributed, 3)} ETH` : 'Distribute'}
          </Button>

          <Link
            to={`/owner/monitoring/${car.id}`}
            className="mt-2 flex items-center justify-center gap-1 w-full h-9 px-4 rounded-xl text-xs font-semibold text-text-secondary hover:bg-background-hover hover:text-text-primary transition-all"
          >
            <span>Manage Vehicle</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <AnimatePresence>
        {showHistory && (
          <CarHistoryModal carId={car.id} onClose={() => setShowHistory(false)} />
        )}
        {showDistribute && (
          <DistributeModal car={car} onClose={() => setShowDistribute(false)} />
        )}
        {showWithdraw && (
          <WithdrawSupplyModal car={car} onClose={() => setShowWithdraw(false)} />
        )}
        {showDistributions && (
          <DistributionHistoryModal
            carId={car.id}
            carName={car.name}
            onClose={() => setShowDistributions(false)}
          />
        )}
        {showAssignDriver && (
          <AssignDriverModal car={car} onClose={() => setShowAssignDriver(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────

export function OwnerDashboard() {
  const { user } = useAuth();
  const [showExpensesModal, setShowExpensesModal] = useState(false);
  const [showLogExpenseModal, setShowLogExpenseModal] = useState(false);
  const [logExpenseCarId, setLogExpenseCarId] = useState<number | null>(null);
  const [logExpenseType, setLogExpenseType] = useState<string>('fuel');
  const [logExpenseAmountEth, setLogExpenseAmountEth] = useState('');
  const [logExpenseDesc, setLogExpenseDesc] = useState('');
  const [activeTab, setActiveTab] = useState<'fleet' | 'investments'>('fleet');

  // API hooks — Fleet
  const { data: ownedCars, isLoading } = useMyOwnedCars();
  const { data: earningsSummary } = useEarningsSummary();
  const { data: shareholdersData } = useOwnerShareholders();
  const { data: ridesResponse } = useOwnerCarRides({ page: 1, limit: 10 });
  const { data: expensesResponse } = useOwnerCarExpenses({ page: 1, limit: 10 });
  const { data: driverAppsResponse } = useApplicationsForMyCars({ page: 1, limit: 50 });
  const { data: fleetShareData } = useFleetShareOverview();
  const { data: fleetRevenueData } = useFleetRevenueStats();
  const reviewExpense = useReviewExpenseAsOwner();
  const submitOwnerExpense = useSubmitOwnerExpense();

  const handleLogExpense = () => {
    if (!logExpenseCarId || !logExpenseAmountEth || parseFloat(logExpenseAmountEth) <= 0) return;
    submitOwnerExpense.mutate(
      {
        carId: logExpenseCarId,
        type: logExpenseType,
        amount: parseEther(logExpenseAmountEth).toString(),
        description: logExpenseDesc || undefined,
      },
      {
        onSuccess: () => {
          setShowLogExpenseModal(false);
          setLogExpenseAmountEth('');
          setLogExpenseDesc('');
          setLogExpenseType('fuel');
          setLogExpenseCarId(null);
        },
      },
    );
  };

  // API hooks — Portfolio/Investments
  const { data: portfolioHoldings, isLoading: holdingsLoading } = usePortfolioHoldings();

  // Derived state — Fleet
  const cars: ApiCar[] = useMemo(() => ownedCars ?? [], [ownedCars]);
  const rides: ApiRide[] = ridesResponse?.data ?? [];
  const expenses: ApiExpense[] = expensesResponse?.data ?? [];
  const pendingDriverApps = (driverAppsResponse?.data ?? []).filter((a) => a.status === 'pending');
  const fleetOccupancy = Math.round(
    (cars.filter((c) => c.assignedDriver).length / Math.max(cars.length, 1)) * 100
  );

  // Derived state — Investments (cars where user holds shares but is NOT the owner)
  const investedCars: ApiHolding[] = useMemo(() => {
    if (!portfolioHoldings || !user) return [];
    return portfolioHoldings.filter((h) => {
      const isOwned = cars.some((c) => c.id === h.car.id);
      return !isOwned && h.shares > 0;
    });
  }, [portfolioHoldings, cars, user]);

  const totalInvestedValue = useMemo(() => {
    return investedCars.reduce((sum, h) => sum + BigInt(h.value), 0n).toString();
  }, [investedCars]);

  // Earnings from owner role
  const ownerEarnings = useMemo(() => {
    const summary = earningsSummary as unknown as { thisMonth?: string; byRole?: Record<string, Record<string, string>> } | undefined;
    const ownerData = summary?.byRole?.car_owner;
    return {
      thisMonth: summary?.thisMonth ?? '0',
      totalCommission: ownerData?.totalCommission ?? '0',
      totalGross: ownerData?.totalGrossEarnings ?? '0',
      totalExpenses: ownerData?.totalExpenses ?? '0',
      rideCount: parseInt(ownerData?.rideCount ?? '0', 10),
    };
  }, [earningsSummary]);

  // Investor earnings
  const investorEarnings = useMemo(() => {
    const summary = earningsSummary as unknown as { byRole?: Record<string, Record<string, string>> } | undefined;
    const investorData = summary?.byRole?.investor;
    return {
      totalDividends: investorData?.totalDividends ?? '0',
      totalInvested: investorData?.totalInvested ?? '0',
    };
  }, [earningsSummary]);

  const shareholderCount = shareholdersData?.count ?? 0;

  // Fleet share stats
  const shareStats = useMemo(() => ({
    totalSharesFleet: fleetShareData?.totalSharesFleet ?? 0,
    sharesDistributed: fleetShareData?.sharesDistributed ?? 0,
    ownerHeldShares: fleetShareData?.ownerHeldShares ?? 0,
    shareRevenue: fleetShareData?.shareRevenue ?? '0',
    totalMarketCap: fleetShareData?.totalMarketCap ?? '0',
  }), [fleetShareData]);

  const shareDistributionPct = shareStats.totalSharesFleet > 0
    ? Math.round((shareStats.sharesDistributed / shareStats.totalSharesFleet) * 100)
    : 0;

  // Fleet revenue stats
  const fleetRevenue = fleetRevenueData;

  const handleApproveExpense = (id: string) => reviewExpense.mutate({ id, status: 'approved' });
  const handleRejectExpense = (id: string) => reviewExpense.mutate({ id, status: 'rejected' });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <section className="relative py-12 lg:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-background to-background" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-6"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-4">
                <Car className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium text-accent">Car Owner Dashboard</span>
              </div>
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-2">
                Welcome back, {user?.name?.split(' ')[0] || 'Owner'}
              </h1>
              <p className="text-text-secondary">
                Manage your vehicles and track earnings from your fleet
              </p>
            </div>

            <div className="flex gap-3">
              <Button asChild variant="outline">
                {/* <Link to="/owner/driver-requests" className="inline-flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  <span>Driver Requests</span>
                  {pendingDriverApps.length > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                      {pendingDriverApps.length}
                    </span>
                  )}
                </Link> */}
              </Button>
              <Button asChild variant="outline">
                <Link to="/portfolio" className="inline-flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>View All Cars</span>
                </Link>
              </Button>
              <Button asChild variant="accent">
                <Link to="/create" className="inline-flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span>Add New Car</span>
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container py-12">
        {/* Driver Requests Banner */}
        {pendingDriverApps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mb-6"
          >
            <Link
              to="/owner/driver-requests"
              className="flex items-center justify-between p-5 rounded-2xl bg-accent/5 border border-accent/20 hover:border-accent/40 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                  <UserCheck className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-text-primary">
                    {pendingDriverApps.length} Pending Driver Request{pendingDriverApps.length !== 1 ? 's' : ''}
                  </h3>
                  <p className="text-sm text-text-muted">
                    Drivers are waiting for your approval to drive your cars
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-accent">
                <span className="text-sm font-medium group-hover:underline">Review Requests</span>
                <ChevronRight className="h-5 w-5" />
              </div>
            </Link>
          </motion.div>
        )}

        {/* Tab Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="mb-8"
        >
          <div className="inline-flex p-1 rounded-xl bg-surface border border-border">
            <button
              onClick={() => setActiveTab('fleet')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'fleet'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Car className="h-4 w-4 inline mr-2" />
              My Fleet ({cars.length})
            </button>
            <button
              onClick={() => setActiveTab('investments')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'investments'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <TrendingUp className="h-4 w-4 inline mr-2" />
              My Investments ({investedCars.length})
            </button>
          </div>
        </motion.div>

        {/* ═══════════════════════════ MY FLEET TAB ═══════════════════════════ */}
        {activeTab === 'fleet' && (
          <>
            {/* Fleet Stats Grid — 6 stats including revenue */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8"
            >
              <div className="p-5 rounded-2xl bg-surface border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10">
                    <Car className="h-4 w-4 text-accent" />
                  </div>
                  <span className="text-xs text-text-muted">My Fleet</span>
                </div>
                <p className="font-mono text-2xl font-bold text-text-primary">{cars.length}</p>
                <p className="text-xs text-text-muted mt-1">Vehicles</p>
              </div>

              <div className="p-5 rounded-2xl bg-surface border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-success/10">
                    <DollarSign className="h-4 w-4 text-success" />
                  </div>
                  <span className="text-xs text-text-muted">Rides Income</span>
                </div>
                <p className="font-mono text-xl font-bold text-success">
                  {fleetRevenue ? weiToEth(fleetRevenue.totalFleetGross, 3) : weiToEth(ownerEarnings.totalCommission, 3)} ETH
                </p>
                <p className="text-xs text-text-muted mt-1">Fleet total</p>
              </div>

              <div className="p-5 rounded-2xl bg-surface border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-error/10">
                    <Receipt className="h-4 w-4 text-error" />
                  </div>
                  <span className="text-xs text-text-muted">Expenses</span>
                </div>
                <p className="font-mono text-xl font-bold text-error">
                  -{fleetRevenue ? weiToEth(fleetRevenue.totalFleetExpenses, 3) : '0.000'} ETH
                </p>
                <p className="text-xs text-text-muted mt-1">Approved</p>
              </div>

              <div className="p-5 rounded-2xl bg-surface border border-border col-span-2 lg:col-span-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10">
                    <TrendingUp className="h-4 w-4 text-accent" />
                  </div>
                  <span className="text-xs text-text-muted">Net Revenue</span>
                </div>
                <p className="font-mono text-xl font-bold text-accent">
                  {fleetRevenue ? weiToEth(fleetRevenue.totalFleetNetRevenue, 3) : '0.000'} ETH
                </p>
                <p className="text-xs text-text-muted mt-1">After expenses</p>
              </div>

              <div className="p-5 rounded-2xl bg-surface border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-xs text-text-muted">Shareholders</span>
                </div>
                <p className="font-mono text-2xl font-bold text-text-primary">{shareholderCount}</p>
                <p className="text-xs text-text-muted mt-1">Investors</p>
              </div>

              <div className="p-5 rounded-2xl bg-surface border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-info/10">
                    <BarChart3 className="h-4 w-4 text-info" />
                  </div>
                  <span className="text-xs text-text-muted">Occupancy</span>
                </div>
                <p className="font-mono text-2xl font-bold text-text-primary">{fleetOccupancy}%</p>
                <Progress value={fleetOccupancy} className="h-1.5 mt-2" />
              </div>
            </motion.div>

            {/* Fleet Revenue Overview row (distributed vs undistributed) */}
            {fleetRevenue && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.12 }}
                className="mb-8"
              >
                <div className="rounded-2xl border border-border bg-surface p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                      <Send className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h2 className="font-heading font-bold text-lg text-text-primary">Fleet Revenue Distribution</h2>
                      <p className="text-sm text-text-muted">How earnings are distributed across your vehicles</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                    <div className="p-4 rounded-xl bg-background-elevated">
                      <p className="text-xs text-text-muted mb-1">Total Gross</p>
                      <p className="font-mono font-bold text-success text-lg">{weiToEth(fleetRevenue.totalFleetGross, 4)} ETH</p>
                    </div>
                    <div className="p-4 rounded-xl bg-background-elevated">
                      <p className="text-xs text-text-muted mb-1">Total Expenses</p>
                      <p className="font-mono font-bold text-error text-lg">-{weiToEth(fleetRevenue.totalFleetExpenses, 4)} ETH</p>
                    </div>
                    <div className="p-4 rounded-xl bg-background-elevated">
                      <p className="text-xs text-text-muted mb-1">Net Revenue</p>
                      <p className="font-mono font-bold text-accent text-lg">{weiToEth(fleetRevenue.totalFleetNetRevenue, 4)} ETH</p>
                    </div>
                    <div className="p-4 rounded-xl bg-background-elevated">
                      <p className="text-xs text-text-muted mb-1">Distributed</p>
                      <p className="font-mono font-bold text-primary text-lg">{weiToEth(fleetRevenue.totalDistributed, 4)} ETH</p>
                    </div>
                    <div className="p-4 rounded-xl bg-warning/5 border border-warning/20">
                      <p className="text-xs text-text-muted mb-1">Undistributed</p>
                      <p className="font-mono font-bold text-warning text-lg">{weiToEth(fleetRevenue.undistributed, 4)} ETH</p>
                    </div>
                  </div>

                  {/* Per-car revenue table */}
                  {fleetRevenue.perCar.length > 0 && (
                    <div className="rounded-xl border border-border overflow-hidden">
                      <div className="grid grid-cols-5 px-4 py-2 bg-background-elevated text-xs text-text-muted font-medium">
                        <span>Car</span>
                        <span className="text-right">Gross</span>
                        <span className="text-right">Expenses</span>
                        <span className="text-right">Net</span>
                        <span className="text-right">Distributed</span>
                      </div>
                      {fleetRevenue.perCar.map((pc, i) => (
                        <div
                          key={pc.carId}
                          className={`grid grid-cols-5 px-4 py-3 text-xs ${
                            i < fleetRevenue.perCar.length - 1 ? 'border-b border-border' : ''
                          } hover:bg-background-elevated/50`}
                        >
                          <span className="font-medium text-text-primary truncate">{pc.name}</span>
                          <span className="font-mono text-right text-success">{weiToEth(pc.gross, 4)}</span>
                          <span className="font-mono text-right text-error">-{weiToEth(pc.expenses, 4)}</span>
                          <span className="font-mono text-right text-accent">{weiToEth(pc.net, 4)}</span>
                          <span className="font-mono text-right text-primary">{weiToEth(pc.distributed, 4)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Fleet Share Overview */}
            {cars.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="mb-8"
              >
                <div className="rounded-2xl border border-border bg-surface p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <PieChart className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-heading font-bold text-lg text-text-primary">Fleet Share Overview</h2>
                      <p className="text-sm text-text-muted">Share distribution across your vehicles</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="p-4 rounded-xl bg-background-elevated">
                      <p className="text-xs text-text-muted mb-1">Total Shares</p>
                      <p className="font-mono font-bold text-text-primary text-lg">{shareStats.totalSharesFleet}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-background-elevated">
                      <p className="text-xs text-text-muted mb-1">Sold to Investors</p>
                      <p className="font-mono font-bold text-primary text-lg">{shareStats.sharesDistributed}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-background-elevated">
                      <p className="text-xs text-text-muted mb-1">You Hold</p>
                      <p className="font-mono font-bold text-accent text-lg">{shareStats.ownerHeldShares}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-background-elevated">
                      <p className="text-xs text-text-muted mb-1">Share Revenue</p>
                      <p className="font-mono font-bold text-success text-lg">{weiToEth(shareStats.shareRevenue, 4)} ETH</p>
                    </div>
                    <div className="p-4 rounded-xl bg-background-elevated">
                      <p className="text-xs text-text-muted mb-1">Market Cap</p>
                      <p className="font-mono font-bold text-warning text-lg">{weiToEth(shareStats.totalMarketCap, 4)} ETH</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-text-muted">Distribution Progress</span>
                      <span className="text-xs font-mono text-text-muted">{shareDistributionPct}%</span>
                    </div>
                    <Progress value={shareDistributionPct} className="h-2" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* My Cars with per-car revenue */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-bold text-xl text-text-primary">My Vehicles</h2>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/portfolio" className="inline-flex items-center gap-1">
                    <span>View All</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cars.map((car) => (
                  <FleetCarCard key={car.id} car={car} />
                ))}
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Rides */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="rounded-2xl border border-border bg-surface overflow-hidden">
                  <div className="p-6 border-b border-border flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
                      <Navigation className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <h2 className="font-heading font-bold text-lg text-text-primary">Recent Rides</h2>
                      <p className="text-sm text-text-muted">Rides on your vehicles</p>
                    </div>
                  </div>

                  {rides.length === 0 ? (
                    <div className="p-8 text-center text-text-muted">
                      <Navigation className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No rides recorded yet.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {rides.slice(0, 5).map((ride) => (
                        <div key={ride.id} className="p-4 hover:bg-background-elevated/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                                <MapPin className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-text-primary text-sm truncate max-w-[200px]">
                                  {ride.pickup} → {ride.dropoff}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                                  <span>{ride.car?.name ?? `Car #${ride.carId}`}</span>
                                  <span>·</span>
                                  <span>{new Date(ride.timestamp).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-mono font-medium text-success text-sm">+{weiToEth(ride.grossEarnings)} ETH</p>
                              <p className="text-[10px] text-text-muted">Commission: {weiToEth(ride.commission)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Pending Expenses */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="rounded-2xl border border-border bg-surface overflow-hidden">
                  <div className="p-6 border-b border-border flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
                        <Fuel className="h-5 w-5 text-warning" />
                      </div>
                      <div>
                        <h2 className="font-heading font-bold text-lg text-text-primary">Expenses</h2>
                        <p className="text-sm text-text-muted">Fuel & maintenance costs</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setLogExpenseCarId(cars[0]?.id ?? null);
                        setShowLogExpenseModal(true);
                      }}
                      className="shrink-0"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Log Expense
                    </Button>
                  </div>

                  <div className="divide-y divide-border">
                    {expenses.map((expense) => (
                      <div key={expense.id} className="p-4 hover:bg-background-elevated/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${
                              expense.type === 'fuel' ? 'bg-warning/10' : 'bg-info/10'
                            }`}>
                              {expense.type === 'fuel' ? (
                                <Fuel className="h-5 w-5 text-warning" />
                              ) : (
                                <Wrench className="h-5 w-5 text-info" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-text-primary">
                                {expense.type.charAt(0).toUpperCase() + expense.type.slice(1)}
                              </p>
                              <p className="text-sm text-text-muted">
                                {expense.car?.name ?? `Car #${expense.carId}`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-mono font-medium text-error">-{weiToEth(expense.amount)} ETH</p>
                            <Badge
                              variant={expense.status === 'approved' ? 'success' : 'warning'}
                              className="mt-1"
                            >
                              {expense.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 border-t border-border">
                    <Button
                      variant="ghost"
                      className="w-full inline-flex items-center justify-center gap-2"
                      onClick={() => setShowExpensesModal(true)}
                    >
                      <span>View All Expenses</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}

        {/* ═══════════════════════════ MY INVESTMENTS TAB ═══════════════════════════ */}
        {activeTab === 'investments' && (
          <>
            {/* Investment Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
            >
              <div className="p-5 rounded-2xl bg-surface border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm text-text-muted">Cars Invested</span>
                </div>
                <p className="font-heading text-2xl font-bold text-text-primary font-mono">
                  {investedCars.length}
                </p>
                <p className="text-sm text-text-muted mt-2">Unique vehicles</p>
              </div>

              <div className="p-5 rounded-2xl bg-surface border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
                    <Wallet className="h-5 w-5 text-success" />
                  </div>
                  <span className="text-sm text-text-muted">Portfolio Value</span>
                </div>
                <p className="font-heading text-2xl font-bold text-success font-mono">
                  {weiToEth(totalInvestedValue, 4)} ETH
                </p>
                <p className="text-sm text-text-muted mt-2">Current value</p>
              </div>

              <div className="p-5 rounded-2xl bg-surface border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                    <DollarSign className="h-5 w-5 text-accent" />
                  </div>
                  <span className="text-sm text-text-muted">Dividends Earned</span>
                </div>
                <p className="font-heading text-2xl font-bold text-accent font-mono">
                  {weiToEth(investorEarnings.totalDividends, 4)} ETH
                </p>
                <p className="text-sm text-text-muted mt-2">Total received</p>
              </div>

              <div className="p-5 rounded-2xl bg-surface border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
                    <PieChart className="h-5 w-5 text-warning" />
                  </div>
                  <span className="text-sm text-text-muted">Total Shares</span>
                </div>
                <p className="font-heading text-2xl font-bold text-text-primary font-mono">
                  {investedCars.reduce((sum, h) => sum + h.shares, 0)}
                </p>
                <p className="text-sm text-text-muted mt-2">Across all cars</p>
              </div>
            </motion.div>

            {/* Invested Cars Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-bold text-xl text-text-primary">My Invested Vehicles</h2>
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
              ) : investedCars.length === 0 ? (
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
                        <ArrowUpDown className="h-4 w-4" />
                        <span>Marketplace</span>
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {investedCars.map((holding) => (
                    <InvestedCarCard key={holding.car.id} holding={holding} />
                  ))}
                </div>
              )}
            </motion.div>

            {/* Investment breakdown table */}
            {investedCars.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
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
                    {investedCars.map((holding) => {
                      const ownershipPct = holding.car.totalShares > 0
                        ? ((holding.shares / holding.car.totalShares) * 100).toFixed(1)
                        : '0';
                      return (
                        <div key={holding.car.id} className="p-4 hover:bg-background-elevated/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                                <Car className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-text-primary">{holding.car.name}</p>
                                <p className="text-xs text-text-muted">
                                  {holding.car.make} {holding.car.model} ({holding.car.year})
                                </p>
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
                      <span className="font-mono font-bold text-lg text-success">
                        {weiToEth(totalInvestedValue, 4)} ETH
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Expenses Modal */}
      <AnimatePresence>
        {showExpensesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowExpensesModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-surface rounded-2xl border border-border shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-border bg-surface">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
                    <Receipt className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-xl text-text-primary">Fleet Expenses</h2>
                    <p className="text-sm text-text-muted">Manage fuel, maintenance & other costs</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowExpensesModal(false)}
                  className="p-2 rounded-lg hover:bg-background-hover transition-colors"
                >
                  <X className="h-5 w-5 text-text-muted" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 p-6 border-b border-border">
                <div className="text-center p-4 rounded-xl bg-warning/5 border border-warning/20">
                  <p className="text-2xl font-bold text-warning">
                    {expenses.filter((e) => e.status === 'pending').length}
                  </p>
                  <p className="text-xs text-text-muted">Pending</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-success/5 border border-success/20">
                  <p className="text-2xl font-bold text-success">
                    {expenses.filter((e) => e.status === 'approved').length}
                  </p>
                  <p className="text-xs text-text-muted">Approved</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-error/5 border border-error/20">
                  <p className="text-2xl font-bold text-error">
                    {expenses.filter((e) => e.status === 'rejected').length}
                  </p>
                  <p className="text-xs text-text-muted">Rejected</p>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-start gap-4 p-4 rounded-xl border border-border bg-background-elevated/30 hover:border-accent/30 transition-colors"
                    >
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl shrink-0 ${
                        expense.type === 'fuel' ? 'bg-warning/10' :
                        expense.type === 'maintenance' ? 'bg-info/10' : 'bg-primary/10'
                      }`}>
                        {expense.type === 'fuel' ? (
                          <Fuel className="h-5 w-5 text-warning" />
                        ) : expense.type === 'maintenance' ? (
                          <Wrench className="h-5 w-5 text-info" />
                        ) : (
                          <Car className="h-5 w-5 text-primary" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-1">
                          <div>
                            <p className="font-medium text-text-primary">
                              {expense.type.charAt(0).toUpperCase() + expense.type.slice(1)}
                            </p>
                            <p className="text-sm text-text-muted">
                              {expense.car?.name ?? `Car #${expense.carId}`}
                            </p>
                          </div>
                          <Badge
                            variant={expense.status === 'approved' ? 'success' : expense.status === 'rejected' ? 'error' : 'warning'}
                          >
                            {expense.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-text-secondary mb-2">{expense.description ?? ''}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-text-muted">
                            <Calendar className="h-3 w-3" />
                            {new Date(expense.submittedAt).toLocaleDateString()}
                          </div>
                          <p className="font-mono font-bold text-error">-{weiToEth(expense.amount)} ETH</p>
                        </div>

                        {expense.status === 'pending' && (
                          <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                            <Button
                              size="sm"
                              variant="success"
                              className="flex-1"
                              onClick={() => handleApproveExpense(expense.id)}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-error border-error/30 hover:bg-error/10"
                              onClick={() => handleRejectExpense(expense.id)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 rounded-xl bg-background-elevated border border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Total Expenses (This Month)</span>
                    <span className="font-mono font-bold text-lg text-error">
                      -{expenses.reduce((sum, e) => sum + parseFloat(weiToEth(e.amount)), 0).toFixed(4)} ETH
                    </span>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 flex items-center justify-between gap-3 p-6 border-t border-border bg-surface">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowExpensesModal(false);
                    setLogExpenseCarId(cars[0]?.id ?? null);
                    setShowLogExpenseModal(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Log New Expense
                </Button>
                <Button variant="outline" onClick={() => setShowExpensesModal(false)}>Close</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Log Owner Expense Modal */}
      <AnimatePresence>
        {showLogExpenseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowLogExpenseModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md bg-surface rounded-2xl border border-border shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
                    <Receipt className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-xl text-text-primary">Log Expense</h2>
                    <p className="text-sm text-text-muted">Immediately deducted from car revenue</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLogExpenseModal(false)}
                  className="p-2 rounded-lg hover:bg-background-hover transition-colors"
                >
                  <X className="h-5 w-5 text-text-muted" />
                </button>
              </div>

              {/* Form */}
              <div className="p-6 space-y-4">
                {/* Car selector */}
                {cars.length > 1 && (
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Car</label>
                    <select
                      value={logExpenseCarId ?? ''}
                      onChange={(e) => setLogExpenseCarId(Number(e.target.value))}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
                    >
                      {cars.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Expense type */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Expense Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['fuel', 'maintenance', 'cleaning', 'insurance', 'other'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setLogExpenseType(t)}
                        className={`py-2 px-3 rounded-xl text-xs font-medium border transition-colors capitalize ${
                          logExpenseType === t
                            ? 'bg-accent text-white border-accent'
                            : 'border-border text-text-secondary hover:border-accent/50 hover:bg-accent/5'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Amount (ETH)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.0001"
                    placeholder="e.g. 0.005"
                    value={logExpenseAmountEth}
                    onChange={(e) => setLogExpenseAmountEth(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Description <span className="text-text-muted font-normal">(optional)</span></label>
                  <input
                    type="text"
                    placeholder="e.g. Filled 40L at Shell station"
                    value={logExpenseDesc}
                    onChange={(e) => setLogExpenseDesc(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
                  />
                </div>

                {/* Info banner */}
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-warning/5 border border-warning/20">
                  <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                  <p className="text-xs text-text-secondary">
                    As the car owner your expenses are <span className="font-semibold text-warning">automatically approved</span> and instantly deducted from undistributed revenue. All shareholders will be notified.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 p-6 border-t border-border">
                <Button variant="outline" className="flex-1" onClick={() => setShowLogExpenseModal(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleLogExpense}
                  disabled={
                    submitOwnerExpense.isPending ||
                    !logExpenseCarId ||
                    !logExpenseAmountEth ||
                    parseFloat(logExpenseAmountEth) <= 0
                  }
                >
                  {submitOwnerExpense.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Logging…</>
                  ) : (
                    <><CheckCircle2 className="h-4 w-4 mr-2" />Log Expense</>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
