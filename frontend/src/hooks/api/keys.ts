// Centralized query key factory for TanStack Query cache management
//
// IMPORTANT: When optional params are omitted, the key must NOT include
// `undefined` — otherwise invalidateQueries() won't prefix-match the
// parameterised variant. Every factory with optional params therefore uses
// a ternary so that the "no-params" key is a strict prefix of the
// "with-params" key.

export const queryKeys = {
  cars: {
    all: ['cars'] as const,
    lists: () => [...queryKeys.cars.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.cars.lists(), params] as const,
    details: () => [...queryKeys.cars.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.cars.details(), id] as const,
    stats: (id: number) => [...queryKeys.cars.all, 'stats', id] as const,
    myOwned: () => [...queryKeys.cars.all, 'my-owned'] as const,
    ownerRides: (params?: Record<string, unknown>) =>
      params
        ? ([...queryKeys.cars.all, 'owner-rides', params] as const)
        : ([...queryKeys.cars.all, 'owner-rides'] as const),
    ownerExpenses: (params?: Record<string, unknown>) =>
      params
        ? ([...queryKeys.cars.all, 'owner-expenses', params] as const)
        : ([...queryKeys.cars.all, 'owner-expenses'] as const),
    ownerShareholders: () => [...queryKeys.cars.all, 'owner-shareholders'] as const,
    ownerShareOverview: () => [...queryKeys.cars.all, 'owner-share-overview'] as const,
    carShareholders: (carId: number) => [...queryKeys.cars.all, 'car-shareholders', carId] as const,
    saleStatus: (carId: number) => [...queryKeys.cars.all, 'sale-status', carId] as const,
  },

  marketplace: {
    all: ['marketplace'] as const,
    listings: (params?: Record<string, unknown>) =>
      params
        ? ([...queryKeys.marketplace.all, 'listings', params] as const)
        : ([...queryKeys.marketplace.all, 'listings'] as const),
    listing: (id: number) => [...queryKeys.marketplace.all, 'listing', id] as const,
    cost: (listingId: number, amount: number) =>
      [...queryKeys.marketplace.all, 'cost', listingId, amount] as const,
    fee: () => [...queryKeys.marketplace.all, 'fee'] as const,
    myTrades: (params?: Record<string, unknown>) =>
      params
        ? ([...queryKeys.marketplace.all, 'my-trades', params] as const)
        : ([...queryKeys.marketplace.all, 'my-trades'] as const),
    myListings: (params?: Record<string, unknown>) =>
      params
        ? ([...queryKeys.marketplace.all, 'my-listings', params] as const)
        : ([...queryKeys.marketplace.all, 'my-listings'] as const),
    carTrades: (carId: number, params?: Record<string, unknown>) =>
      params
        ? ([...queryKeys.marketplace.all, 'car-trades', carId, params] as const)
        : ([...queryKeys.marketplace.all, 'car-trades', carId] as const),
  },

  portfolio: {
    all: ['portfolio'] as const,
    summary: () => [...queryKeys.portfolio.all, 'summary'] as const,
    holdings: () => [...queryKeys.portfolio.all, 'holdings'] as const,
    carHolding: (carId: number) => [...queryKeys.portfolio.all, 'car', carId] as const,
    carDistributions: (carId: number) => [...queryKeys.portfolio.all, 'car-distributions', carId] as const,
    carDividends: (carId: number) => [...queryKeys.portfolio.all, 'car-dividends', carId] as const,
    dividends: (params?: Record<string, unknown>) =>
      params
        ? ([...queryKeys.portfolio.all, 'dividends', params] as const)
        : ([...queryKeys.portfolio.all, 'dividends'] as const),
    activity: (params?: Record<string, unknown>) =>
      params
        ? ([...queryKeys.portfolio.all, 'activity', params] as const)
        : ([...queryKeys.portfolio.all, 'activity'] as const),
  },

  users: {
    all: ['users'] as const,
    me: () => [...queryKeys.users.all, 'me'] as const,
    profile: () => [...queryKeys.users.all, 'profile'] as const,
    kyc: () => [...queryKeys.users.all, 'kyc-status'] as const,
    wallets: () => [...queryKeys.users.all, 'wallets'] as const,
  },

  drivers: {
    all: ['drivers'] as const,
    profile: () => [...queryKeys.drivers.all, 'profile'] as const,
    stats: () => [...queryKeys.drivers.all, 'stats'] as const,
    rides: (params?: Record<string, unknown>) =>
      params
        ? ([...queryKeys.drivers.all, 'rides', params] as const)
        : ([...queryKeys.drivers.all, 'rides'] as const),
    expenses: (params?: Record<string, unknown>) =>
      params
        ? ([...queryKeys.drivers.all, 'expenses', params] as const)
        : ([...queryKeys.drivers.all, 'expenses'] as const),
    myApplications: () => [...queryKeys.drivers.all, 'my-applications'] as const,
    applicationsForMyCars: (params?: Record<string, unknown>) =>
      params
        ? ([...queryKeys.drivers.all, 'for-my-cars', params] as const)
        : ([...queryKeys.drivers.all, 'for-my-cars'] as const),
  },

  earnings: {
    all: ['earnings'] as const,
    summary: () => [...queryKeys.earnings.all, 'summary'] as const,
    breakdown: (period?: string) =>
      period !== undefined
        ? ([...queryKeys.earnings.all, 'breakdown', period] as const)
        : ([...queryKeys.earnings.all, 'breakdown'] as const),
  },

  admin: {
    all: ['admin'] as const,
    users: (params?: Record<string, unknown>) =>
      params
        ? ([...queryKeys.admin.all, 'users', params] as const)
        : ([...queryKeys.admin.all, 'users'] as const),
    kycPending: (params?: Record<string, unknown>) =>
      params
        ? ([...queryKeys.admin.all, 'kyc-pending', params] as const)
        : ([...queryKeys.admin.all, 'kyc-pending'] as const),
    applicationsPending: (params?: Record<string, unknown>) =>
      params
        ? ([...queryKeys.admin.all, 'applications-pending', params] as const)
        : ([...queryKeys.admin.all, 'applications-pending'] as const),
    expensesPending: (params?: Record<string, unknown>) =>
      params
        ? ([...queryKeys.admin.all, 'expenses-pending', params] as const)
        : ([...queryKeys.admin.all, 'expenses-pending'] as const),
    transactions: (params?: Record<string, unknown>) =>
      params
        ? ([...queryKeys.admin.all, 'transactions', params] as const)
        : ([...queryKeys.admin.all, 'transactions'] as const),
    cars: (params?: Record<string, unknown>) =>
      params
        ? ([...queryKeys.admin.all, 'cars', params] as const)
        : ([...queryKeys.admin.all, 'cars'] as const),
    analytics: () => [...queryKeys.admin.all, 'analytics'] as const,
    onboardingPending: (params?: Record<string, unknown>) =>
      params
        ? ([...queryKeys.admin.all, 'onboarding-pending', params] as const)
        : ([...queryKeys.admin.all, 'onboarding-pending'] as const),
  },

  leaderboard: {
    all: ['leaderboard'] as const,
    stats: () => [...queryKeys.leaderboard.all, 'stats'] as const,
    investors: (limit?: number) =>
      limit !== undefined
        ? ([...queryKeys.leaderboard.all, 'investors', limit] as const)
        : ([...queryKeys.leaderboard.all, 'investors'] as const),
    owners: (limit?: number) =>
      limit !== undefined
        ? ([...queryKeys.leaderboard.all, 'owners', limit] as const)
        : ([...queryKeys.leaderboard.all, 'owners'] as const),
    drivers: (limit?: number) =>
      limit !== undefined
        ? ([...queryKeys.leaderboard.all, 'drivers', limit] as const)
        : ([...queryKeys.leaderboard.all, 'drivers'] as const),
  },

  notifications: {
    all: ['notifications'] as const,
    list: (params?: Record<string, unknown>) =>
      params
        ? ([...queryKeys.notifications.all, 'list', params] as const)
        : ([...queryKeys.notifications.all, 'list'] as const),
    unreadCount: () => [...queryKeys.notifications.all, 'unread-count'] as const,
  },

  revenue: {
    all: ['revenue'] as const,
    carRevenue: (carId: number) => ['revenue', 'car', carId] as const,
    fleetRevenue: () => ['revenue', 'fleet'] as const,
    carHistory: (carId: number) => ['revenue', 'history', carId] as const,
    investorCarRevenue: (carId: number) => ['revenue', 'investor', carId] as const,
  },

  likes: {
    all: ['likes'] as const,
    likedIds: () => [...queryKeys.likes.all, 'ids'] as const,
    likedCars: () => [...queryKeys.likes.all, 'cars'] as const,
  },
} as const;
