import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart3, ChevronLeft, TrendingUp, Users, Car, DollarSign,
  Activity, Clock, Download, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAdminAnalytics, useAdminTransactions, useAdminCars } from '@/hooks/api/useAdminApi';
import type { ApiTransaction, ApiCar } from '@/types/api';

/** Convert a wei string to a human-readable ETH number (up to 4 decimals). */
function weiToNum(wei: string): number {
  return Number((BigInt(wei || '0') * 10000n / 10n ** 18n)) / 10000;
}

/** Format a TransactionType enum value into a readable label. */
function formatTxType(type: ApiTransaction['type']): string {
  const map: Record<ApiTransaction['type'], string> = {
    car_created: 'Car Created',
    primary_purchase: 'Primary Sale',
    listing_created: 'Listing Created',
    listing_filled: 'Secondary Sale',
    listing_cancelled: 'Cancelled',
  };
  return map[type] ?? type;
}

/** Pick a Badge variant based on the transaction type. */
function txBadgeVariant(type: ApiTransaction['type']): 'default' | 'accent' | 'success' {
  switch (type) {
    case 'primary_purchase': return 'default';
    case 'listing_filled': return 'accent';
    default: return 'success';
  }
}

/** Relative-time formatter (e.g. "2 hours ago"). */
function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function AdminAnalytics() {
  const { data: analyticsData, isLoading: analyticsLoading } = useAdminAnalytics();
  const { data: txData, isLoading: txLoading } = useAdminTransactions({ page: 1, limit: 5 });
  const { data: carsData, isLoading: carsLoading } = useAdminCars({ page: 1, limit: 4 });

  const analytics = analyticsData ?? {
    totalUsers: 0,
    totalCars: 0,
    totalRides: 0,
    totalTransactions: 0,
    newUsersLast30Days: 0,
    accumulatedPlatformFees: '0',
  };

  const transactions: ApiTransaction[] = txData?.data ?? [];
  const cars: ApiCar[] = carsData?.data ?? [];

  const isLoading = analyticsLoading || txLoading || carsLoading;

  if (isLoading) {
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
        <div className="absolute inset-0 bg-gradient-to-b from-info/5 via-background to-background" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-info/10 rounded-full blur-3xl" />

        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-6"
          >
            <div>
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-text-secondary bg-background-elevated border border-border hover:text-text-primary hover:border-primary/40 hover:bg-background-hover transition-all mb-6"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Admin
              </Link>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-info/10 border border-info/20 mb-4">
                <BarChart3 className="h-4 w-4 text-info" />
                <span className="text-sm font-medium text-info">Platform Analytics</span>
              </div>

              <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-2">
                Analytics Dashboard
              </h1>
              <p className="text-text-secondary">
                Monitor platform performance and key metrics.
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
        {/* Stats Grid */}
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
              <span className="text-sm text-text-muted">Total Volume</span>
            </div>
            <p className="font-heading text-2xl font-bold text-gradient font-mono">
              {weiToNum(analytics.accumulatedPlatformFees)} ETH
            </p>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-sm text-text-muted font-medium">
                All time
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                <Users className="h-5 w-5 text-accent" />
              </div>
              <span className="text-sm text-text-muted">Total Users</span>
            </div>
            <p className="font-heading text-2xl font-bold text-text-primary font-mono">
              {analytics.totalUsers.toLocaleString()}
            </p>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-sm text-text-muted font-medium">
                +{analytics.newUsersLast30Days} this month
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
                <Car className="h-5 w-5 text-success" />
              </div>
              <span className="text-sm text-text-muted">Tokenized Cars</span>
            </div>
            <p className="font-heading text-2xl font-bold text-text-primary font-mono">
              {analytics.totalCars}
            </p>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-sm text-text-muted font-medium">
                On platform
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
                <DollarSign className="h-5 w-5 text-warning" />
              </div>
              <span className="text-sm text-text-muted">Platform Fees</span>
            </div>
            <p className="font-heading text-2xl font-bold text-gradient-gold font-mono">
              {weiToNum(analytics.accumulatedPlatformFees)} ETH
            </p>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-sm text-text-muted font-medium">
                Accumulated
              </span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-2xl border border-border bg-surface overflow-hidden"
          >
            <div className="p-6 border-b border-border">
              <h3 className="font-heading font-bold text-lg text-text-primary">
                Volume Over Time
              </h3>
            </div>
            <div className="p-6">
              <div className="h-64 flex items-center justify-center bg-background-elevated rounded-xl">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-text-muted mx-auto mb-3" />
                  <p className="text-text-muted">Chart visualization</p>
                  <p className="text-xs text-text-muted">Integrate with your preferred charting library</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Top Cars */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-2xl border border-border bg-surface overflow-hidden"
          >
            <div className="p-6 border-b border-border">
              <h3 className="font-heading font-bold text-lg text-text-primary">
                Top Performing Cars
              </h3>
            </div>
            <div className="divide-y divide-border">
              {cars.map((car, i) => (
                <div key={car.id} className="p-4 hover:bg-background-elevated/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="font-heading font-bold text-lg text-text-muted w-6">
                      #{i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-text-primary">{car.name}</p>
                      <p className="text-sm text-text-muted">{car.totalShares} shares</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-medium text-text-primary">{weiToNum(car.pricePerShare)} ETH/share</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-6 rounded-2xl border border-border bg-surface overflow-hidden"
        >
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-heading font-bold text-lg text-text-primary">
                Recent Transactions
              </h3>
            </div>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Car
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-background-elevated/50 transition-colors">
                    <td className="px-6 py-4">
                      <Badge variant={txBadgeVariant(tx.type)}>
                        {formatTxType(tx.type)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-primary">Car #{tx.carId}</td>
                    <td className="px-6 py-4 font-mono font-medium text-text-primary">
                      {tx.amount} shares
                    </td>
                    <td className="px-6 py-4 text-sm text-text-muted">
                      {tx.user?.walletAddress ? `${tx.user.walletAddress.slice(0, 6)}...${tx.user.walletAddress.slice(-4)}` : tx.user?.name ?? 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-muted">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {timeAgo(tx.timestamp)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
