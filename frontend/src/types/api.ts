// Backend API response types matching Prisma models

// ─── Enums ────────────────────────────────────────────────────────────────────

export type CarStatus = 'active' | 'paused' | 'retired';
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';
export type RideStatus = 'in_progress' | 'completed' | 'disputed';
export type ExpenseType = 'fuel' | 'maintenance' | 'cleaning' | 'insurance' | 'other';
export type ExpenseStatus = 'pending' | 'approved' | 'rejected';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type TransactionType = 'car_created' | 'primary_purchase' | 'listing_created' | 'listing_filled' | 'listing_cancelled';
export type KYCStatus = 'pending' | 'verified' | 'rejected';

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

// ─── Models ───────────────────────────────────────────────────────────────────

export interface ApiCar {
  id: number;
  ownerId: string;
  name: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  totalShares: number;
  publicSupply: number;          // shares originally on public sale
  sharesSold: number;            // sold so far in primary (external buyers only)
  remainingPublicSupply: number; // unsold, still in contract
  primarySaleActive: boolean;    // false once owner withdraws remaining supply
  sharesDistributed: number;     // total shares held across ALL holders (owner + buyers)
  pricePerShare: string; // wei string
  metadataCID: string;
  status: CarStatus;
  createdAt: string;
  owner?: { id: string; name: string; walletAddress: string | null };
  assignedDriver?: {
    id: string;
    userId: string;
    license: string;
    experience: number;
    rating: number;
    totalRides: number;
    approved: boolean;
    assignedCarId: number | null;
    user: { id: string; name: string };
  } | null;
}

export interface ApiUser {
  id: string;
  email: string | null;
  name: string;
  avatar: string | null;
  walletAddress: string | null;
  roles: string[];
  pendingRoles: string[];
  activeRole: string | null;
  kycVerified: boolean;
  createdAt: string;
}

export interface ApiUserWallet {
  id: string;
  address: string;
  isPrimary: boolean;
  label: string | null;
  connectedAt: string;
}

export interface ApiTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  carId: number;
  amount: number;
  price: string;
  txHash: string;
  blockNumber: number;
  timestamp: string;
  user?: { id: string; name: string; walletAddress: string | null };
}

export interface ApiRide {
  id: string;
  carId: number;
  driverId: string;
  pickup: string;
  dropoff: string;
  distance: number;
  duration: number;
  grossEarnings: string;
  commission: string;
  netEarnings: string;
  status: RideStatus;
  timestamp: string;
  car?: { id: number; name: string };
}

export interface ApiExpense {
  id: string;
  carId: number;
  submittedById: string;
  type: ExpenseType;
  amount: string;
  description: string | null;
  receipt: string | null;
  status: ExpenseStatus;
  submittedAt: string;
  approvedAt: string | null;
  car?: { id: number; name: string };
  submittedBy?: { id: string; name: string };
}

export interface ApiDividend {
  id: string;
  investorId: string;
  carId: number;
  amount: string;
  txHash: string | null;
  status: PaymentStatus;
  createdAt: string;
  paidAt: string | null;
  car?: { id: number; name: string; make: string; model: string };
}

export interface ApiDriverStats {
  monthEarnings: string; // wei
  monthRides: number;
  weekHours: number;
  todayEarnings: string; // wei
}

export interface ApiDriverProfile {
  id: string;
  userId: string;
  license: string;
  experience: number;
  rating: number;
  totalRides: number;
  approved: boolean;
  assignedCarId: number | null;
  assignedCar?: ApiCar | null;
}

export interface ApiDriverApplication {
  id: string;
  userId: string;
  carId: number;
  license: string;
  experience: number;
  documents: Record<string, string>;
  status: ApplicationStatus;
  reviewNote: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  user?: { id: string; name: string; email: string; avatar?: string | null };
  car?: { id: number; name: string; make: string; model: string; year: number; metadataCID?: string } | null;
}

export interface ApiKYCVerification {
  id: string;
  userId: string;
  documentType: string;
  documentUrl: string;
  selfieUrl: string | null;
  status: KYCStatus;
  reviewNote: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  user?: { id: string; name: string; email: string; walletAddress: string | null };
}

export interface ApiPortfolioSummary {
  holdings: ApiHolding[];
  totalValue: string;
  totalDividends: string;
  totalCarsInvested: number;
  recentTransactions: ApiTransaction[];
}

export interface ApiHolding {
  car: Pick<ApiCar, 'id' | 'name' | 'make' | 'model' | 'year' | 'pricePerShare' | 'totalShares' | 'metadataCID'> & {
    status: CarStatus;
    primarySaleActive: boolean;
    assignedDriver: {
      id: string;
      approved: boolean;
      user: { id: string; name: string };
    } | null;
  };
  shares: number;
  value: string;
}

export interface ApiMarketplaceListing {
  listingId: number;
  seller: string;
  sellerName?: string;
  carId: number;
  amount: number;
  pricePerShare: string;
  active: boolean;
  car?: Pick<ApiCar, 'id' | 'name' | 'make' | 'model' | 'year' | 'metadataCID' | 'pricePerShare'>;
}

export interface ApiActivityTransaction extends ApiTransaction {
  car?: { id: number; name: string; make: string; model: string } | null;
}

export interface ApiPlatformAnalytics {
  totalUsers: number;
  totalCars: number;
  totalRides: number;
  totalTransactions: number;
  newUsersLast30Days: number;
  accumulatedPlatformFees: string;
}

export interface ApiEarningsSummary {
  totalEarnings: string;
  pendingPayouts: string;
  monthlyBreakdown: Array<{ month: string; amount: string }>;
  byRole: {
    investor: string;
    owner: string;
    driver: string;
  };
}

