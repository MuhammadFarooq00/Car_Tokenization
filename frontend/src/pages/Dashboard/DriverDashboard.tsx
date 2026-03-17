import { motion, AnimatePresence } from 'framer-motion';
import {
  Gauge, Car, DollarSign, ChevronRight, Plus, Clock,
  Fuel, MapPin, Star, Calendar, Navigation, X, Loader2, FileText, Wrench,
  AlertTriangle, Lock,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useDriverProfile, useDriverStats, useDriverRides, useDriverExpenses } from '@/hooks/api/useDriverApi';
import { useCar } from '@/hooks/api/useCarsApi';
import { weiToEth } from '@/lib/utils';

const EXPENSE_ICONS: Record<string, typeof Fuel> = {
  fuel: Fuel,
  maintenance: Wrench,
  cleaning: Car,
  other: DollarSign,
  insurance: FileText,
};

/** Compute a human-friendly "time ago" label from an ISO timestamp. */
function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function DriverDashboard() {
  const { user } = useAuth();
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const { data: driverProfile, isLoading: profileLoading } = useDriverProfile();
  const { data: driverStats } = useDriverStats();
  const { data: ridesResponse } = useDriverRides({ page: 1, limit: 5 });
  const { data: expensesResponse } = useDriverExpenses({ page: 1, limit: 5 });

  // Fetch full car data (including primarySaleActive) for assigned car
  const assignedCarId = driverProfile?.assignedCarId ?? 0;
  const { data: assignedCarFull } = useCar(assignedCarId);

  const rides = ridesResponse?.data ?? [];
  const recentExpenses = expensesResponse?.data ?? [];
  const assignedCars = driverProfile?.assignedCar ? [driverProfile.assignedCar] : [];

  // Is the assigned car still in primary sale mode? Drivers cannot log rides until owner closes it.
  const carSalePending = assignedCarId > 0 && (assignedCarFull?.primarySaleActive ?? false);

  // Stats come from the dedicated /drivers/stats endpoint (server-side aggregation)
  const weekProgress = useMemo(() => {
    const weekHours = driverStats?.weekHours ?? 0;
    return Math.min(100, (weekHours / 40) * 100);
  }, [driverStats?.weekHours]);

  const stats = {
    monthEarnings: driverStats ? weiToEth(driverStats.monthEarnings, 4) : '0',
    monthRides: driverStats?.monthRides ?? 0,
    weekHours: driverStats?.weekHours ?? 0,
    weekProgress,
    todayEarnings: driverStats ? weiToEth(driverStats.todayEarnings, 4) : '0',
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <section className="relative py-12 lg:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-success/5 via-background to-background" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-success/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-6"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20 mb-4">
                <Gauge className="h-4 w-4 text-success" />
                <span className="text-sm font-medium text-success">Driver Dashboard</span>
              </div>

              <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-2">
                Welcome back, {user?.name?.split(' ')[0] || 'Driver'}
              </h1>
              <p className="text-text-secondary">
                Track your rides, manage your schedule, and view your earnings
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowScheduleModal(true)}>
                <Calendar className="h-4 w-4 mr-2" />
                View Schedule
              </Button>
              {carSalePending ? (
                <Button variant="warning" disabled title="Car not cleared for road — owner must close the share sale first">
                  <Lock className="h-4 w-4 mr-2" />
                  Rides Locked
                </Button>
              ) : (
                <Link to="/driver/log-ride">
                  <Button variant="success">
                    <Plus className="h-4 w-4 mr-2" />
                    Log New Ride
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container py-12">

        {/* ── Sale-pending locked banner ───────────────────────────────────────── */}
        {carSalePending && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-2xl border border-warning/40 bg-warning/5 overflow-hidden"
          >
            <div className="flex items-start gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-warning/15">
                <Lock className="h-6 w-6 text-warning" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-bold text-text-primary text-lg mb-1">
                  Car Not Yet Cleared for Road Operations
                </p>
                <p className="text-sm text-text-secondary leading-relaxed">
                  <span className="font-medium text-warning">{assignedCarFull?.name ?? 'Your assigned car'}</span> is
                  still in its primary share sale phase. The car owner must close the public share sale
                  (withdraw remaining shares on-chain) before you can log rides or expenses.
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-warning/10 border border-warning/20">
                    <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                    <span className="text-xs font-medium text-warning">Rides blocked until sale closes</span>
                  </div>
                  {assignedCarFull && (
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <span>
                        {assignedCarFull.sharesSold ?? 0} / {assignedCarFull.publicSupply ?? assignedCarFull.totalShares} shares sold
                        · {assignedCarFull.remainingPublicSupply ?? 0} unsold
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <div className="p-5 rounded-2xl bg-surface border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <span className="text-sm text-text-muted">This Month</span>
            </div>
            <p className="font-heading text-2xl font-bold text-success font-mono">
              {stats.monthEarnings} ETH
            </p>
            <p className="text-sm text-text-muted mt-2">
              {stats.monthRides} rides this month
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Navigation className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm text-text-muted">Monthly Rides</span>
            </div>
            <p className="font-heading text-2xl font-bold text-text-primary font-mono">
              {stats.monthRides}
            </p>
            <p className="text-sm text-text-muted mt-2">
              {driverProfile?.totalRides ?? 0} total all-time
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
                <Star className="h-5 w-5 text-warning" />
              </div>
              <span className="text-sm text-text-muted">Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="font-heading text-2xl font-bold text-text-primary font-mono">
                {driverProfile?.rating?.toFixed(1) ?? '0.0'}
              </p>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i <= Math.floor(driverProfile?.rating ?? 0) ? 'text-warning fill-warning' : 'text-border'}`}
                  />
                ))}
              </div>
            </div>
            <p className="text-sm text-text-muted mt-2">
              {driverProfile?.totalRides ?? 0} rides
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10">
                <Clock className="h-5 w-5 text-info" />
              </div>
              <span className="text-sm text-text-muted">Hours This Week</span>
            </div>
            <p className="font-heading text-2xl font-bold text-text-primary font-mono">
              {stats.weekHours > 0 ? `${stats.weekHours}h` : '0h'}
            </p>
            <Progress
              value={stats.weekProgress}
              className="h-2 mt-2"
            />
            <p className="text-xs text-text-muted mt-1">
              {stats.weekHours > 0
                ? `${stats.weekHours} hrs driven this week`
                : 'No rides this week yet'}
            </p>
          </div>
        </motion.div>

        {/* Assigned Cars */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="font-heading font-bold text-xl text-text-primary mb-4">Assigned Vehicles</h2>

          {assignedCars.length === 0 ? (
            <div className="p-8 rounded-2xl border border-border bg-surface text-center">
              <Car className="h-10 w-10 text-text-muted mx-auto mb-3" />
              <p className="text-text-muted">No vehicles assigned yet.</p>
              <Link to="/driver/apply" className="inline-block mt-3">
                <Button variant="outline" size="sm">Apply for a Car</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {assignedCars.map((car) => (
                <div
                  key={car.id}
                  className="flex rounded-2xl border border-border bg-surface overflow-hidden hover:border-success/30 transition-colors"
                >
                  {/* Image */}
                  <div className="w-36 h-auto shrink-0 bg-background-elevated relative">
                    <div className="w-full h-full flex items-center justify-center bg-background-elevated">
                      <Car className="h-10 w-10 text-text-muted" />
                    </div>
                    <div className="absolute top-2 left-2">
                      {carSalePending ? (
                        <Badge variant="warning" className="backdrop-blur-md text-xs">
                          <Lock className="h-2.5 w-2.5 mr-1" />
                          Sale Open
                        </Badge>
                      ) : (
                        <Badge variant="success" className="backdrop-blur-md text-xs">
                          <div className="w-1.5 h-1.5 bg-success rounded-full mr-1 animate-pulse" />
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-5">
                    <h3 className="font-heading font-bold text-text-primary mb-1">
                      {car.name}
                    </h3>
                    <p className="text-sm text-text-muted mb-4">
                      Owner: {car.owner?.name ?? 'Unknown'}
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2 rounded-lg bg-background-elevated/50">
                        <p className="text-xs text-text-muted">Last Ride</p>
                        <p className="text-sm font-medium text-text-primary">
                          {rides.length > 0 ? timeAgo(rides[0].timestamp) : 'No rides yet'}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-background-elevated/50">
                        <p className="text-xs text-text-muted">Today</p>
                        <p className="text-sm font-medium text-success">+{stats.todayEarnings} ETH</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Top row: Recent Rides + Quick Actions (2 columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Recent Rides */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="rounded-2xl border border-border bg-surface overflow-hidden h-full">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Navigation className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-lg text-text-primary">Recent Rides</h2>
                    <p className="text-sm text-text-muted">Your ride history</p>
                  </div>
                </div>
                <Link to="/driver/rides">
                  <Button variant="ghost" size="sm">
                    View All
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>

              <div className="divide-y divide-border">
                {rides.length === 0 ? (
                  <div className="p-8 text-center">
                    <Navigation className="h-8 w-8 text-text-muted mx-auto mb-2" />
                    <p className="text-text-muted">No rides yet.</p>
                  </div>
                ) : (
                  rides.map((ride) => (
                    <div key={ride.id} className="p-4 hover:bg-background-elevated/50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background-elevated shrink-0">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-text-primary">
                            {ride.car?.name ?? `Car #${ride.carId}`}
                          </p>
                          <p className="text-sm text-text-muted truncate">
                            {ride.pickup} → {ride.dropoff}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-text-muted">{ride.distance} km</span>
                            <span className="text-xs text-text-muted">
                              {new Date(ride.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-mono font-medium text-success">+{weiToEth(ride.grossEarnings)} ETH</p>
                          <p className="text-[10px] text-text-muted">Yours: {weiToEth(ride.netEarnings)} ETH</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>

          {/* Quick Actions + Upcoming Schedule */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="space-y-6"
          >
            {/* Quick Actions */}
            <div className="rounded-2xl border border-border bg-surface p-6">
              <h2 className="font-heading font-bold text-lg text-text-primary mb-4">Quick Actions</h2>

              <div className="grid grid-cols-2 gap-3">
                {carSalePending ? (
                  <button
                    disabled
                    title="Rides blocked — car sale not yet closed"
                    className="flex flex-col items-center gap-2 py-4 px-3 w-full rounded-xl border border-border bg-transparent text-sm font-semibold transition-all opacity-50 cursor-not-allowed"
                  >
                    <Lock className="h-5 w-5 text-warning" />
                    <span className="text-warning text-xs font-medium">Locked</span>
                  </button>
                ) : (
                  <Link to="/driver/log-ride" className="block">
                    <button className="flex flex-col items-center gap-2 py-4 px-3 w-full rounded-xl border border-border bg-transparent text-text-primary text-sm font-semibold hover:bg-background-hover hover:border-primary/50 transition-all">
                      <Plus className="h-5 w-5" />
                      <span className="text-xs font-medium">Log Ride</span>
                    </button>
                  </Link>
                )}
                {carSalePending ? (
                  <button
                    disabled
                    title="Expenses blocked — car sale not yet closed"
                    className="flex flex-col items-center gap-2 py-4 px-3 w-full rounded-xl border border-border bg-transparent text-sm font-semibold transition-all opacity-50 cursor-not-allowed"
                  >
                    <Lock className="h-5 w-5 text-warning" />
                    <span className="text-warning text-xs font-medium">Locked</span>
                  </button>
                ) : (
                  <Link to="/driver/log-expense" className="block">
                    <button className="flex flex-col items-center gap-2 py-4 px-3 w-full rounded-xl border border-border bg-transparent text-text-primary text-sm font-semibold hover:bg-background-hover hover:border-primary/50 transition-all">
                      <Fuel className="h-5 w-5" />
                      <span className="text-xs font-medium">Log Expense</span>
                    </button>
                  </Link>
                )}
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="flex flex-col items-center gap-2 py-4 px-3 w-full rounded-xl border border-border bg-transparent text-text-primary text-sm font-semibold hover:bg-background-hover hover:border-primary/50 transition-all"
                >
                  <Calendar className="h-5 w-5" />
                  <span className="text-xs font-medium">Schedule</span>
                </button>
                {/* <Link to="/driver/apply" className="block">
                  <button className="flex flex-col items-center gap-2 py-4 px-3 w-full rounded-xl border border-border bg-transparent text-text-primary text-sm font-semibold hover:bg-background-hover hover:border-primary/50 transition-all">
                    <Car className="h-5 w-5" />
                    <span className="text-xs font-medium">Apply for Car</span>
                  </button>
                </Link> */}
                <Link to="/driver/my-applications" className="block">
                  <button className="flex flex-col items-center gap-2 py-4 px-3 w-full rounded-xl border border-border bg-transparent text-text-primary text-sm font-semibold hover:bg-background-hover hover:border-primary/50 transition-all">
                    <FileText className="h-5 w-5" />
                    <span className="text-xs font-medium">My Applications</span>
                  </button>
                </Link>
              </div>
            </div>

            {/* Upcoming Schedule */}
            <div className="rounded-2xl border border-border bg-surface overflow-hidden">
              <div className="p-6 border-b border-border flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                  <Calendar className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-lg text-text-primary">Upcoming Schedule</h2>
                  <p className="text-sm text-text-muted">Your assigned shifts</p>
                </div>
              </div>

              <div className="divide-y divide-border">
                <div className="p-8 text-center">
                  <Calendar className="h-8 w-8 text-text-muted mx-auto mb-2" />
                  <p className="text-text-muted">Schedule feature coming soon</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom row: Recent Expenses (full width) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="rounded-2xl border border-border bg-surface overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
                  <Fuel className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-lg text-text-primary">Recent Expenses</h2>
                  <p className="text-sm text-text-muted">Your expense claims</p>
                </div>
              </div>
              <Link to="/driver/expenses">
                <Button variant="ghost" size="sm">
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>

            {recentExpenses.length === 0 ? (
              <div className="p-8 text-center">
                <Fuel className="h-8 w-8 text-text-muted mx-auto mb-2" />
                <p className="text-text-muted mb-3">No expenses yet.</p>
                {carSalePending ? (
                  <Button variant="outline" size="sm" disabled className="opacity-50 cursor-not-allowed" title="Expenses blocked — car sale not yet closed">
                    <Lock className="h-4 w-4 mr-1 text-warning" />
                    Locked
                  </Button>
                ) : (
                  <Link to="/driver/log-expense">
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Log Expense
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
                {recentExpenses.map((expense) => {
                  const Icon = EXPENSE_ICONS[expense.type] || DollarSign;
                  return (
                    <div key={expense.id} className="p-4 hover:bg-background-elevated/50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background-elevated shrink-0">
                          <Icon className="h-5 w-5 text-warning" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-text-primary capitalize">{expense.type}</p>
                          <p className="text-sm text-text-muted truncate">
                            {expense.car?.name ?? `Car #${expense.carId}`}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-text-muted">
                              {new Date(expense.submittedAt).toLocaleDateString()}
                            </span>
                            <Badge
                              variant={expense.status === 'approved' ? 'success' : expense.status === 'rejected' ? 'error' : 'warning'}
                              className="text-[10px] px-1.5 py-0"
                            >
                              {expense.status}
                            </Badge>
                            {expense.receipt && (
                              <Badge variant="default" className="text-[10px] px-1.5 py-0">
                                <FileText className="h-2.5 w-2.5 mr-0.5" />
                                Receipt
                              </Badge>
                            )}
                          </div>
                        </div>

                        <p className="font-mono font-medium text-error shrink-0">-{weiToEth(expense.amount)} ETH</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Schedule Modal */}
      <AnimatePresence>
        {showScheduleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowScheduleModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-surface rounded-2xl border border-border shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-border bg-surface">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                    <Calendar className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-xl text-text-primary">My Schedule</h2>
                    <p className="text-sm text-text-muted">Your upcoming driving shifts</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="p-2 rounded-lg hover:bg-background-hover transition-colors"
                >
                  <X className="h-5 w-5 text-text-muted" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* This Week */}
                <div className="mb-6">
                  <h3 className="font-heading font-semibold text-text-primary mb-4">This Week</h3>
                  <div className="space-y-3">
                    <div className="p-6 text-center rounded-xl border border-border bg-background-elevated/30">
                      <Calendar className="h-8 w-8 text-text-muted mx-auto mb-2" />
                      <p className="text-text-muted">Schedule feature coming soon</p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-background-elevated/50 border border-border">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{driverProfile?.totalRides ?? 0}</p>
                    <p className="text-xs text-text-muted">Total Rides</p>
                  </div>
                  <div className="text-center border-x border-border">
                    <p className="text-2xl font-bold text-accent">{driverProfile?.rating?.toFixed(1) ?? '0.0'}</p>
                    <p className="text-xs text-text-muted">Rating</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-success">0</p>
                    <p className="text-xs text-text-muted">Shifts</p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 flex items-center justify-end gap-3 p-6 border-t border-border bg-surface">
                <Button variant="outline" onClick={() => setShowScheduleModal(false)}>
                  Close
                </Button>
                <Button variant="default">
                  <Plus className="h-4 w-4 mr-2" />
                  Request Time Off
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
