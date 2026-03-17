import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, ChevronLeft, ChevronRight, TrendingUp, Clock,
  Download, Car, Calendar, CheckCircle2, ArrowUpRight,
  Fuel, Wrench, Gauge, Users, Wallet, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import type { RegularUserRole } from '@/types/auth';
import type { ApiDividend, ApiExpense, ApiRide, ApiCar } from '@/types/api';

// API hooks
import { usePortfolioSummary, usePortfolioDividends } from '@/hooks/api/usePortfolioApi';
import { useMyOwnedCars } from '@/hooks/api/useCarsApi';
import { useDriverRides, useDriverExpenses } from '@/hooks/api/useDriverApi';
import { weiToEth } from '@/lib/utils';

// Role tab configuration
const ROLE_CONFIG: Record<RegularUserRole, { label: string; icon: typeof TrendingUp; color: string; bgColor: string }> = {
  investor: { label: 'Investment Dividends', icon: TrendingUp, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
  car_owner: { label: 'Fleet Earnings', icon: Car, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  driver: { label: 'Driving Income', icon: Gauge, color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
};

export function Earnings() {
  const { user, hasRole } = useAuth();

  // Get user's available roles (excluding admin)
  const userRoles = (user?.roles?.filter(r => r !== 'admin') || ['investor']) as RegularUserRole[];
  const [activeRole, setActiveRole] = useState<RegularUserRole>(userRoles[0]);

  // ─── API hooks ───────────────────────────────────────────────────────────────
  const { data: portfolio } = usePortfolioSummary();
  const { data: dividendsResponse } = usePortfolioDividends({ page: 1, limit: 10 });
  const { data: ownedCars } = useMyOwnedCars();
  const { data: ridesResponse } = useDriverRides({ page: 1, limit: 10 });
  const { data: expensesResponse } = useDriverExpenses({ page: 1, limit: 10 });

  // ─── Derived data ────────────────────────────────────────────────────────────
  const dividends = dividendsResponse?.data ?? [];
  const cars = ownedCars ?? [];
  const rides = ridesResponse?.data ?? [];
  const expenses = expensesResponse?.data ?? [];

  // Calculate total earnings across all roles
  const investorTotal = portfolio ? parseFloat(weiToEth(portfolio.totalDividends)) : 0;
  const driverTotal = rides.reduce((sum, r) => sum + parseFloat(weiToEth(r.grossEarnings)), 0);
  const totalEarnings =
    (hasRole('investor') ? investorTotal : 0) +
    (hasRole('car_owner') ? 0 : 0) +
    (hasRole('driver') ? driverTotal : 0);

  const pendingTotal =
    (hasRole('investor') ? dividends.filter(d => d.status === 'pending').reduce((s, d) => s + parseFloat(weiToEth(d.amount)), 0) : 0) +
    (hasRole('car_owner') ? 0 : 0) +
    (hasRole('driver') ? 0 : 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <section className="relative py-12 lg:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-success/5 via-background to-background" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-success/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-6"
          >
            <div>
              <Link
                to="/dashboard"
                className="inline-flex me-4 items-center gap-2 text-text-secondary hover:text-primary transition-colors mb-6"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20 mb-4">
                <DollarSign className="h-4 w-4 text-success" />
                <span className="text-sm font-medium text-success">Earnings Overview</span>
              </div>

              <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-2">
                Your Earnings
              </h1>
              <p className="text-text-secondary">
                Track all your income across investments, fleet operations, and driving activities
              </p>
            </div>

            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </motion.div>
        </div>
      </section>

      <div className="container py-12">
        {/* Combined Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <div className="p-5 rounded-2xl bg-gradient-to-br from-success/10 to-success/5 border border-success/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/20">
                <Wallet className="h-5 w-5 text-success" />
              </div>
              <span className="text-sm text-text-muted">Total Earnings</span>
            </div>
            <p className="font-heading text-2xl font-bold text-success font-mono">
              {totalEarnings.toFixed(4)} ETH
            </p>
            <p className="text-xs text-success/80 mt-1">All-time across all roles</p>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <span className="text-sm text-text-muted">Pending</span>
            </div>
            <p className="font-heading text-2xl font-bold text-warning font-mono">
              {pendingTotal.toFixed(4)} ETH
            </p>
            <Button size="sm" variant="accent" className="mt-2">
              Claim All
            </Button>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm text-text-muted">This Month</span>
            </div>
            <p className="font-heading text-2xl font-bold text-gradient font-mono">
              -- ETH
            </p>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3 text-text-muted" />
              <span className="text-xs text-text-muted">No monthly breakdown</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                <Calendar className="h-5 w-5 text-accent" />
              </div>
              <span className="text-sm text-text-muted">Next Payout</span>
            </div>
            <p className="font-heading text-2xl font-bold text-text-primary font-mono">
              5 days
            </p>
            <Progress value={60} className="h-2 mt-2" />
          </div>
        </motion.div>

        {/* Role-specific breakdown cards */}
        {userRoles.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          >
            {hasRole('investor') && (
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                  <TrendingUp className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-text-muted">Investment Dividends</p>
                  <p className="font-heading text-xl font-bold text-emerald-400 font-mono">
                    {portfolio ? weiToEth(portfolio.totalDividends) : '0'} ETH
                  </p>
                </div>
              </div>
            )}
            {hasRole('car_owner') && (
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                  <Car className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-text-muted">Fleet Net Profit</p>
                  <p className="font-heading text-xl font-bold text-blue-400 font-mono">
                    -- ETH
                  </p>
                </div>
              </div>
            )}
            {hasRole('driver') && (
              <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
                  <Gauge className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-text-muted">Driving Income</p>
                  <p className="font-heading text-xl font-bold text-purple-400 font-mono">
                    {driverTotal.toFixed(4)} ETH
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Role Tabs */}
        {userRoles.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap gap-2 mb-6"
          >
            {userRoles.map((role) => {
              const config = ROLE_CONFIG[role];
              const Icon = config.icon;
              return (
                <Button
                  key={role}
                  variant={activeRole === role ? 'default' : 'outline'}
                  onClick={() => setActiveRole(role)}
                  className={activeRole === role ? '' : ''}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {config.label}
                </Button>
              );
            })}
          </motion.div>
        )}

        {/* Role-specific Content */}
        <AnimatePresence mode="wait">
          {activeRole === 'investor' && hasRole('investor') && (
            <InvestorEarningsSection
              portfolio={portfolio}
              dividends={dividends}
            />
          )}
          {activeRole === 'car_owner' && hasRole('car_owner') && (
            <OwnerEarningsSection
              cars={cars}
              expenses={expenses}
            />
          )}
          {activeRole === 'driver' && hasRole('driver') && (
            <DriverEarningsSection
              rides={rides}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Investor Earnings Section ─────────────────────────────────────────────────

function InvestorEarningsSection({
  portfolio,
  dividends,
}: {
  portfolio: ReturnType<typeof usePortfolioSummary>['data'];
  dividends: ApiDividend[];
}) {
  const holdings = portfolio?.holdings ?? [];

  return (
    <motion.div
      key="investor"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      {/* Holdings Distribution */}
      <div className="lg:col-span-2 rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="font-heading font-bold text-lg text-text-primary">
            Dividend Distribution by Holding
          </h3>
          <p className="text-sm text-text-muted mt-1">
            Your share of net profit from each investment
          </p>
        </div>

        <div className="divide-y divide-border">
          {holdings.length === 0 && (
            <div className="p-6 text-center text-text-muted">No holdings found.</div>
          )}
          {holdings.map((holding) => {
            const ownershipPct = holding.car.totalShares > 0
              ? (holding.shares / holding.car.totalShares * 100).toFixed(0)
              : '0';
            return (
              <div key={holding.car.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                      <Car className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{holding.car.name}</p>
                      <p className="text-sm text-text-muted">
                        {holding.shares} / {holding.car.totalShares} shares ({ownershipPct}%)
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {holding.shares} shares
                  </Badge>
                </div>

                <div className="p-4 rounded-xl bg-background-elevated space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Share Value</span>
                    <span className="font-mono text-text-primary">{weiToEth(holding.value)} ETH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Your Ownership</span>
                    <span className="font-mono text-text-primary">{ownershipPct}%</span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between">
                    <span className="font-medium text-text-primary">Approx. Dividend</span>
                    <span className="font-mono font-bold text-emerald-400">{weiToEth(holding.value)} ETH</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Pending Claim */}
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
              <ArrowUpRight className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-text-primary">Pending Dividends</h3>
              <p className="text-sm text-text-muted">Claimable now</p>
            </div>
          </div>
          <p className="font-heading text-3xl font-bold text-emerald-400 mb-4">
            {portfolio ? weiToEth(portfolio.totalDividends) : '0'} ETH
          </p>
          <Button variant="default" className="w-full bg-emerald-500 hover:bg-emerald-600">
            Claim Dividends
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Dividend History */}
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-heading font-bold text-text-primary">Dividend History</h3>
          </div>
          <div className="divide-y divide-border">
            {dividends.length === 0 && (
              <div className="p-4 text-center text-text-muted text-sm">No dividend history yet.</div>
            )}
            {dividends.map((div) => (
              <div key={div.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className={`h-5 w-5 ${div.status === 'completed' ? 'text-success' : 'text-warning'}`} />
                  <div>
                    <p className="font-medium text-text-primary text-sm">
                      {new Date(div.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-text-muted">{div.car?.name ?? `Car #${div.carId}`}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={div.status === 'completed' ? 'success' : 'secondary'}>
                    +{weiToEth(div.amount)} ETH
                  </Badge>
                  <p className="text-xs text-text-muted mt-1 capitalize">{div.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Owner Earnings Section ────────────────────────────────────────────────────

function OwnerEarningsSection({
  cars,
  expenses,
}: {
  cars: ApiCar[];
  expenses: ApiExpense[];
}) {
  return (
    <motion.div
      key="owner"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      {/* Fleet Earnings Table */}
      <div className="lg:col-span-2 rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="font-heading font-bold text-lg text-text-primary">
            Fleet Performance
          </h3>
          <p className="text-sm text-text-muted mt-1">
            Earnings breakdown by vehicle
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase">Vehicle</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-text-muted uppercase">Gross</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-text-muted uppercase">Expenses</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-text-muted uppercase">Net</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-text-muted uppercase">Price/Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {cars.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-text-muted">No owned vehicles found.</td>
                </tr>
              )}
              {cars.map((car) => (
                <tr key={car.id} className="hover:bg-background-elevated/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                        <Car className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">{car.name}</p>
                        <Badge variant={car.status === 'active' ? 'success' : 'secondary'} className="mt-1">
                          {car.status}
                        </Badge>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-text-muted">--</td>
                  <td className="px-6 py-4 text-right font-mono text-text-muted">--</td>
                  <td className="px-6 py-4 text-right font-mono text-text-muted">--</td>
                  <td className="px-6 py-4 text-right font-mono text-blue-400">{weiToEth(car.pricePerShare)} ETH</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-background-elevated/30">
                <td className="px-6 py-4 font-medium text-text-primary">
                  Total ({cars.length} vehicles)
                </td>
                <td className="px-6 py-4 text-right font-mono text-text-muted">--</td>
                <td className="px-6 py-4 text-right font-mono text-text-muted">--</td>
                <td className="px-6 py-4 text-right font-mono text-text-muted">--</td>
                <td className="px-6 py-4 text-right font-mono text-text-muted">--</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Pending Distribution */}
        <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-text-primary">Shareholder Distribution</h3>
              <p className="text-sm text-text-muted">Ready to distribute</p>
            </div>
          </div>
          <p className="font-heading text-3xl font-bold text-blue-400 mb-4">
            -- ETH
          </p>
          <Button variant="default" className="w-full bg-blue-500 hover:bg-blue-600">
            Distribute to Shareholders
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Expense Breakdown */}
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-error/10">
              <Fuel className="h-4 w-4 text-error" />
            </div>
            <h3 className="font-heading font-bold text-text-primary">Expense Breakdown</h3>
          </div>
          <div className="p-4 space-y-4">
            {expenses.length === 0 && (
              <p className="text-center text-text-muted text-sm">No expenses recorded.</p>
            )}
            {expenses.slice(0, 5).map((expense) => (
              <div key={expense.id}>
                <div className="flex justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {expense.type === 'fuel' && <Fuel className="h-4 w-4 text-warning" />}
                    {expense.type === 'maintenance' && <Wrench className="h-4 w-4 text-info" />}
                    {expense.type === 'cleaning' && <Car className="h-4 w-4 text-success" />}
                    {!['fuel', 'maintenance', 'cleaning'].includes(expense.type) && <Wrench className="h-4 w-4 text-text-muted" />}
                    <span className="text-sm text-text-primary capitalize">{expense.type}</span>
                  </div>
                  <span className="font-mono text-sm text-text-primary">{weiToEth(expense.amount)} ETH</span>
                </div>
                <p className="text-xs text-text-muted">
                  {expense.car?.name ?? `Car #${expense.carId}`} &middot; {expense.status}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Driver Earnings Section ───────────────────────────────────────────────────

function DriverEarningsSection({
  rides,
}: {
  rides: ApiRide[];
}) {
  const totalGross = rides.reduce((sum, r) => sum + parseFloat(weiToEth(r.grossEarnings)), 0);
  const totalCommission = rides.reduce((sum, r) => sum + parseFloat(weiToEth(r.commission)), 0);
  const totalNet = rides.reduce((sum, r) => sum + parseFloat(weiToEth(r.netEarnings)), 0);

  return (
    <motion.div
      key="driver"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      {/* Ride-by-Ride Earnings */}
      <div className="lg:col-span-2 rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="font-heading font-bold text-lg text-text-primary">
            Ride-by-Ride Earnings
          </h3>
          <p className="text-sm text-text-muted mt-1">
            Detailed breakdown of each ride with platform commission
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase">Ride</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-text-muted uppercase">Gross</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-text-muted uppercase">Commission</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-text-muted uppercase">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rides.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-text-muted">No rides recorded yet.</td>
                </tr>
              )}
              {rides.map((ride) => (
                <tr key={ride.id} className="hover:bg-background-elevated/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
                        <Gauge className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">{ride.car?.name ?? `Car #${ride.carId}`}</p>
                        <p className="text-xs text-text-muted truncate max-w-48">
                          {ride.pickup} &rarr; {ride.dropoff}
                        </p>
                        <p className="text-xs text-text-muted mt-1">
                          {new Date(ride.timestamp).toLocaleDateString()} at{' '}
                          {new Date(ride.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-text-primary">{weiToEth(ride.grossEarnings)} ETH</td>
                  <td className="px-6 py-4 text-right font-mono text-error">-{weiToEth(ride.commission)} ETH</td>
                  <td className="px-6 py-4 text-right font-mono font-medium text-purple-400">{weiToEth(ride.netEarnings)} ETH</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-border">
          <Button variant="ghost" className="w-full">
            Load More Rides
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Pending Payout */}
        <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-purple-500/5 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20">
              <ArrowUpRight className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-text-primary">Pending Payout</h3>
              <p className="text-sm text-text-muted">Available to withdraw</p>
            </div>
          </div>
          <p className="font-heading text-3xl font-bold text-purple-400 mb-4">
            0 ETH
          </p>
          <Button variant="default" className="w-full bg-purple-500 hover:bg-purple-600">
            Withdraw Earnings
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Payout History */}
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-heading font-bold text-text-primary">Payout History</h3>
          </div>
          <div className="divide-y divide-border">
            <div className="p-4 text-center text-text-muted text-sm">No payout history available.</div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="rounded-2xl border border-border bg-surface p-4">
          <h3 className="font-heading font-bold text-text-primary mb-4">Ride Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-text-muted">Total Rides</span>
              <span className="font-mono font-medium text-text-primary">{rides.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Gross Earnings</span>
              <span className="font-mono font-medium text-text-primary">{totalGross.toFixed(4)} ETH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Commission Paid</span>
              <span className="font-mono font-medium text-error">-{totalCommission.toFixed(4)} ETH</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between">
              <span className="font-medium text-text-primary">Net Earnings</span>
              <span className="font-mono font-bold text-purple-400">{totalNet.toFixed(4)} ETH</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
