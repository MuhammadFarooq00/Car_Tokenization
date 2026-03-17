import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Car, Gauge, DollarSign, Wallet, Users,
  ChevronRight, Package, Star, Plus, BarChart3, Eye, History, Tag, Coins,
  FileText, UserCheck, ClipboardList
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { usePortfolioSummary, usePortfolioHoldings } from '@/hooks/api/usePortfolioApi';
import { useMyOwnedCars } from '@/hooks/api/useCarsApi';
import { useDriverProfile, useMyApplications, useApplicationsForMyCars } from '@/hooks/api/useDriverApi';
import { useMyListings } from '@/hooks/api/useMarketplaceApi';
import { useCarMetadata } from '@/hooks/useCarMetadata';
import { getIpfsUrl, formatEth, weiToEth } from '@/lib/utils';
import type { RegularUserRole } from '@/types/auth';
import type { ApiPortfolioSummary, ApiCar, ApiDriverProfile, ApiHolding, ApiMarketplaceListing } from '@/types/api';

// Sub-component to resolve IPFS image for a car
function DashboardCarImage({ metadataCID, alt }: { metadataCID?: string; alt: string }) {
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

// Sub-component to render a single holding card (reads from DB via API)
function DashboardHoldingCard({ holding }: { holding: ApiHolding }) {
  const { data: metadata } = useCarMetadata(holding.car.metadataCID);

  const imageUrl = metadata?.image ? getIpfsUrl(metadata.image) : '/placeholder-car.svg';

  return (
    <Link to={`/car/${holding.car.id}`} className="block">
      <div className="p-4 rounded-xl bg-surface border border-border hover:border-emerald-500/30 transition-colors">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-8 rounded-lg overflow-hidden bg-background-elevated shrink-0">
            <img
              src={imageUrl}
              alt={holding.car.name || `Car #${holding.car.id}`}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-car.svg'; }}
            />
          </div>
          <p className="font-medium text-text-primary truncate">{holding.car.name || `Car #${holding.car.id}`}</p>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-muted">{holding.shares} shares</span>
          <span className="text-emerald-400 font-medium font-mono">{formatEth(BigInt(holding.value))}</span>
        </div>
      </div>
    </Link>
  );
}

// Sub-component to render a single listing card on the dashboard
function DashboardListingCard({ listing }: { listing: ApiMarketplaceListing }) {
  const metadataCID = listing.car?.metadataCID;
  const { data: metadata } = useCarMetadata(metadataCID);

  const imageUrl = metadata?.image ? getIpfsUrl(metadata.image) : '/placeholder-car.svg';
  const carName = listing.car?.name || metadata?.name || `Car #${listing.carId}`;

  return (
    <Link to={`/listing/${listing.listingId}`} className="block">
      <div className="p-4 rounded-xl bg-surface border border-border hover:border-emerald-500/30 transition-colors">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-8 rounded-lg overflow-hidden bg-background-elevated shrink-0">
            <img
              src={imageUrl}
              alt={carName}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-car.svg'; }}
            />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-text-primary truncate">{carName}</p>
            <p className="text-xs text-text-muted">Listing #{listing.listingId}</p>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-muted flex items-center gap-1">
            <Package className="h-3 w-3" />
            {listing.amount} shares
          </span>
          <span className="text-emerald-400 font-medium font-mono flex items-center gap-1">
            <Coins className="h-3 w-3" />
            {formatEth(BigInt(listing.pricePerShare))}/sh
          </span>
        </div>
      </div>
    </Link>
  );
}

// Import individual dashboard components for content
import { InvestorDashboard } from './InvestorDashboard';
import { OwnerDashboard } from './OwnerDashboard';
import { DriverDashboard } from './DriverDashboard';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';

// Role tab configuration
const ROLE_CONFIG: Record<RegularUserRole, {
  label: string;
  icon: typeof TrendingUp;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  investor: {
    label: 'Investor',
    icon: TrendingUp,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
  },
  car_owner: {
    label: 'Car Owner',
    icon: Car,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
  driver: {
    label: 'Driver',
    icon: Gauge,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
  },
};


export function Dashboard() {
  const { user, setActiveRole, isAdmin, refreshUser } = useAuth();
  const [viewMode, setViewMode] = useState<'unified' | 'detailed'>('unified');
  // Onboarding modal disabled — roles are assigned via Profile page instead
  const [showOnboarding, setShowOnboarding] = useState(false);

  // API hooks
  const { data: portfolio } = usePortfolioSummary();
  const { data: ownedCars } = useMyOwnedCars();
  const { data: driverProfile } = useDriverProfile();

  // Redirect admin to admin dashboard
  if (isAdmin()) {
    return <Navigate to="/admin" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Get user's available roles (excluding admin)
  const userRoles = (user.roles?.filter(r => r !== 'admin') || ['investor']) as RegularUserRole[];
  const activeRole = user.activeRole || userRoles[0];

  // Handler for switching active role
  const handleRoleSwitch = (role: RegularUserRole) => {
    setActiveRole(role);
  };

  // Onboarding handlers
  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    // Refresh user from server so roles + onboardingCompleted update in context
    await refreshUser();
  };

  const handleOnboardingDismiss = () => {
    setShowOnboarding(false);
    // Mark dismissed locally — modal won't show again this session
    // Backend will still show it next login until actually completed
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Onboarding Modal — shown once for new users who haven't completed it */}
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingModal
            onComplete={handleOnboardingComplete}
            onDismiss={handleOnboardingDismiss}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <section className="relative py-8 lg:py-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Welcome Section */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
              <div>
                <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-2">
                  Welcome back, {user.name?.split(' ')[0] || 'User'}
                </h1>
                <p className="text-text-secondary">
                  Manage your investments, vehicles, and driving activities
                </p>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-3">
                <div className="inline-flex p-1 rounded-xl bg-surface border border-border">
                  <button
                    onClick={() => setViewMode('unified')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      viewMode === 'unified'
                        ? 'bg-primary text-white'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setViewMode('detailed')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      viewMode === 'detailed'
                        ? 'bg-primary text-white'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Detailed View
                  </button>
                </div>
              </div>
            </div>

            {/* Role Tabs — only shown in Detailed View */}
            {userRoles.length > 1 && viewMode === 'detailed' && (
              <div className="flex flex-wrap gap-3 mb-8">
                {userRoles.map((role) => {
                  const config = ROLE_CONFIG[role];
                  const Icon = config.icon;
                  const isActive = activeRole === role;

                  return (
                    <motion.button
                      key={role}
                      onClick={() => handleRoleSwitch(role)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`
                        flex items-center gap-3 px-5 py-3 rounded-xl border transition-all
                        ${isActive
                          ? `${config.bgColor} ${config.borderColor} shadow-lg`
                          : 'bg-surface border-border hover:border-border-light'
                        }
                      `}
                    >
                      <div className={`p-2 rounded-lg ${config.bgColor}`}>
                        <Icon className={`h-5 w-5 ${config.color}`} />
                      </div>
                      <div className="text-left">
                        <p className={`font-medium ${isActive ? config.color : 'text-text-primary'}`}>
                          {config.label}
                        </p>
                        <p className="text-xs text-text-muted">
                          {role === 'investor' && `${portfolio?.totalCarsInvested ?? 0} holdings`}
                          {role === 'car_owner' && `${ownedCars?.length ?? 0} cars`}
                          {role === 'driver' && `${driverProfile?.totalRides ?? 0} rides`}
                        </p>
                      </div>
                      {isActive && (
                        <Badge variant="outline" className={`ml-2 ${config.color} ${config.borderColor}`}>
                          Active
                        </Badge>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <AnimatePresence mode="wait">
        {viewMode === 'unified' ? (
          <motion.div
            key="unified"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <UnifiedOverview
              userRoles={userRoles}
              portfolio={portfolio}
              ownedCars={ownedCars ?? []}
              driverProfile={driverProfile}
            />
          </motion.div>
        ) : (
          <motion.div
            key="detailed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Show the active role's detailed dashboard */}
            {activeRole === 'investor' && <InvestorDashboard />}
            {activeRole === 'car_owner' && <OwnerDashboard />}
            {activeRole === 'driver' && <DriverDashboard />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Unified Overview Component
function UnifiedOverview({ userRoles, portfolio, ownedCars, driverProfile }: {
  userRoles: RegularUserRole[];
  portfolio?: ApiPortfolioSummary;
  ownedCars: ApiCar[];
  driverProfile?: ApiDriverProfile;
}) {
  const { data: holdings } = usePortfolioHoldings();
  const { data: listingsData } = useMyListings();
  const myListings = listingsData?.data ?? [];

  // Driver applications data (for both owner and driver views)
  const { data: driverAppsResponse } = useApplicationsForMyCars(
    { page: 1, limit: 50 },
    userRoles.includes('car_owner'),
  );
  const { data: myApplications } = useMyApplications(
    userRoles.includes('driver'),
  );
  const pendingDriverApps = (driverAppsResponse?.data ?? []).filter((a) => a.status === 'pending');
  const myPendingApps = (myApplications ?? []).filter((a) => a.status === 'pending');
  const myApprovedApps = (myApplications ?? []).filter((a) => a.status === 'approved');
  const myRejectedApps = (myApplications ?? []).filter((a) => a.status === 'rejected');
  const assignedCar = driverProfile?.assignedCar;

  return (
    <div className="container py-16">
      {/* Quick Stats Grid - Shows stats for all roles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {userRoles.includes('investor') && (
          <>
            <StatCard
              icon={Wallet}
              label="Portfolio Value"
              value={`${portfolio ? weiToEth(portfolio.totalValue) : '0'} ETH`}
              color="emerald"
            />
            <StatCard
              icon={DollarSign}
              label="Total Dividends"
              value={`${portfolio ? weiToEth(portfolio.totalDividends) : '0'} ETH`}
              subtitle="From investments"
              color="emerald"
            />
          </>
        )}
        {userRoles.includes('car_owner') && (
          <>
            <StatCard
              icon={Car}
              label="My Fleet"
              value={`${ownedCars.length} vehicles`}
              subtitle={`${ownedCars.filter(c => c.assignedDriver).length} with drivers`}
              color="blue"
            />
            <StatCard
              icon={Users}
              label="Fleet Status"
              value={`${ownedCars.filter(c => c.status === 'active').length} active`}
              subtitle={`${ownedCars.length} total`}
              color="blue"
            />
          </>
        )}
        {userRoles.includes('driver') && (
          <>
            <StatCard
              icon={Gauge}
              label="Total Rides"
              value={`${driverProfile?.totalRides ?? 0}`}
              subtitle="All-time rides"
              color="purple"
            />
            <StatCard
              icon={Star}
              label="Rating"
              value={driverProfile?.rating?.toFixed(1) ?? '--'}
              subtitle="Driver rating"
              color="purple"
            />
          </>
        )}
      </div>

      {/* Role Sections */}
      <div className="space-y-8">
        {/* Investor Section */}
        {userRoles.includes('investor') && (
          <RoleSection
            title="Investment Portfolio"
            icon={TrendingUp}
            color="emerald"
            linkTo="/portfolio"
            linkLabel="View Portfolio"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {holdings && holdings.length > 0 ? (
                holdings.slice(0, 6).map((holding) => (
                  <DashboardHoldingCard key={holding.car.id} holding={holding} />
                ))
              ) : (
                <div className="col-span-3 text-center py-8 text-text-muted">
                  No holdings yet. Browse cars to start investing.
                </div>
              )}
            </div>
          </RoleSection>
        )}

        {/* Active Listings Section */}
        {userRoles.includes('investor') && myListings.length > 0 && (
          <RoleSection
            title="Active Listings"
            icon={Tag}
            color="emerald"
            linkTo="/portfolio?tab=listings"
            linkLabel="View All Listings"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {myListings.slice(0, 3).map((listing) => (
                <DashboardListingCard key={listing.listingId} listing={listing} />
              ))}
            </div>
          </RoleSection>
        )}

        {/* Car Owner Section */}
        {userRoles.includes('car_owner') && (
          <RoleSection
            title="My Fleet"
            icon={Car}
            color="blue"
            linkTo="/owner/monitoring"
            linkLabel="Fleet Management"
          >
            {/* Driver Requests Banner */}
            {pendingDriverApps.length > 0 && (
              <Link
                to="/owner/driver-requests"
                className="flex items-center justify-between p-4 mb-4 rounded-xl bg-blue-500/5 border border-blue-500/20 hover:border-blue-500/40 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                    <UserCheck className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">
                      {pendingDriverApps.length} Pending Driver Request{pendingDriverApps.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-text-muted">Drivers want to drive your cars</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-blue-400">
                  <span className="text-sm font-medium group-hover:underline">Review</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </Link>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ownedCars.length > 0 ? ownedCars.slice(0, 3).map((car) => (
                <Link key={car.id} to={`/car/${car.id}`} className="block">
                  <div className="rounded-xl bg-surface border border-border hover:border-blue-500/30 transition-colors overflow-hidden">
                    <div className="h-28 bg-background-elevated">
                      <DashboardCarImage metadataCID={car.metadataCID} alt={car.name} />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-text-primary truncate">{car.name}</p>
                        <Badge variant={car.assignedDriver ? 'default' : 'secondary'}>
                          {car.assignedDriver ? 'Active' : 'Needs Driver'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-muted">{car.assignedDriver?.user?.name ?? 'Unassigned'}</span>
                        <span className="text-text-primary font-medium">{weiToEth(car.pricePerShare)} ETH/share</span>
                      </div>
                    </div>
                  </div>
                </Link>
              )) : (
                <div className="col-span-3 text-center py-8 text-text-muted">
                  No vehicles yet. Add your first car to get started.
                </div>
              )}
            </div>
          </RoleSection>
        )}

        {/* Driver Section */}
        {userRoles.includes('driver') && (
          <RoleSection
            title="Driving Activity"
            icon={Gauge}
            color="purple"
            linkTo="/driver/log-ride"
            linkLabel="Log New Ride"
          >
            {/* My Applications Banner */}
            {(myApplications ?? []).length > 0 && (
              <Link
                to="/driver/my-applications"
                className="flex items-center justify-between p-4 mb-4 rounded-xl bg-purple-500/5 border border-purple-500/20 hover:border-purple-500/40 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
                    <ClipboardList className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">My Driver Applications</p>
                    <div className="flex gap-3 text-xs text-text-muted">
                      {myPendingApps.length > 0 && <span className="text-amber-400">{myPendingApps.length} pending</span>}
                      {myApprovedApps.length > 0 && <span className="text-emerald-400">{myApprovedApps.length} approved</span>}
                      {myRejectedApps.length > 0 && <span className="text-red-400">{myRejectedApps.length} rejected</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-purple-400">
                  <span className="text-sm font-medium group-hover:underline">View All</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </Link>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Assigned Cars */}
              <div className="p-4 rounded-xl bg-surface border border-border">
                <h4 className="text-sm font-medium text-text-muted mb-3">Assigned Cars</h4>
                <div className="space-y-3">
                  {assignedCar ? (
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium text-text-primary text-sm">{assignedCar.name}</p>
                        <p className="text-xs text-text-muted">Owner: {assignedCar.owner?.name ?? 'Unknown'}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-text-muted py-2">No vehicles assigned yet</p>
                  )}
                </div>
              </div>

              {/* Driver Stats */}
              <div className="p-4 rounded-xl bg-surface border border-border">
                <h4 className="text-sm font-medium text-text-muted mb-3">Driver Stats</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted text-sm">Total Rides</span>
                    <span className="text-lg font-bold text-text-primary">{driverProfile?.totalRides ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted text-sm">Rating</span>
                    <span className="text-lg font-bold text-text-primary">{driverProfile?.rating?.toFixed(1) ?? '--'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted text-sm">Experience</span>
                    <span className="text-lg font-bold text-text-primary">{driverProfile?.experience ?? 0} yrs</span>
                  </div>
                </div>
              </div>
            </div>
          </RoleSection>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-surface to-surface-lighter border border-border">
        <h3 className="font-heading text-lg font-semibold text-text-primary mb-6">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {/* Activity History - available for all users */}
          <Link
            to="/portfolio?tab=history"
            className="group flex flex-col items-center gap-3 p-4 rounded-xl bg-surface border border-border hover:border-amber-500/30 hover:bg-amber-500/5 transition-all"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
              <History className="h-6 w-6 text-amber-400" />
            </div>
            <span className="text-sm font-medium text-text-primary text-center">Activity History</span>
          </Link>
          {userRoles.includes('investor') && (
            <>
              <Link
                to="/discover"
                className="group flex flex-col items-center gap-3 p-4 rounded-xl bg-surface border border-border hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                  <Eye className="h-6 w-6 text-emerald-400" />
                </div>
                <span className="text-sm font-medium text-text-primary text-center">Browse Cars</span>
              </Link>
              <Link
                to="/marketplace"
                className="group flex flex-col items-center gap-3 p-4 rounded-xl bg-surface border border-border hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                  <Package className="h-6 w-6 text-emerald-400" />
                </div>
                <span className="text-sm font-medium text-text-primary text-center">Marketplace</span>
              </Link>
            </>
          )}
          {userRoles.includes('car_owner') && (
            <>
              <Link
                to="/create"
                className="group flex flex-col items-center gap-3 p-4 rounded-xl bg-surface border border-border hover:border-blue-500/30 hover:bg-blue-500/5 transition-all"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                  <Plus className="h-6 w-6 text-blue-400" />
                </div>
                <span className="text-sm font-medium text-text-primary text-center">Add Vehicle</span>
              </Link>
              <Link
                to="/owner/monitoring"
                className="group flex flex-col items-center gap-3 p-4 rounded-xl bg-surface border border-border hover:border-blue-500/30 hover:bg-blue-500/5 transition-all"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                  <BarChart3 className="h-6 w-6 text-blue-400" />
                </div>
                <span className="text-sm font-medium text-text-primary text-center">Monitor Fleet</span>
              </Link>
              {/* <Link
                to="/owner/driver-requests"
                className="group relative flex flex-col items-center gap-3 p-4 rounded-xl bg-surface border border-border hover:border-blue-500/30 hover:bg-blue-500/5 transition-all"
              >
                {pendingDriverApps.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
                    {pendingDriverApps.length}
                  </span>
                )}
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                  <UserCheck className="h-6 w-6 text-blue-400" />
                </div>
                <span className="text-sm font-medium text-text-primary text-center">Driver Requests</span>
              </Link> */}
            </>
          )}
          {userRoles.includes('driver') && (
            <>
              <Link
                to="/driver/log-ride"
                className="group flex flex-col items-center gap-3 p-4 rounded-xl bg-surface border border-border hover:border-purple-500/30 hover:bg-purple-500/5 transition-all"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                  <Gauge className="h-6 w-6 text-purple-400" />
                </div>
                <span className="text-sm font-medium text-text-primary text-center">Log Ride</span>
              </Link>
              <Link
                to="/driver/log-expense"
                className="group flex flex-col items-center gap-3 p-4 rounded-xl bg-surface border border-border hover:border-purple-500/30 hover:bg-purple-500/5 transition-all"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                  <DollarSign className="h-6 w-6 text-purple-400" />
                </div>
                <span className="text-sm font-medium text-text-primary text-center">Log Expense</span>
              </Link>
              {/* <Link
                to="/driver/apply"
                className="group flex flex-col items-center gap-3 p-4 rounded-xl bg-surface border border-border hover:border-purple-500/30 hover:bg-purple-500/5 transition-all"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                  <Car className="h-6 w-6 text-purple-400" />
                </div>
                <span className="text-sm font-medium text-text-primary text-center">Apply for Cars</span>
              </Link> */}
              <Link
                to="/driver/my-applications"
                className="group relative flex flex-col items-center gap-3 p-4 rounded-xl bg-surface border border-border hover:border-purple-500/30 hover:bg-purple-500/5 transition-all"
              >
                {myPendingApps.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-purple-500 text-[10px] font-bold text-white">
                    {myPendingApps.length}
                  </span>
                )}
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                  <FileText className="h-6 w-6 text-purple-400" />
                </div>
                <span className="text-sm font-medium text-text-primary text-center">My Applications</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  change,
  changeType,
  subtitle,
  color,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative';
  subtitle?: string;
  color: 'emerald' | 'blue' | 'purple';
}) {
  const colorClasses = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 rounded-xl bg-surface border border-border hover:border-border-light transition-colors"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-sm text-text-muted">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold text-text-primary">{value}</p>
        {change && (
          <span className={changeType === 'positive' ? 'text-success text-sm' : 'text-error text-sm'}>
            {change}
          </span>
        )}
        {subtitle && <span className="text-xs text-text-muted">{subtitle}</span>}
      </div>
    </motion.div>
  );
}

// Role Section Component
function RoleSection({
  title,
  icon: Icon,
  color,
  linkTo,
  linkLabel,
  children,
}: {
  title: string;
  icon: typeof TrendingUp;
  color: 'emerald' | 'blue' | 'purple';
  linkTo: string;
  linkLabel: string;
  children: React.ReactNode;
}) {
  const colorClasses = {
    emerald: 'bg-emerald-500/10 text-emerald-400',
    blue: 'bg-blue-500/10 text-blue-400',
    purple: 'bg-purple-500/10 text-purple-400',
  };

  return (
    <div className="p-6 rounded-2xl bg-surface-lighter border border-border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="font-heading text-lg font-semibold text-text-primary">{title}</h3>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to={linkTo} className="inline-flex items-center gap-2">
            <span>{linkLabel}</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      {children}
    </div>
  );
}

export { InvestorDashboard } from './InvestorDashboard';
export { OwnerDashboard } from './OwnerDashboard';
export { DriverDashboard } from './DriverDashboard';