// ─── Shareholder / Share Overview ──────────────────────────────────────────────

export interface ApiShareholder {
  userId: string;
  name: string;
  walletAddress: string | null;
  shares: number;
  percentage: number;
  isOwner: boolean;
}

export interface ApiCarShareholderData {
  carId: number;
  totalShares: number;
  sharesDistributed: number;
  shareholders: ApiShareholder[];
}

export interface ApiFleetShareOverview {
  totalSharesFleet: number;
  sharesDistributed: number;
  ownerHeldShares: number;
  totalMarketCap: string;
  shareRevenue: string;
}

// ─── Revenue & History Types ──────────────────────────────────────────────────

export interface ApiShareholderRevenue {
  userId: string;
  name: string;
  walletAddress: string | null;
  shares: number;          // liquid shares held in wallet
  sharesInEscrow: number;  // shares currently listed on marketplace (escrowed)
  trueShares: number;      // shares + sharesInEscrow = true ownership
  percentage: number;      // based on trueShares / totalShares
  earnedRevenue: string;   // wei — based on trueShares
  isOwner: boolean;
}

export interface ApiCarRevenueStats {
  carId: number;
  totalRidesGross: string; // wei — sum of grossEarnings from completed rides
  totalApprovedExpenses: string; // wei
  netCarRevenue: string; // wei
  totalRides: number;
  totalDistributed: string; // wei
  undistributedRevenue: string; // wei
  totalEscrowedShares: number; // shares currently locked in active marketplace listings
  shareholders: ApiShareholderRevenue[];
}

export interface ApiFleetPerCarRevenue {
  carId: number;
  name: string;
  gross: string;
  expenses: string;
  net: string;
  distributed: string;
}

export interface ApiFleetRevenueStats {
  totalFleetGross: string;
  totalFleetExpenses: string;
  totalFleetNetRevenue: string;
  totalDistributed: string;
  undistributed: string;
  perCar: ApiFleetPerCarRevenue[];
}

export type CarHistoryEventType = 'ride' | 'expense' | 'dividend';

export interface ApiCarHistoryEvent {
  type: CarHistoryEventType;
  id: string;
  timestamp: string;
  // ride fields
  pickup?: string;
  dropoff?: string;
  distance?: number;
  duration?: number;
  grossEarnings?: string;
  commission?: string;
  netEarnings?: string;
  status?: string;
  driverName?: string;
  driverId?: string;
  // expense fields
  expenseType?: string;
  amount?: string;
  description?: string;
  submittedBy?: string;
  submittedById?: string;
  receipt?: string;
  // dividend fields
  investorName?: string;
  investorId?: string;
  txHash?: string;
}

export interface ApiCarHistorySummary {
  totalRides: number;
  totalExpenses: number;
  totalDividends: number;
  totalGross: string;
  totalApprovedExpenses: string;
  netRevenue: string;
}

export interface ApiCarHistory {
  carId: number;
  carName: string;
  events: ApiCarHistoryEvent[];
  summary: ApiCarHistorySummary;
}

export interface ApiInvestorCarRevenue {
  car: {
    id: number;
    name: string;
    make: string;
    model: string;
    totalShares: number;
    pricePerShare: string;
    ownerId: string;
  };
  myShares: number;           // liquid shares held
  myEscrowedShares: number;   // shares in active marketplace listings
  myTrueShares: number;       // myShares + myEscrowedShares
  totalShares: number;
  totalEscrowedShares: number; // total shares in active listings across all users
  ownershipPct: number;       // based on myTrueShares
  totalCarNetRevenue: string;
  myEarnedRevenue: string;    // based on myTrueShares
  myClaimedDividends: string;
  myPendingDividends: string;
  allShareholders: ApiShareholderRevenue[];
}

// ─── Distribution & Dividend History ─────────────────────────────────────────

export interface ApiDistributionRecipient {
  userId: string;
  name: string;
  walletAddress: string | null;
  amount: string; // wei
}

export interface ApiDistributionEvent {
  txHash: string;
  distributedAt: string; // ISO date
  totalAmount: string; // wei
  recipients: ApiDistributionRecipient[];
}

export interface ApiCarDistributionHistory {
  carId: number;
  distributions: ApiDistributionEvent[];
}

export interface ApiInvestorCarDividend {
  id: string;
  investorId: string;
  carId: number;
  amount: string;
  txHash: string | null;
  status: PaymentStatus;
  createdAt: string;
  paidAt: string | null;
  car?: { id: number; name: string; make: string; model: string };
}

export interface ApiInvestorCarDividendHistory {
  carId: number;
  dividends: ApiInvestorCarDividend[];
  totalClaimed: string; // wei
}

// ─── Mutation Payloads ────────────────────────────────────────────────────────

export interface CreateCarPayload {
  id: number;
  name: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  totalShares: number;
  pricePerShare: string;
  metadataCID: string;
}

export interface ApplyDriverPayload {
  carId: number;
  license: string;
  experience: number;
  documents: Record<string, string>;
}

export interface LogRidePayload {
  carId: number;
  pickup: string;
  dropoff: string;
  distance: number;
  duration: number;
  grossEarnings: string;
}

export interface SubmitExpensePayload {
  carId: number;
  type: ExpenseType;
  amount: string;
  description?: string;
  receipt?: string;
}

export interface SubmitKYCPayload {
  documentType: string;
  documentUrl: string;
  selfieUrl?: string;
}

export interface ReviewPayload {
  status: string;
  reviewNote?: string;
}
