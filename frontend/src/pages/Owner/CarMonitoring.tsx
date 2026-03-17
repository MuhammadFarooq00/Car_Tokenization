import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Car, ChevronLeft, Users, DollarSign, Fuel,
  Wrench, TrendingUp, Navigation,
  Calendar, BarChart3, X, Clock, CheckCircle2,
  MapPin, Loader2, UserCheck, PieChart, ArrowUpDown, Wallet,
  History, Send, ThumbsUp, ThumbsDown, Receipt, UserPlus, Gauge,
  Plus, AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useMyOwnedCars, useOwnerCarRides, useOwnerCarExpenses, useCarShareholders, useCarRevenueStats, useReviewExpenseAsOwner, useSubmitOwnerExpense } from '@/hooks/api/useCarsApi';
import { parseEther } from 'viem';
import { useCarTradeHistory } from '@/hooks/api/useMarketplaceApi';
import { CarHistoryModal, DistributeModal, AssignDriverModal } from '@/pages/Dashboard/OwnerDashboard';
import type { ApiCar, ApiRide, ApiExpense, ApiTransaction, ApiCarRevenueStats } from '@/types/api';
import { weiToEth } from '@/lib/utils';

// Helper function to format timestamp (ISO string or unix timestamp)
function formatTimestamp(timestamp: string | number): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp * 1000);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

