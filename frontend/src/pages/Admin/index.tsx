import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Shield, AlertTriangle, Settings, DollarSign, PlayCircle, PauseCircle,
  Wallet, TrendingUp, Users, Car, ChevronRight, BarChart3, Activity, RefreshCw,
  FileCheck, UserCheck, Receipt, CreditCard, ClipboardList
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RequireWallet } from '@/components/wallet/RequireWallet';
import {
  useIsPlatformOwner,
  useGlobalFeeBps,
  usePrimarySalesPaused,
  useAccumulatedFees,
  useSetGlobalFee,
  usePausePrimarySales,
  useWithdrawFees,
} from '@/hooks/contracts/useCarShares';
import { useAdminAnalytics, useTriggerSync } from '@/hooks/api/useAdminApi';
import { formatEth, bpsToPercent, weiToEth } from '@/lib/utils';


function NotAuthorized() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg mx-auto text-center"
        >
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-error/20 to-red-500/20 mx-auto mb-8 border border-error/20">
            <AlertTriangle className="h-12 w-12 text-error" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-text-primary mb-4">
            Access Denied
          </h1>
          <p className="text-text-secondary leading-relaxed max-w-md mx-auto">
            You are not authorized to access this page. Only the platform owner can manage admin settings.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export function Admin() {
  const { isOwner } = useIsPlatformOwner();
  const { data: currentFeeBps, refetch: refetchFee } = useGlobalFeeBps();
  const { data: isPaused, refetch: refetchPaused } = usePrimarySalesPaused();
  const { data: accumulatedFees, refetch: refetchFees } = useAccumulatedFees();
  const { data: analytics } = useAdminAnalytics();

  const [newFee, setNewFee] = useState('');
  const [syncSuccess, setSyncSuccess] = useState(false);

  const {
    mutate: triggerSync,
    isPending: syncPending,
  } = useTriggerSync();

  const {
    setFee,
    isPending: feePending,
    isConfirming: feeConfirming,
    isSuccess: feeSuccess,
  } = useSetGlobalFee();

  const {
    pause,
    isPending: pausePending,
    isConfirming: pauseConfirming,
  } = usePausePrimarySales();

  const {
    withdraw,
    isPending: withdrawPending,
    isConfirming: withdrawConfirming,
    isSuccess: withdrawSuccess,
  } = useWithdrawFees();

  // Refetch data after successful operations
  useEffect(() => {
    if (feeSuccess) {
      refetchFee();
    }
  }, [feeSuccess, refetchFee]);

  useEffect(() => {
    if (withdrawSuccess) {
      refetchFees();
    }
  }, [withdrawSuccess, refetchFees]);

  const handleSetFee = () => {
    const feeBps = Math.round(parseFloat(newFee) * 100);
    if (feeBps >= 0 && feeBps <= 1000) {
      setFee(feeBps);
    }
  };

  const handleTogglePause = () => {
    pause(!isPaused);
    setTimeout(refetchPaused, 2000);
  };

  const handleWithdraw = () => {
    withdraw();
  };

  const handleSync = () => {
    setSyncSuccess(false);
    triggerSync(undefined, {
      onSuccess: () => {
        setSyncSuccess(true);
        setTimeout(() => setSyncSuccess(false), 5000);
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header Section */}
      <section className="relative py-16 lg:py-20 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-background to-background" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6"
            >
              <Shield className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-accent">Platform Admin</span>
            </motion.div>

            <h1 className="font-heading text-4xl md:text-5xl font-bold text-text-primary mb-4">
              Admin{' '}
              <span className="text-gradient-gold">Dashboard</span>
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed max-w-2xl">
              Manage platform settings, monitor activity, and control critical system functions.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container py-12">
        <RequireWallet>
          {!isOwner ? (
            <NotAuthorized />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {/* Management Hub */}
              <div className="mb-10">
                <h2 className="font-heading text-xl font-bold text-text-primary mb-4">Management</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-3">
                  {[
                    { label: 'Users', icon: Users, href: '/admin/users', color: 'bg-primary/10 text-primary' },
                    { label: 'KYC Reviews', icon: FileCheck, href: '/admin/kyc', color: 'bg-warning/10 text-warning' },
                    { label: 'Driver Approvals', icon: UserCheck, href: '/admin/driver-approvals', color: 'bg-success/10 text-success' },
                    { label: 'Onboarding', icon: ClipboardList, href: '/admin/onboarding', color: 'bg-violet-500/10 text-violet-400' },
                    { label: 'Expenses', icon: Receipt, href: '/admin/expenses', color: 'bg-error/10 text-error' },
                    { label: 'Transactions', icon: CreditCard, href: '/admin/transactions', color: 'bg-info/10 text-info' },
                    { label: 'Cars', icon: Car, href: '/admin/cars', color: 'bg-accent/10 text-accent' },
                    { label: 'Analytics', icon: BarChart3, href: '/admin/analytics', color: 'bg-purple-500/10 text-purple-400' },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-border bg-surface hover:bg-background-elevated transition-all group"
                      >
                        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors text-center">
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="p-5 rounded-2xl bg-surface border border-border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <Car className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-sm text-text-muted">Total Cars</span>
                  </div>
                  <p className="font-heading text-2xl font-bold text-text-primary font-mono">
                    {analytics?.totalCars ?? '-'}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-surface border border-border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                      <Users className="h-5 w-5 text-accent" />
                    </div>
                    <span className="text-sm text-text-muted">Total Users</span>
                  </div>
                  <p className="font-heading text-2xl font-bold text-text-primary font-mono">
                    {analytics?.totalUsers.toLocaleString() ?? '-'}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-surface border border-border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
                      <TrendingUp className="h-5 w-5 text-success" />
                    </div>
                    <span className="text-sm text-text-muted">Total Volume</span>
                  </div>
                  <p className="font-heading text-2xl font-bold text-success font-mono">
                    {analytics?.accumulatedPlatformFees ? `${weiToEth(analytics.accumulatedPlatformFees)} ETH` : '-'}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-surface border border-border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10">
                      <Activity className="h-5 w-5 text-info" />
                    </div>
                    <span className="text-sm text-text-muted">Total Transactions</span>
                  </div>
                  <p className="font-heading text-2xl font-bold text-text-primary font-mono">
                    {analytics?.totalTransactions ?? '-'}
                  </p>
                </div>
              </div>

              {/* Admin Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Platform Fee */}
                <div className="rounded-2xl border border-border bg-surface overflow-hidden">
                  <div className="p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <Settings className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-lg text-text-primary">Platform Fee</h3>
                        <p className="text-sm text-text-muted">Configure transaction fees</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    <div className="p-4 rounded-xl bg-background-elevated border border-border/50">
                      <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Current Fee</p>
                      <p className="font-heading text-3xl font-bold text-gradient">
                        {currentFeeBps !== undefined ? bpsToPercent(Number(currentFeeBps)) : '-'}%
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="newFee" className="text-text-secondary">New Fee (%)</Label>
                      <Input
                        id="newFee"
                        type="number"
                        value={newFee}
                        onChange={(e) => setNewFee(e.target.value)}
                        placeholder="2.5"
                        step="0.1"
                        min="0"
                        max="10"
                        className="mt-2"
                        inputSize="lg"
                        leftIcon={<DollarSign className="h-5 w-5" />}
                      />
                      <p className="text-xs text-text-muted mt-2">Maximum allowed: 10%</p>
                    </div>

                    <Button
                      onClick={handleSetFee}
                      isLoading={feePending || feeConfirming}
                      className="w-full"
                      size="lg"
                      variant="glow"
                    >
                      Update Fee
                      <ChevronRight className="h-5 w-5 ml-2" />
                    </Button>
                  </div>
                </div>

                {/* Primary Sales Control */}
                <div className="rounded-2xl border border-border bg-surface overflow-hidden">
                  <div className="p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${isPaused ? 'bg-error/10' : 'bg-success/10'}`}>
                        {isPaused ? (
                          <PauseCircle className="h-6 w-6 text-error" />
                        ) : (
                          <PlayCircle className="h-6 w-6 text-success" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-lg text-text-primary">Primary Sales</h3>
                        <p className="text-sm text-text-muted">Control sale availability</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-background-elevated border border-border/50">
                      <span className="text-text-secondary">Current Status</span>
                      {isPaused ? (
                        <Badge variant="error" dot dotColor="error">Paused</Badge>
                      ) : (
                        <Badge variant="success" dot dotColor="success">Active</Badge>
                      )}
                    </div>

                    <div className={`p-4 rounded-xl ${isPaused ? 'bg-error/5 border border-error/20' : 'bg-success/5 border border-success/20'}`}>
                      <p className="text-sm text-text-secondary leading-relaxed">
                        {isPaused
                          ? 'Primary sales are currently paused. Users cannot purchase new shares from primary sales.'
                          : 'Primary sales are active. Users can purchase shares directly from car tokenizations.'}
                      </p>
                    </div>

                    <Button
                      onClick={handleTogglePause}
                      isLoading={pausePending || pauseConfirming}
                      variant={isPaused ? 'success' : 'ghost'}
                      className={`w-full ${!isPaused ? 'border-error text-error hover:bg-error/10' : ''}`}
                      size="lg"
                    >
                      {isPaused ? (
                        <>
                          <PlayCircle className="h-5 w-5 mr-2" />
                          Resume Sales
                        </>
                      ) : (
                        <>
                          <PauseCircle className="h-5 w-5 mr-2" />
                          Pause Sales
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Fee Withdrawal */}
                <div className="rounded-2xl border border-border bg-surface overflow-hidden">
                  <div className="p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                        <Wallet className="h-6 w-6 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-lg text-text-primary">Accumulated Fees</h3>
                        <p className="text-sm text-text-muted">Platform earnings</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    <div className="p-4 rounded-xl bg-background-elevated border border-border/50">
                      <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Available to Withdraw</p>
                      <p className="font-heading text-3xl font-bold text-gradient-gold">
                        {accumulatedFees !== undefined ? formatEth(accumulatedFees) : '-'} ETH
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-accent/5 border border-accent/20">
                      <div className="flex items-center gap-3">
                        <BarChart3 className="h-5 w-5 text-accent" />
                        <div>
                          <p className="text-sm font-medium text-accent">Lifetime Earnings</p>
                          <p className="text-xs text-text-muted">Total fees collected since launch</p>
                        </div>
                        <p className="ml-auto font-heading font-bold text-accent font-mono">3.14 ETH</p>
                      </div>
                    </div>

                    <Button
                      onClick={handleWithdraw}
                      isLoading={withdrawPending || withdrawConfirming}
                      disabled={!accumulatedFees || accumulatedFees === 0n}
                      className="w-full"
                      size="lg"
                      variant="accent"
                    >
                      <Wallet className="h-5 w-5 mr-2" />
                      Withdraw Fees
                    </Button>
                  </div>
                </div>

                {/* Blockchain Sync */}
                <div className="rounded-2xl border border-border bg-surface overflow-hidden">
                  <div className="p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info/10">
                        <RefreshCw className="h-6 w-6 text-info" />
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-lg text-text-primary">Blockchain Sync</h3>
                        <p className="text-sm text-text-muted">Sync on-chain events to database</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    <div className="p-4 rounded-xl bg-background-elevated border border-border/50">
                      <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Last Sync Status</p>
                      <div className="flex items-center gap-2 mt-2">
                        {syncPending ? (
                          <Badge variant="warning" dot dotColor="warning">Syncing...</Badge>
                        ) : syncSuccess ? (
                          <Badge variant="success" dot dotColor="success">Synced Successfully</Badge>
                        ) : (
                          <Badge variant="secondary">Ready</Badge>
                        )}
                      </div>
                    </div>

                    {syncSuccess && (
                      <div className="p-4 rounded-xl bg-success/5 border border-success/20">
                        <p className="text-sm text-success leading-relaxed">
                          Blockchain events have been synchronized successfully. All on-chain data is now up to date.
                        </p>
                      </div>
                    )}

                    <div className="p-4 rounded-xl bg-info/5 border border-info/20">
                      <p className="text-sm text-text-secondary leading-relaxed">
                        Synchronize all blockchain events (transfers, sales, tokenizations) with the database.
                      </p>
                    </div>

                    <Button
                      onClick={handleSync}
                      isLoading={syncPending}
                      className="w-full"
                      size="lg"
                      variant="ghost"
                    >
                      <RefreshCw className={`h-5 w-5 mr-2 ${syncPending ? 'animate-spin' : ''}`} />
                      Trigger Sync
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </RequireWallet>
      </div>
    </div>
  );
}
