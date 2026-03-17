import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp, ChevronLeft, Wallet, DollarSign, Car, PieChart,
  ArrowUpRight, ArrowDownRight, Calendar, Download, Filter,
  BarChart3, Activity, Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/feedback/LoadingState';
import { usePortfolioSummary, usePortfolioDividends } from '@/hooks/api/usePortfolioApi';
import { useMyTradeHistory } from '@/hooks/api/useMarketplaceApi';

// Helper to convert wei to ETH number
function weiToNum(wei: string): string {
  const num = Number(wei) / 1e18;
  if (num === 0) return '0';
  return num.toFixed(num < 0.01 ? 4 : 2);
}

// Helper to format relative time
function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return '1 month ago';
  return `${Math.floor(diffDays / 30)} months ago`;
}

export function InvestorAnalytics() {

  // Fetch real data from API
  const { data: portfolio, isLoading: portfolioLoading } = usePortfolioSummary();
  const { data: dividendsResponse, isLoading: dividendsLoading } = usePortfolioDividends({ page: 1, limit: 10 });
  const { data: tradesResponse, isLoading: tradesLoading } = useMyTradeHistory({ page: 1, limit: 10 });

  // Compute derived values
  const totalValueEth = useMemo(() => {
    if (!portfolio) return '0';
    return weiToNum(portfolio.totalValue);
  }, [portfolio]);

  const totalDividendsEth = useMemo(() => {
    if (!portfolio) return '0';
    return weiToNum(portfolio.totalDividends);
  }, [portfolio]);

  const holdingsCount = portfolio?.holdings?.length || 0;

  // Holdings distribution for allocation chart
  const holdingsDistribution = useMemo(() => {
    if (!portfolio?.holdings) return [];
    return portfolio.holdings.map((holding: { car: { id: number; name: string; totalShares: number; pricePerShare: string; make: string; model: string; year: number }; shares: number; value: string }) => ({
      id: holding.car.id,
      name: holding.car.name,
      value: Number(weiToNum(holding.value)),
      shares: holding.shares,
    }));
  }, [portfolio]);

  const maxHoldingValue = useMemo(() => {
    if (holdingsDistribution.length === 0) return 1;
    return Math.max(...holdingsDistribution.map((h: { value: number }) => h.value));
  }, [holdingsDistribution]);

  // Combine recent activity from trades and dividends
  const recentActivity = useMemo(() => {
    const trades = tradesResponse?.data || [];
    const dividends = dividendsResponse?.data || [];

    const tradeActivities = trades.map((trade: { id: string; type: string; car?: { name: string }; price: string; amount: number; timestamp: string }) => ({
      id: `trade-${trade.id}`,
      type: trade.type.includes('purchase') ? 'purchase' : trade.type.includes('listing_filled') ? 'sale' : 'trade',
      car: trade.car?.name || 'Unknown Car',
      amount: trade.type.includes('purchase') ? `-${weiToNum(trade.price)}` : `+${weiToNum(trade.price)}`,
      shares: trade.amount,
      date: trade.timestamp,
    }));

    const dividendActivities = dividends.map((dividend: { id: string; car?: { name: string }; amount: string; createdAt: string }) => ({
      id: `dividend-${dividend.id}`,
      type: 'dividend' as const,
      car: dividend.car?.name || 'Unknown Car',
      amount: `+${weiToNum(dividend.amount)}`,
      shares: undefined as number | undefined,
      date: dividend.createdAt,
    }));

    return [...tradeActivities, ...dividendActivities]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [tradesResponse, dividendsResponse]);

  const isLoading = portfolioLoading || dividendsLoading || tradesLoading;

  if (isLoading) {
    return <LoadingState message="Loading analytics..." fullScreen />;
  }

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
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 me-4 text-text-secondary hover:text-primary transition-colors mb-6"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Investment Analytics</span>
              </div>

              <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-2">
                Portfolio Analytics
              </h1>
              <p className="text-text-secondary">
                Track performance, analyze returns, and optimize your investments.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container py-12">
        {/* Portfolio Summary Stats */}
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
            <p className="font-heading text-2xl font-bold text-gradient font-mono">
              {totalValueEth} ETH
            </p>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-text-muted">Total invested value</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
                <Car className="h-5 w-5 text-success" />
              </div>
              <span className="text-sm text-text-muted">Cars Invested</span>
            </div>
            <p className="font-heading text-2xl font-bold text-success font-mono">
              {portfolio?.totalCarsInvested || 0}
            </p>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-text-muted">Total holdings</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                <DollarSign className="h-5 w-5 text-accent" />
              </div>
              <span className="text-sm text-text-muted">Total Dividends</span>
            </div>
            <p className="font-heading text-2xl font-bold text-gradient-gold font-mono">
              {totalDividendsEth} ETH
            </p>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-text-muted">Lifetime earnings</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10">
                <Target className="h-5 w-5 text-info" />
              </div>
              <span className="text-sm text-text-muted">Holdings</span>
            </div>
            <p className="font-heading text-2xl font-bold text-info font-mono">
              {holdingsCount}
            </p>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-text-muted">Active positions</span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Holdings Distribution Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2 rounded-2xl border border-border bg-surface overflow-hidden"
          >
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                  <BarChart3 className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-heading font-bold text-lg text-text-primary">
                  Holdings Distribution
                </h3>
              </div>
            </div>

            <div className="p-6">
              {holdingsDistribution.length > 0 ? (
                <>
                  {/* Simple Bar Chart */}
                  <div className="flex items-end justify-between gap-4 h-48">
                    {holdingsDistribution.map((holding, i) => (
                      <div key={holding.id} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full flex flex-col items-center">
                          <span className="text-xs text-text-muted mb-2 font-mono">
                            {holding.value.toFixed(2)} ETH
                          </span>
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${(holding.value / maxHoldingValue) * 120}px` }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="w-full max-w-[60px] bg-gradient-to-t from-primary to-accent rounded-t-lg"
                          />
                        </div>
                        <span className="text-xs text-text-muted text-center line-clamp-2">
                          {holding.name.split(' ').slice(1, 3).join(' ')}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-6 border-t border-border grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-text-muted">Total Value</p>
                      <p className="font-mono font-bold text-text-primary">
                        {totalValueEth} ETH
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Total Dividends</p>
                      <p className="font-mono font-bold text-text-primary">
                        {totalDividendsEth} ETH
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Holdings</p>
                      <p className="font-mono font-bold text-success">{holdingsCount}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-background-elevated mb-4">
                    <BarChart3 className="h-8 w-8 text-text-muted" />
                  </div>
                  <p className="text-text-muted text-center">No holdings yet</p>
                  <p className="text-sm text-text-muted text-center mt-1">
                    Start investing to see your distribution
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Portfolio Allocation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-2xl border border-border bg-surface overflow-hidden"
          >
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <PieChart className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-heading font-bold text-lg text-text-primary">
                  Allocation
                </h3>
              </div>
            </div>

            <div className="p-6">
              {holdingsDistribution.length > 0 ? (
                <>
                  {/* Simple allocation visualization */}
                  <div className="relative w-32 h-32 mx-auto mb-6">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="12"
                        className="text-background-elevated"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="none"
                        stroke="url(#gradient1)"
                        strokeWidth="12"
                        strokeDasharray="352"
                        strokeDashoffset="88"
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#0ea5e9" />
                          <stop offset="100%" stopColor="#d4a574" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold font-mono text-text-primary">
                        {holdingsCount}
                      </span>
                      <span className="text-xs text-text-muted">Cars</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {holdingsDistribution.map((holding, i) => {
                      const colors = ['bg-primary', 'bg-accent', 'bg-success', 'bg-info'];
                      const totalValue = parseFloat(totalValueEth);
                      const percentage = totalValue > 0
                        ? ((holding.value / totalValue) * 100).toFixed(1)
                        : '0.0';
                      return (
                        <div key={holding.id} className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${colors[i % colors.length]}`} />
                          <span className="text-sm text-text-secondary flex-1 truncate">
                            {holding.name.split(' ').slice(1, 3).join(' ')}
                          </span>
                          <span className="text-sm font-mono font-medium text-text-primary">
                            {percentage}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-background-elevated mb-4">
                    <PieChart className="h-8 w-8 text-text-muted" />
                  </div>
                  <p className="text-text-muted">No allocations</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Holdings Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="rounded-2xl border border-border bg-surface overflow-hidden mb-8"
        >
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
                <Car className="h-5 w-5 text-success" />
              </div>
              <h3 className="font-heading font-bold text-lg text-text-primary">
                Holdings Breakdown
              </h3>
            </div>
            <Link to="/portfolio">
              <Button variant="ghost" size="sm">
                View Portfolio
              </Button>
            </Link>
          </div>

          <div className="overflow-x-auto">
            {portfolio?.holdings && portfolio.holdings.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      Shares
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      Price per Share
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      Current Value
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      Ownership
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {portfolio.holdings.map((holding) => {
                    const colors = ['bg-primary', 'bg-accent', 'bg-success', 'bg-info', 'bg-purple-500', 'bg-pink-500'];
                    const colorIndex = holding.car.id % colors.length;
                    const ownershipPercent = ((holding.shares / holding.car.totalShares) * 100).toFixed(2);

                    return (
                      <tr key={holding.car.id} className="hover:bg-background-elevated/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-lg ${colors[colorIndex]} flex items-center justify-center`}>
                              <Car className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-text-primary text-sm">
                                {holding.car.name}
                              </p>
                              <p className="text-xs text-text-muted">
                                {holding.car.year} {holding.car.make} {holding.car.model}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-mono text-text-primary">{holding.shares}</p>
                          <p className="text-xs text-text-muted">
                            of {holding.car.totalShares}
                          </p>
                        </td>
                        <td className="px-6 py-4 font-mono text-text-primary">
                          {weiToNum(holding.car.pricePerShare)} ETH
                        </td>
                        <td className="px-6 py-4 font-mono text-text-primary">
                          {weiToNum(holding.value)} ETH
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-background-elevated rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full ${colors[colorIndex]}`}
                                style={{ width: `${Math.min(parseFloat(ownershipPercent), 100)}%` }}
                              />
                            </div>
                            <span className="text-sm font-mono text-text-primary">
                              {ownershipPercent}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-background-elevated/50">
                    <td className="px-6 py-4 font-medium text-text-primary">
                      Total
                    </td>
                    <td className="px-6 py-4 font-mono text-text-primary">
                      {portfolio.holdings.reduce((sum, h) => sum + h.shares, 0)}
                    </td>
                    <td className="px-6 py-4" />
                    <td className="px-6 py-4 font-mono font-bold text-gradient">
                      {totalValueEth} ETH
                    </td>
                    <td className="px-6 py-4" />
                  </tr>
                </tfoot>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-background-elevated mb-4">
                  <Car className="h-8 w-8 text-text-muted" />
                </div>
                <p className="text-text-muted text-center">No holdings yet</p>
                <p className="text-sm text-text-muted text-center mt-1">
                  Start investing in tokenized cars to build your portfolio
                </p>
                <Link to="/marketplace">
                  <Button className="mt-4">
                    Browse Marketplace
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="rounded-2xl border border-border bg-surface overflow-hidden"
        >
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10">
                <Activity className="h-5 w-5 text-info" />
              </div>
              <h3 className="font-heading font-bold text-lg text-text-primary">
                Recent Activity
              </h3>
            </div>
          </div>

          <div className="divide-y divide-border">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-background-elevated/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      activity.type === 'dividend'
                        ? 'bg-success/10'
                        : activity.type === 'purchase' || activity.type.includes('purchase')
                        ? 'bg-primary/10'
                        : 'bg-accent/10'
                    }`}>
                      {activity.type === 'dividend' ? (
                        <DollarSign className="h-5 w-5 text-success" />
                      ) : activity.type === 'purchase' || activity.type.includes('purchase') ? (
                        <ArrowDownRight className="h-5 w-5 text-primary" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5 text-accent" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            activity.type === 'dividend'
                              ? 'success'
                              : activity.type === 'purchase' || activity.type.includes('purchase')
                              ? 'default'
                              : 'accent'
                          }
                        >
                          {activity.type === 'dividend'
                            ? 'Dividend'
                            : activity.type.includes('purchase')
                            ? 'Purchase'
                            : activity.type.includes('sale') || activity.type.includes('filled')
                            ? 'Sale'
                            : 'Trade'}
                        </Badge>
                        <span className="text-text-primary font-medium">
                          {activity.car}
                        </span>
                      </div>
                      {activity.shares && (
                        <p className="text-sm text-text-muted mt-1">
                          {activity.shares} shares
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`font-mono font-medium ${
                        activity.amount.startsWith('+') ? 'text-success' : 'text-error'
                      }`}>
                        {activity.amount} ETH
                      </p>
                      <p className="text-xs text-text-muted flex items-center justify-end gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatRelativeTime(activity.date)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-background-elevated mb-4">
                  <Activity className="h-8 w-8 text-text-muted" />
                </div>
                <p className="text-text-muted">No recent activity</p>
                <p className="text-sm text-text-muted text-center mt-1">
                  Your transactions and dividends will appear here
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