export function CarMonitoring() {
  // API hooks
  const { data: myCars, isLoading: carsLoading } = useMyOwnedCars();
  const [selectedCar, setSelectedCar] = useState<ApiCar | null>(null);

  // Derive selected car - default to first car when none selected
  const activeCar = selectedCar ?? (myCars && myCars.length > 0 ? myCars[0] : null);

  // Fetch rides and expenses scoped to the owner's car (not driver-scoped)
  const { data: ridesData } = useOwnerCarRides({ page: 1, limit: 50, carId: activeCar?.id });
  const { data: expensesData } = useOwnerCarExpenses({ page: 1, limit: 50, carId: activeCar?.id });

  // Fetch shareholders and trade history for the selected car
  const { data: shareholderData } = useCarShareholders(activeCar?.id ?? -1);
  const { data: tradesData } = useCarTradeHistory(activeCar?.id ?? -1, { page: 1, limit: 10 });

  // Already filtered by carId in the backend
  const carRides: ApiRide[] = ridesData?.data ?? [];
  const carExpenses: ApiExpense[] = expensesData?.data ?? [];
  const carTrades: ApiTransaction[] = tradesData?.data ?? [];
  const shareholders = shareholderData?.shareholders ?? [];
  const sharesDistributed = shareholderData?.sharesDistributed ?? 0;
  const investorShareholders = shareholders.filter((s) => !s.isOwner);
  const shareDistributionPct = activeCar?.totalShares
    ? Math.round((sharesDistributed / activeCar.totalShares) * 100)
    : 0;

  // Revenue stats for active car
  const { data: revenueStatsData } = useCarRevenueStats(activeCar?.id ?? 0);
  const revenueStats = revenueStatsData as ApiCarRevenueStats | undefined;

  // Expense review mutation
  const { mutate: reviewExpense } = useReviewExpenseAsOwner();
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const handleReviewExpense = (id: string, status: 'approved' | 'rejected') => {
    setReviewingId(id);
    reviewExpense(
      { id, status },
      { onSettled: () => setReviewingId(null) },
    );
  };

  // Log expense (owner)
  const submitOwnerExpense = useSubmitOwnerExpense();
  const [showLogExpenseModal, setShowLogExpenseModal] = useState(false);
  const [logExpenseType, setLogExpenseType] = useState('fuel');
  const [logExpenseAmountEth, setLogExpenseAmountEth] = useState('');
  const [logExpenseDesc, setLogExpenseDesc] = useState('');

  const handleLogOwnerExpense = () => {
    if (!activeCar || !logExpenseAmountEth || parseFloat(logExpenseAmountEth) <= 0) return;
    submitOwnerExpense.mutate(
      {
        carId: activeCar.id,
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
        },
      },
    );
  };

  // Modal states
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showExpensesModal, setShowExpensesModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showRidesModal, setShowRidesModal] = useState(false);
  const [showAssignDriverModal, setShowAssignDriverModal] = useState(false);

  // Maintenance states
  const [maintenanceDate, setMaintenanceDate] = useState('');
  const [maintenanceType, setMaintenanceType] = useState('');
  const [maintenanceScheduled, setMaintenanceScheduled] = useState(false);

  const handleScheduleMaintenance = async () => {
    if (!maintenanceDate || !maintenanceType) return;
    setMaintenanceScheduled(true);
  };

  const closeMaintenanceModal = () => {
    setShowMaintenanceModal(false);
    setMaintenanceDate('');
    setMaintenanceType('');
    setMaintenanceScheduled(false);
  };

  // Fallback stats from raw rides/expenses
  const ridesCount = carRides.length;
  const stats = {
    ridesCount,
    gross: revenueStats?.totalRidesGross ?? '0',
    expenses: revenueStats?.totalApprovedExpenses ?? '0',
    net: revenueStats?.netCarRevenue ?? '0',
    undistributed: revenueStats?.undistributedRevenue ?? '0',
    distributed: revenueStats?.totalDistributed ?? '0',
  };

  // Loading state
  if (carsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-text-muted">Loading your vehicles...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!myCars || myCars.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <section className="relative py-12 lg:py-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-background to-background" />
          <div className="container relative">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-text-secondary bg-background-elevated border border-border hover:text-text-primary hover:border-primary/40 hover:bg-background-hover transition-all mb-6"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
            <div className="text-center py-12">
              <Car className="h-16 w-16 text-text-muted mx-auto mb-4" />
              <h2 className="font-heading text-2xl font-bold text-text-primary mb-2">
                No Vehicles Found
              </h2>
              <p className="text-text-muted mb-6">
                You don't own any vehicles yet. Start by tokenizing your first vehicle.
              </p>
              <Link to="/dashboard">
                <Button variant="accent">Go to Dashboard</Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <section className="relative py-12 lg:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-background to-background" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-text-secondary bg-background-elevated border border-border hover:text-text-primary hover:border-primary/40 hover:bg-background-hover transition-all mb-6"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-4">
              <Car className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-accent">Car Monitoring</span>
            </div>

            <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-2">
              Vehicle Monitoring
            </h1>
            <p className="text-text-secondary">
              Track your vehicle's performance, earnings, and driver activity.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container py-12">
        {/* Car Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex gap-4 mb-8 overflow-x-auto pb-2"
        >
          {myCars.map((car) => (
            <button
              key={car.id}
              onClick={() => setSelectedCar(car)}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 shrink-0 transition-all ${
                activeCar?.id === car.id
                  ? 'border-accent bg-accent/5'
                  : 'border-border hover:border-border-hover'
              }`}
            >
              <div className="w-20 h-14 rounded-lg overflow-hidden bg-background-elevated shrink-0 flex items-center justify-center">
                <Car className="h-8 w-8 text-text-muted" />
              </div>
              <div className="text-left">
                <p className="font-medium text-text-primary">{car.name || `${car.make} ${car.model}`}</p>
                <Badge
                  variant={car.status === 'active' ? 'success' : 'default'}
                  className="mt-1"
                >
                  {car.status}
                </Badge>
              </div>
            </button>
          ))}
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8"
        >
          <div className="p-5 rounded-2xl bg-surface border border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-success/10">
                <DollarSign className="h-4 w-4 text-success" />
              </div>
              <span className="text-xs text-text-muted">Share Price</span>
            </div>
            <p className="font-mono text-xl font-bold text-success">
              {activeCar ? weiToEth(activeCar.pricePerShare) : '0'} ETH
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs text-text-muted">Total Shares</span>
            </div>
            <p className="font-mono text-xl font-bold text-primary">
              {activeCar?.totalShares || 0}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10">
                <Navigation className="h-4 w-4 text-accent" />
              </div>
              <span className="text-xs text-text-muted">Rides Income</span>
            </div>
            <p className="font-mono text-xl font-bold text-accent">
              {weiToEth(stats.gross, 4)} ETH
            </p>
            <p className="text-xs text-text-muted mt-1">{stats.ridesCount} rides</p>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-error/10">
                <Fuel className="h-4 w-4 text-error" />
              </div>
              <span className="text-xs text-text-muted">Expenses</span>
            </div>
            <p className="font-mono text-xl font-bold text-error">
              -{weiToEth(stats.expenses, 4)} ETH
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-border col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-success/10">
                <BarChart3 className="h-4 w-4 text-success" />
              </div>
              <span className="text-xs text-text-muted">Net Revenue</span>
            </div>
            <p className="font-mono text-xl font-bold text-success">
              {weiToEth(stats.net, 4)} ETH
            </p>
            {BigInt(stats.undistributed) > 0n && (
              <p className="text-xs text-warning mt-1">
                {weiToEth(stats.undistributed, 4)} pending
              </p>
            )}
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-info/10">
                <Users className="h-4 w-4 text-info" />
              </div>
              <span className="text-xs text-text-muted">Investors</span>
            </div>
            <p className="font-mono text-xl font-bold text-info">
              {investorShareholders.length}
            </p>
            <p className="text-xs text-text-muted mt-1">
              {sharesDistributed} / {activeCar?.totalShares ?? 0} shares sold
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Share Distribution & Shareholders */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="rounded-2xl border border-border bg-surface overflow-hidden"
            >
              <div className="p-6 border-b border-border flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                  <PieChart className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-text-primary">Share Distribution</h3>
                  <p className="text-sm text-text-muted">Ownership breakdown for {activeCar?.name}</p>
                </div>
              </div>

              <div className="p-6">
                {/* Share Overview Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-text-muted">Shares Sold to Investors</span>
                    <span className="text-sm font-mono font-medium text-text-primary">
                      {sharesDistributed} / {activeCar?.totalShares ?? 0}
                    </span>
                  </div>
                  <Progress value={shareDistributionPct} className="h-3" />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-text-muted">{shareDistributionPct}% distributed</span>
                    <span className="text-xs text-text-muted">
                      Market Cap: {activeCar ? weiToEth(
                        (BigInt(activeCar.totalShares) * BigInt(activeCar.pricePerShare)).toString(), 4
                      ) : '0'} ETH
                    </span>
                  </div>
                </div>

                {/* Shareholders List */}
                {shareholders.length === 0 ? (
                  <div className="text-center py-6">
                    <Users className="h-10 w-10 text-text-muted mx-auto mb-3 opacity-30" />
                    <p className="text-sm text-text-muted">No shareholders yet. Shares haven't been sold.</p>
                  </div>
                ) : (
                  <div>
                    <h4 className="text-sm font-medium text-text-primary mb-3">
                      Shareholders ({shareholders.length})
                    </h4>
                    <div className="space-y-2">
                      {shareholders.map((holder) => {
                        const revHolder = revenueStats?.shareholders.find((s) => s.userId === holder.userId);
                        return (
                          <div
                            key={holder.userId}
                            className="flex items-center justify-between p-3 rounded-xl bg-background-elevated hover:bg-background-elevated/80 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`flex h-9 w-9 items-center justify-center rounded-full shrink-0 ${
                                holder.isOwner ? 'bg-accent/10' : 'bg-primary/10'
                              }`}>
                                <Users className={`h-4 w-4 ${holder.isOwner ? 'text-accent' : 'text-primary'}`} />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-text-primary">
                                  {holder.name}
                                  {holder.isOwner && (
                                    <Badge variant="default" className="ml-2 text-[10px]">Owner</Badge>
                                  )}
                                </p>
                                {holder.walletAddress && (
                                  <p className="text-xs text-text-muted font-mono">
                                    {holder.walletAddress.slice(0, 6)}...{holder.walletAddress.slice(-4)}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-mono font-medium text-text-primary text-sm">
                                {holder.shares} shares · {holder.percentage}%
                              </p>
                              {revHolder && (
                                <p className="text-xs text-success font-mono">
                                  {weiToEth(revHolder.earnedRevenue, 4)} ETH earned
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Recent Trade Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.28 }}
              className="rounded-2xl border border-border bg-surface overflow-hidden"
            >
              <div className="p-6 border-b border-border flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
                  <ArrowUpDown className="h-5 w-5 text-success" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-text-primary">Trade Activity</h3>
                  <p className="text-sm text-text-muted">Recent share purchases & sales</p>
                </div>
              </div>

              {carTrades.length === 0 ? (
                <div className="p-8 text-center">
                  <ArrowUpDown className="h-10 w-10 text-text-muted mx-auto mb-3 opacity-30" />
                  <p className="text-sm text-text-muted">No trades yet for this vehicle.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {carTrades.map((trade) => (
                    <div key={trade.id} className="p-4 hover:bg-background-elevated/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${
                            trade.type === 'primary_purchase' ? 'bg-success/10' :
                            trade.type === 'listing_filled' ? 'bg-primary/10' :
                            trade.type === 'listing_created' ? 'bg-warning/10' : 'bg-info/10'
                          }`}>
                            <Wallet className={`h-4 w-4 ${
                              trade.type === 'primary_purchase' ? 'text-success' :
                              trade.type === 'listing_filled' ? 'text-primary' :
                              trade.type === 'listing_created' ? 'text-warning' : 'text-info'
                            }`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-text-primary capitalize">
                              {trade.type.replace(/_/g, ' ')}
                            </p>
                            <p className="text-xs text-text-muted">
                              {trade.amount} share{trade.amount !== 1 ? 's' : ''} &bull; {formatTimestamp(trade.timestamp)}
                            </p>
                          </div>
                        </div>
                        <p className="font-mono font-medium text-sm text-success">
                          {weiToEth(trade.price)} ETH
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Driver Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="rounded-2xl border border-border bg-surface overflow-hidden"
            >
              <div className="p-6 border-b border-border">
                <h3 className="font-heading font-bold text-lg text-text-primary">Assigned Driver</h3>
              </div>

              {activeCar?.assignedDriver ? (
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 shrink-0">
                      <UserCheck className="h-7 w-7 text-success" />
                    </div>
                    <div>
                      <p className="font-heading font-bold text-lg text-text-primary">
                        {activeCar.assignedDriver.user?.name ?? 'Driver'}
                      </p>
                      <Badge variant="success" className="mt-1">Active Driver</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-background-elevated">
                      <p className="text-xs text-text-muted mb-1">Experience</p>
                      <p className="font-mono font-medium text-text-primary">{activeCar.assignedDriver.experience} years</p>
                    </div>
                    <div className="p-3 rounded-xl bg-background-elevated">
                      <p className="text-xs text-text-muted mb-1">Total Rides</p>
                      <p className="font-mono font-medium text-text-primary">{activeCar.assignedDriver.totalRides}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-background-elevated">
                      <p className="text-xs text-text-muted mb-1">Rating</p>
                      <p className="font-mono font-medium text-text-primary">
                        {activeCar.assignedDriver.rating > 0 ? `${activeCar.assignedDriver.rating.toFixed(1)} ★` : 'New'}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-background-elevated">
                      <p className="text-xs text-text-muted mb-1">License</p>
                      <p className="font-mono font-medium text-text-primary text-xs truncate">{activeCar.assignedDriver.license}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Users className="h-12 w-12 text-text-muted mx-auto mb-4" />
                  <h4 className="font-heading font-bold text-lg text-text-primary mb-2">
                    No Driver Assigned
                  </h4>
                  <p className="text-sm text-text-muted mb-4">
                    Drivers can apply to drive your car. Review applications from the dashboard.
                  </p>
                  <Link to="/owner/driver-requests">
                    <Button variant="outline" size="sm">
                      <UserCheck className="h-4 w-4 mr-2" /> View Driver Requests
                    </Button>
                  </Link>
                </div>
              )}
            </motion.div>

            {/* Ride History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="rounded-2xl border border-border bg-surface overflow-hidden"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Navigation className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-heading font-bold text-lg text-text-primary">Ride History</h3>
                </div>
                {carRides.length > 4 && (
                  <Button variant="ghost" size="sm" onClick={() => setShowRidesModal(true)}>
                    View All
                  </Button>
                )}
              </div>

              {carRides.length === 0 ? (
                <div className="p-8 text-center">
                  <Navigation className="h-12 w-12 text-text-muted mx-auto mb-3" />
                  <p className="text-sm text-text-muted">No rides recorded yet</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {carRides.slice(0, 4).map((ride: ApiRide) => (
                    <div key={ride.id} className="p-4 hover:bg-background-elevated/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-text-primary">
                            {ride.pickup} → {ride.dropoff}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-text-muted">
                              {formatTimestamp(ride.timestamp)}
                            </span>
                            {ride.car?.name && (
                              <span className="text-xs text-text-muted">{ride.car.name}</span>
                            )}
                          </div>
                        </div>
                        <Badge variant="success">+{weiToEth(ride.grossEarnings)} ETH</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Expenses — full section with approve/reject */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="rounded-2xl border border-border bg-surface overflow-hidden"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
                    <Receipt className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-lg text-text-primary">Expenses</h3>
                    <p className="text-sm text-text-muted">
                      {carExpenses.filter((e) => e.status === 'pending').length > 0 && (
                        <span className="text-warning font-medium">
                          {carExpenses.filter((e) => e.status === 'pending').length} pending review
                        </span>
                      )}
                      {carExpenses.filter((e) => e.status === 'pending').length === 0 && 'All reviewed'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowLogExpenseModal(true)}>
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Log Expense
                  </Button>
                  {carExpenses.length > 5 && (
                    <Button variant="ghost" size="sm" onClick={() => setShowExpensesModal(true)}>
                      View All
                    </Button>
                  )}
                </div>
              </div>

              {carExpenses.length === 0 ? (
                <div className="p-8 text-center">
                  <Fuel className="h-12 w-12 text-text-muted mx-auto mb-3 opacity-30" />
                  <p className="text-sm text-text-muted">No expenses submitted yet</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {carExpenses.slice(0, 5).map((expense: ApiExpense) => {
                    const isPending = expense.status === 'pending';
                    const isReviewing = reviewingId === expense.id;
                    return (
                      <div key={expense.id} className={`p-4 transition-colors ${isPending ? 'bg-warning/3 hover:bg-warning/5' : 'hover:bg-background-elevated/50'}`}>
                        <div className="flex items-start gap-3">
                          {/* Type icon */}
                          <div className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 mt-0.5 ${
                            expense.type === 'fuel' ? 'bg-warning/10' :
                            expense.type === 'maintenance' ? 'bg-info/10' :
                            expense.type === 'cleaning' ? 'bg-primary/10' :
                            expense.type === 'insurance' ? 'bg-accent/10' : 'bg-error/10'
                          }`}>
                            {expense.type === 'fuel' ? <Fuel className="h-4 w-4 text-warning" /> :
                             expense.type === 'maintenance' ? <Wrench className="h-4 w-4 text-info" /> :
                             <DollarSign className="h-4 w-4 text-error" />}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <p className="text-sm font-medium text-text-primary capitalize">{expense.type}</p>
                              <Badge
                                variant={expense.status === 'approved' ? 'success' : expense.status === 'rejected' ? 'error' : 'warning'}
                                className="text-[10px] px-1.5 py-0"
                              >
                                {expense.status}
                              </Badge>
                            </div>
                            {expense.description && (
                              <p className="text-xs text-text-muted truncate mb-0.5">{expense.description}</p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-text-muted">
                              {expense.submittedBy?.name && (
                                <span>by {expense.submittedBy.name}</span>
                              )}
                              <span>·</span>
                              <span>{formatTimestamp(expense.submittedAt)}</span>
                              {expense.receipt && (
                                <>
                                  <span>·</span>
                                  <a
                                    href={expense.receipt}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-accent hover:underline inline-flex items-center gap-0.5"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Receipt className="h-3 w-3" /> Receipt
                                  </a>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Amount + Actions */}
                          <div className="text-right shrink-0">
                            <p className="font-mono text-sm font-bold text-error mb-1">
                              -{weiToEth(expense.amount, 4)} ETH
                            </p>
                            {isPending && (
                              <div className="flex gap-1.5 justify-end">
                                <button
                                  onClick={() => handleReviewExpense(expense.id, 'approved')}
                                  disabled={isReviewing}
                                  title="Approve"
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-success/10 hover:bg-success/20 text-success text-xs font-medium transition-colors disabled:opacity-50"
                                >
                                  {isReviewing ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <ThumbsUp className="h-3 w-3" />
                                  )}
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReviewExpense(expense.id, 'rejected')}
                                  disabled={isReviewing}
                                  title="Reject"
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-error/10 hover:bg-error/20 text-error text-xs font-medium transition-colors disabled:opacity-50"
                                >
                                  {isReviewing ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <ThumbsDown className="h-3 w-3" />
                                  )}
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Driver Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.55 }}
              className="rounded-2xl border border-border bg-surface p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-lg text-text-primary">Driver</h3>
                {activeCar && (
                  <button
                    onClick={() => setShowAssignDriverModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    {activeCar.assignedDriver ? 'Change' : 'Assign'}
                  </button>
                )}
              </div>

              {activeCar?.assignedDriver ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-background-elevated">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10 shrink-0">
                    <Gauge className="h-5 w-5 text-success" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {activeCar.assignedDriver.user?.name}
                    </p>
                    <p className="text-xs text-text-muted">
                      {activeCar.assignedDriver.totalRides} rides · Active
                    </p>
                  </div>
                  <div className="flex h-2 w-2 rounded-full bg-success shrink-0 ml-auto" />
                </div>
              ) : (
                <div className="flex flex-col items-center py-4 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10 mb-3">
                    <Gauge className="h-6 w-6 text-warning" />
                  </div>
                  <p className="text-sm font-medium text-text-primary">No driver assigned</p>
                  <p className="text-xs text-text-muted mt-1">
                    Assign a driver to enable ride tracking
                  </p>
                </div>
              )}
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="rounded-2xl border border-border bg-surface p-6"
            >
              <h3 className="font-heading font-bold text-lg text-text-primary mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={() => setShowAnalyticsModal(true)}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => setShowHistoryModal(true)}>
                  <History className="h-4 w-4 mr-2" />
                  Revenue History
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => setShowMaintenanceModal(true)}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Maintenance
                </Button>
                <Button
                  variant={BigInt(stats.undistributed) > 0n ? 'accent' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setShowDistributeModal(true)}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Distribute Earnings
                  {BigInt(stats.undistributed) > 0n && (
                    <span className="ml-auto text-xs font-mono">{weiToEth(stats.undistributed, 3)} ETH</span>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Analytics Modal */}
      <AnimatePresence>
        {showAnalyticsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAnalyticsModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-surface rounded-2xl border border-border shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-border bg-surface">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-xl text-text-primary">Vehicle Analytics</h2>
                    <p className="text-sm text-text-muted">{activeCar?.name || `${activeCar?.make} ${activeCar?.model}`}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAnalyticsModal(false)}
                  className="p-2 rounded-lg hover:bg-background-hover transition-colors"
                >
                  <X className="h-5 w-5 text-text-muted" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Vehicle Stats */}
                <div>
                  <h3 className="font-medium text-text-primary mb-4">Vehicle Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-background-elevated">
                      <span className="text-sm text-text-muted">Car Name</span>
                      <span className="font-medium text-text-primary">
                        {activeCar?.name || `${activeCar?.make} ${activeCar?.model}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-background-elevated">
                      <span className="text-sm text-text-muted">Year</span>
                      <span className="font-medium text-text-primary">{activeCar?.year}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-background-elevated">
                      <span className="text-sm text-text-muted">Total Shares</span>
                      <span className="font-mono font-bold text-primary">{activeCar?.totalShares}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-background-elevated">
                      <span className="text-sm text-text-muted">Price Per Share</span>
                      <span className="font-mono font-bold text-success">
                        {activeCar ? weiToEth(activeCar.pricePerShare) : '0'} ETH
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-background-elevated">
                      <span className="text-sm text-text-muted">Status</span>
                      <Badge variant={activeCar?.status === 'active' ? 'success' : 'default'}>
                        {activeCar?.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Ride Statistics */}
                <div>
                  <h3 className="font-medium text-text-primary mb-4">Ride Statistics</h3>
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-text-muted">Total Rides</span>
                        <span className="text-2xl font-bold text-primary font-mono">{carRides.length}</span>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-success/5 border border-success/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-text-muted">Total Earnings</span>
                        <span className="text-xl font-bold text-success font-mono">{stats.gross} ETH</span>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-error/5 border border-error/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-text-muted">Total Expenses</span>
                        <span className="text-xl font-bold text-error font-mono">{stats.expenses} ETH</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Share Ownership */}
                <div>
                  <h3 className="font-medium text-text-primary mb-4">Share Ownership</h3>
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-accent/5 border border-accent/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-text-muted">Total Shareholders</span>
                        <span className="text-2xl font-bold text-accent font-mono">{shareholders.length}</span>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-info/5 border border-info/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-text-muted">Shares Sold</span>
                        <span className="text-xl font-bold text-info font-mono">
                          {sharesDistributed} / {activeCar?.totalShares ?? 0}
                        </span>
                      </div>
                      <Progress value={shareDistributionPct} className="h-2 mt-1" />
                    </div>
                    <div className="p-4 rounded-xl bg-success/5 border border-success/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-text-muted">Total Trades</span>
                        <span className="text-xl font-bold text-success font-mono">{carTrades.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 flex items-center justify-end p-6 border-t border-border bg-surface">
                <Button variant="outline" onClick={() => setShowAnalyticsModal(false)}>
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedule Maintenance Modal */}
      <AnimatePresence>
        {showMaintenanceModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={closeMaintenanceModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-surface rounded-2xl border border-border shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {!maintenanceScheduled ? (
                <>
                  <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10">
                        <Wrench className="h-5 w-5 text-info" />
                      </div>
                      <div>
                        <h2 className="font-heading font-bold text-lg text-text-primary">Schedule Maintenance</h2>
                        <p className="text-sm text-text-muted">{activeCar?.name || `${activeCar?.make} ${activeCar?.model}`}</p>
                      </div>
                    </div>
                    <button
                      onClick={closeMaintenanceModal}
                      className="p-2 rounded-lg hover:bg-background-hover transition-colors"
                    >
                      <X className="h-5 w-5 text-text-muted" />
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Maintenance Type
                      </label>
                      <select
                        value={maintenanceType}
                        onChange={(e) => setMaintenanceType(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-background border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="">Select type...</option>
                        <option value="oil">Oil Change</option>
                        <option value="tires">Tire Rotation</option>
                        <option value="brakes">Brake Inspection</option>
                        <option value="full">Full Service</option>
                        <option value="detailing">Detailing</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Preferred Date
                      </label>
                      <input
                        type="date"
                        value={maintenanceDate}
                        onChange={(e) => setMaintenanceDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-background border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>

                    <div className="p-3 rounded-lg bg-info/10 border border-info/20">
                      <p className="text-sm text-info">
                        The vehicle will be marked as unavailable during maintenance.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-6 border-t border-border">
                    <Button variant="outline" className="flex-1" onClick={closeMaintenanceModal}>
                      Cancel
                    </Button>
                    <Button
                      variant="default"
                      className="flex-1"
                      onClick={handleScheduleMaintenance}
                      disabled={!maintenanceDate || !maintenanceType}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule
                    </Button>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10 mx-auto mb-6"
                  >
                    <CheckCircle2 className="h-10 w-10 text-success" />
                  </motion.div>
                  <h3 className="font-heading font-bold text-xl text-text-primary mb-2">
                    Maintenance Scheduled!
                  </h3>
                  <p className="text-text-secondary mb-6">
                    Your vehicle maintenance has been scheduled for {maintenanceDate}
                  </p>
                  <Button variant="default" onClick={closeMaintenanceModal}>
                    Done
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Revenue History Modal */}
      <AnimatePresence>
        {showHistoryModal && activeCar && (
          <CarHistoryModal carId={activeCar.id} onClose={() => setShowHistoryModal(false)} />
        )}
      </AnimatePresence>

      {/* Distribute Earnings Modal (real on-chain) */}
      <AnimatePresence>
        {showDistributeModal && activeCar && (
          <DistributeModal car={activeCar} onClose={() => setShowDistributeModal(false)} />
        )}
      </AnimatePresence>

      {/* View All Rides Modal */}
      <AnimatePresence>
        {showRidesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowRidesModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-surface rounded-2xl border border-border shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-border bg-surface">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Navigation className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-xl text-text-primary">Ride History</h2>
                    <p className="text-sm text-text-muted">{activeCar?.name || `${activeCar?.make} ${activeCar?.model}`}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRidesModal(false)}
                  className="p-2 rounded-lg hover:bg-background-hover transition-colors"
                >
                  <X className="h-5 w-5 text-text-muted" />
                </button>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4 p-6 border-b border-border">
                <div className="text-center p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <p className="text-2xl font-bold text-primary">{carRides.length}</p>
                  <p className="text-xs text-text-muted">Total Rides</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-success/5 border border-success/20">
                  <p className="text-2xl font-bold text-success">
                    {stats.gross} ETH
                  </p>
                  <p className="text-xs text-text-muted">Total Earnings</p>
                </div>
              </div>

              {carRides.length === 0 ? (
                <div className="p-8 text-center">
                  <Navigation className="h-12 w-12 text-text-muted mx-auto mb-3" />
                  <p className="text-sm text-text-muted">No rides recorded yet</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {carRides.map((ride: ApiRide) => (
                    <div key={ride.id} className="p-4 hover:bg-background-elevated/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <p className="font-medium text-text-primary">
                              {ride.pickup} → {ride.dropoff}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-text-muted">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTimestamp(ride.timestamp)}
                            </span>
                            {ride.car?.name && <span>{ride.car.name}</span>}
                          </div>
                        </div>
                        <Badge variant="success" size="lg">+{weiToEth(ride.grossEarnings)} ETH</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="sticky bottom-0 flex items-center justify-end p-6 border-t border-border bg-surface">
                <Button variant="outline" onClick={() => setShowRidesModal(false)}>
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View All Expenses Modal */}
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
              className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-surface rounded-2xl border border-border shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="shrink-0 flex items-center justify-between p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
                    <Receipt className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-xl text-text-primary">All Expenses</h2>
                    <p className="text-sm text-text-muted">{activeCar?.name} · {carExpenses.length} total</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowExpensesModal(false)}
                  className="p-2 rounded-lg hover:bg-background-hover transition-colors"
                >
                  <X className="h-5 w-5 text-text-muted" />
                </button>
              </div>

              {/* Summary row */}
              <div className="shrink-0 grid grid-cols-3 gap-3 p-5 border-b border-border">
                <div className="p-3 rounded-xl bg-warning/5 border border-warning/20 text-center">
                  <p className="text-lg font-bold text-warning font-mono">
                    {carExpenses.filter((e) => e.status === 'pending').length}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">Pending</p>
                </div>
                <div className="p-3 rounded-xl bg-success/5 border border-success/20 text-center">
                  <p className="text-lg font-bold text-success font-mono">
                    {carExpenses.filter((e) => e.status === 'approved').length}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">Approved</p>
                </div>
                <div className="p-3 rounded-xl bg-error/5 border border-error/20 text-center">
                  <p className="text-lg font-bold text-error font-mono">
                    -{weiToEth(
                      carExpenses
                        .filter((e) => e.status === 'approved')
                        .reduce((s, e) => s + BigInt(e.amount), 0n)
                        .toString(),
                      4,
                    )} ETH
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">Approved Total</p>
                </div>
              </div>

              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto divide-y divide-border">
                {carExpenses.length === 0 ? (
                  <div className="p-12 text-center">
                    <Fuel className="h-10 w-10 text-text-muted mx-auto mb-3 opacity-30" />
                    <p className="text-text-muted">No expenses submitted yet.</p>
                  </div>
                ) : (
                  carExpenses.map((expense: ApiExpense) => {
                    const isPending = expense.status === 'pending';
                    const isReviewing = reviewingId === expense.id;
                    return (
                      <div key={expense.id} className={`p-5 transition-colors ${isPending ? 'bg-warning/3 hover:bg-warning/5' : 'hover:bg-background-elevated/50'}`}>
                        <div className="flex items-start gap-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 mt-0.5 ${
                            expense.type === 'fuel' ? 'bg-warning/10' :
                            expense.type === 'maintenance' ? 'bg-info/10' :
                            expense.type === 'cleaning' ? 'bg-primary/10' :
                            expense.type === 'insurance' ? 'bg-accent/10' : 'bg-error/10'
                          }`}>
                            {expense.type === 'fuel' ? <Fuel className="h-4 w-4 text-warning" /> :
                             expense.type === 'maintenance' ? <Wrench className="h-4 w-4 text-info" /> :
                             <DollarSign className="h-4 w-4 text-error" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <p className="text-sm font-medium text-text-primary capitalize">{expense.type}</p>
                              <Badge
                                variant={expense.status === 'approved' ? 'success' : expense.status === 'rejected' ? 'error' : 'warning'}
                                className="text-[10px] px-1.5 py-0"
                              >
                                {expense.status}
                              </Badge>
                            </div>
                            {expense.description && (
                              <p className="text-xs text-text-muted mb-0.5">{expense.description}</p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-text-muted flex-wrap">
                              {expense.submittedBy?.name && <span>by {expense.submittedBy.name}</span>}
                              <span>·</span>
                              <span>{new Date(expense.submittedAt).toLocaleDateString()}</span>
                              {expense.receipt && (
                                <>
                                  <span>·</span>
                                  <a
                                    href={expense.receipt}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-accent hover:underline inline-flex items-center gap-0.5"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Receipt className="h-3 w-3" /> Receipt
                                  </a>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="font-mono text-sm font-bold text-error mb-1.5">
                              -{weiToEth(expense.amount, 4)} ETH
                            </p>
                            {isPending && (
                              <div className="flex gap-1.5 justify-end">
                                <button
                                  onClick={() => handleReviewExpense(expense.id, 'approved')}
                                  disabled={isReviewing}
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-success/10 hover:bg-success/20 text-success text-xs font-medium transition-colors disabled:opacity-50"
                                >
                                  {isReviewing ? <Loader2 className="h-3 w-3 animate-spin" /> : <ThumbsUp className="h-3 w-3" />}
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReviewExpense(expense.id, 'rejected')}
                                  disabled={isReviewing}
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-error/10 hover:bg-error/20 text-error text-xs font-medium transition-colors disabled:opacity-50"
                                >
                                  {isReviewing ? <Loader2 className="h-3 w-3 animate-spin" /> : <ThumbsDown className="h-3 w-3" />}
                                  Reject
                                </button>
                              </div>
                            )}
                            {!isPending && (
                              <p className="text-xs text-text-muted">
                                {expense.approvedAt ? new Date(expense.approvedAt).toLocaleDateString() : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="shrink-0 flex items-center justify-end p-5 border-t border-border">
                <Button variant="outline" onClick={() => setShowExpensesModal(false)}>Close</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Find/Assign Drivers Modal */}
      <AnimatePresence>
        {showAssignDriverModal && activeCar && (
          <AssignDriverModal
            car={activeCar}
            onClose={() => setShowAssignDriverModal(false)}
          />
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
                    <p className="text-sm text-text-muted">
                      {activeCar ? activeCar.name : 'Car'} · Immediately deducted from revenue
                    </p>
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
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Description <span className="text-text-muted font-normal">(optional)</span>
                  </label>
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
                    As the car owner your expenses are{' '}
                    <span className="font-semibold text-warning">automatically approved</span> and instantly deducted from undistributed revenue. All shareholders will be notified.
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
                  onClick={handleLogOwnerExpense}
                  disabled={
                    submitOwnerExpense.isPending ||
                    !activeCar ||
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
