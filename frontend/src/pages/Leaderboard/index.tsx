import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy, TrendingUp, Car, Gauge, Crown, Medal, Award,
  Users, AlertCircle, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useLeaderboardStats,
  useTopInvestors,
  useTopOwners,
  useTopDrivers,
  type LeaderboardEntry,
} from '@/hooks/api/useLeaderboardApi';

type LeaderboardTab = 'investors' | 'owners' | 'drivers';

function getAvatarColor(name: string): string {
  const colors = [
    'bg-primary/20 text-primary',
    'bg-accent/20 text-accent',
    'bg-success/20 text-success',
    'bg-warning/20 text-warning',
    'bg-info/20 text-info',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

function truncateAddress(address: string | null): string {
  if (!address) return 'N/A';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function Leaderboard() {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('investors');

  // Fetch data from public leaderboard endpoints (no admin permissions needed)
  const { data: stats, isLoading: statsLoading, error: statsError } = useLeaderboardStats();
  const { data: investors = [], isLoading: investorsLoading, error: investorsError } = useTopInvestors(10);
  const { data: carOwners = [], isLoading: ownersLoading, error: ownersError } = useTopOwners(10);
  const { data: drivers = [], isLoading: driversLoading, error: driversError } = useTopDrivers(10);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-warning" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-text-muted" />;
    if (rank === 3) return <Award className="h-5 w-5 text-accent" />;
    return <span className="font-bold text-text-muted">{rank}</span>;
  };

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <section className="relative py-16 lg:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-warning/5 via-background to-background" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-warning/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warning/10 border border-warning/20 mb-6">
              <Trophy className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium text-warning">Leaderboard</span>
            </div>

            <h1 className="font-heading text-4xl md:text-5xl font-bold text-text-primary mb-4">
              Top{' '}
              <span className="text-gradient-gold">Performers</span>
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Discover the top investors, car owners, and drivers making waves on our platform.
            </p>
          </motion.div>

          {/* Platform Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12"
          >
            {statsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-5 rounded-2xl bg-surface border border-border text-center">
                  <div className="h-8 w-8 mx-auto mb-2 bg-background-elevated rounded animate-pulse" />
                  <div className="h-6 bg-background-elevated rounded mx-auto mb-2 w-24" />
                  <div className="h-4 bg-background-elevated rounded mx-auto w-20" />
                </div>
              ))
            ) : statsError ? (
              <div className="col-span-2 md:col-span-4 p-5 rounded-2xl bg-surface border border-border text-center">
                <AlertCircle className="h-8 w-8 text-error mx-auto mb-2" />
                <p className="text-sm text-text-muted">Unable to load platform statistics</p>
              </div>
            ) : (
              <>
                <div className="p-5 rounded-2xl bg-surface border border-border text-center">
                  <Users className="h-8 w-8 text-accent mx-auto mb-2" />
                  <p className="font-heading text-2xl font-bold text-text-primary font-mono">
                    {stats?.totalUsers.toLocaleString() || '0'}
                  </p>
                  <p className="text-sm text-text-muted">Total Users</p>
                </div>
                <div className="p-5 rounded-2xl bg-surface border border-border text-center">
                  <Car className="h-8 w-8 text-success mx-auto mb-2" />
                  <p className="font-heading text-2xl font-bold text-text-primary font-mono">
                    {stats?.totalCars.toLocaleString() || '0'}
                  </p>
                  <p className="text-sm text-text-muted">Tokenized Cars</p>
                </div>
                <div className="p-5 rounded-2xl bg-surface border border-border text-center">
                  <Gauge className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="font-heading text-2xl font-bold text-text-primary font-mono">
                    {stats?.totalRides.toLocaleString() || '0'}
                  </p>
                  <p className="text-sm text-text-muted">Rides Completed</p>
                </div>
                <div className="p-5 rounded-2xl bg-surface border border-border text-center">
                  <TrendingUp className="h-8 w-8 text-info mx-auto mb-2" />
                  <p className="font-heading text-2xl font-bold text-text-primary font-mono">
                    {stats?.totalTransactions.toLocaleString() || '0'}
                  </p>
                  <p className="text-sm text-text-muted">Transactions</p>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </section>

      <div className="container py-12">
        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center gap-2 mb-8"
        >
          <Button
            variant={activeTab === 'investors' ? 'default' : 'outline'}
            onClick={() => setActiveTab('investors')}
            size="lg"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Investors
          </Button>
          <Button
            variant={activeTab === 'owners' ? 'default' : 'outline'}
            onClick={() => setActiveTab('owners')}
            size="lg"
          >
            <Car className="h-4 w-4 mr-2" />
            Car Owners
          </Button>
          <Button
            variant={activeTab === 'drivers' ? 'default' : 'outline'}
            onClick={() => setActiveTab('drivers')}
            size="lg"
          >
            <Gauge className="h-4 w-4 mr-2" />
            Drivers
          </Button>
        </motion.div>

        {/* Leaderboard Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          {activeTab === 'investors' && (
            <LeaderboardList
              title="Top Investors"
              subtitle="Ranked by total share purchases"
              items={investors}
              isLoading={investorsLoading}
              error={investorsError}
              emptyIcon={<TrendingUp className="h-8 w-8 text-text-muted mx-auto mb-2" />}
              emptyLabel="No investors found"
              getMetric={(e) => e.totalSharesBought ?? 0}
              metricLabel="purchases"
              getRankIcon={getRankIcon}
              getAvatarColor={getAvatarColor}
              getInitial={getInitial}
              truncateAddress={truncateAddress}
            />
          )}

          {activeTab === 'owners' && (
            <LeaderboardList
              title="Top Car Owners"
              subtitle="Ranked by number of tokenized cars"
              items={carOwners}
              isLoading={ownersLoading}
              error={ownersError}
              emptyIcon={<Car className="h-8 w-8 text-text-muted mx-auto mb-2" />}
              emptyLabel="No car owners found"
              getMetric={(e) => e.totalCars ?? 0}
              metricLabel="cars"
              getRankIcon={getRankIcon}
              getAvatarColor={getAvatarColor}
              getInitial={getInitial}
              truncateAddress={truncateAddress}
            />
          )}

          {activeTab === 'drivers' && (
            <LeaderboardList
              title="Top Drivers"
              subtitle="Ranked by rides completed"
              items={drivers}
              isLoading={driversLoading}
              error={driversError}
              emptyIcon={<Gauge className="h-8 w-8 text-text-muted mx-auto mb-2" />}
              emptyLabel="No drivers found"
              getMetric={(e) => e.totalRides ?? 0}
              metricLabel="rides"
              getRankIcon={getRankIcon}
              getAvatarColor={getAvatarColor}
              getInitial={getInitial}
              truncateAddress={truncateAddress}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}

// ---------- Shared list component ----------

interface LeaderboardListProps {
  title: string;
  subtitle: string;
  items: LeaderboardEntry[];
  isLoading: boolean;
  error: Error | null;
  emptyIcon: React.ReactNode;
  emptyLabel: string;
  getMetric: (entry: LeaderboardEntry) => number;
  metricLabel: string;
  getRankIcon: (rank: number) => React.ReactNode;
  getAvatarColor: (name: string) => string;
  getInitial: (name: string) => string;
  truncateAddress: (addr: string | null) => string;
}

function LeaderboardList({
  title,
  subtitle,
  items,
  isLoading,
  error,
  emptyIcon,
  emptyLabel,
  getMetric,
  metricLabel,
  getRankIcon,
  getAvatarColor,
  getInitial,
  truncateAddress,
}: LeaderboardListProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="p-6 border-b border-border">
        <h2 className="font-heading font-bold text-xl text-text-primary">{title}</h2>
        <p className="text-sm text-text-muted mt-1">{subtitle}</p>
      </div>
      <div className="divide-y divide-border">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="h-8 w-8 text-primary mx-auto mb-2 animate-spin" />
            <p className="text-sm text-text-muted">Loading...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <AlertCircle className="h-8 w-8 text-error mx-auto mb-2" />
            <p className="text-sm text-text-muted">Unable to load data</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            {emptyIcon}
            <p className="text-sm text-text-muted">{emptyLabel}</p>
          </div>
        ) : (
          items.map((entry, i) => (
            <div
              key={entry.id}
              className={`p-6 hover:bg-background-elevated/50 transition-colors ${
                i === 0 ? 'bg-gradient-to-r from-warning/5 to-transparent' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center">
                  {getRankIcon(i + 1)}
                </div>
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${getAvatarColor(entry.name)}`}>
                  <span className="text-xl font-bold">{getInitial(entry.name)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-bold text-lg text-text-primary">
                    {entry.name}
                  </p>
                  <p className="text-sm text-text-muted truncate">
                    {truncateAddress(entry.walletAddress)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary font-mono">
                    {getMetric(entry)}
                  </p>
                  <p className="text-xs text-text-muted capitalize">{metricLabel}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
