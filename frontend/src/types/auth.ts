// User roles in the platform (excluding admin which is separate)
export type UserRole = 'investor' | 'car_owner' | 'driver' | 'admin';

// Roles that regular users can have (multi-role capable)
export type RegularUserRole = 'investor' | 'car_owner' | 'driver';

// User profile information
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  // Multi-role support: users can have multiple roles simultaneously
  roles: UserRole[];
  // Active role context for navigation/display purposes
  activeRole?: RegularUserRole;
  walletAddress?: string;
  createdAt: Date;
  updatedAt: Date;
  // KYC verification status
  kycVerified?: boolean;
  // Onboarding questionnaire status
  onboardingCompleted?: boolean;

  // Role-specific data organized by role
  investorData?: {
    portfolioValue: number;
    totalDividends: number;
  };
  ownerData?: {
    ownedCars: number[];
    totalShareholders: number;
  };
  driverData?: {
    assignedCars: number[];
    driverLicense?: string;
    driverApproved: boolean;
    rating: number;
  };
}

// Auth state
export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Login credentials
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Signup data - now supports multiple roles
export interface SignupData {
  email: string;
  password: string;
  name: string;
  roles: RegularUserRole[]; // Multiple roles can be selected
  acceptTerms: boolean;
}

// Auth context type
export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithWallet: () => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  // Multi-role helpers
  hasRole: (role: UserRole) => boolean;
  setActiveRole: (role: RegularUserRole) => void;
  addRole: (role: RegularUserRole) => void;
  removeRole: (role: RegularUserRole) => void;
  isAdmin: () => boolean;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Role metadata for UI
export interface RoleInfo {
  id: UserRole;
  title: string;
  description: string;
  icon: string;
  features: string[];
}

export const ROLE_INFO: Record<UserRole, RoleInfo> = {
  investor: {
    id: 'investor',
    title: 'Investor',
    description: 'Invest in premium vehicles and earn passive income from their operations',
    icon: 'TrendingUp',
    features: [
      'Browse and invest in tokenized cars',
      'Track portfolio performance',
      'Receive dividend distributions',
      'Trade shares on secondary market',
    ],
  },
  car_owner: {
    id: 'car_owner',
    title: 'Car Owner',
    description: 'List your vehicle for investment and manage its operations',
    icon: 'Car',
    features: [
      'Tokenize your vehicle',
      'Manage share offerings',
      'Assign drivers to your cars',
      'Monitor earnings and expenses',
    ],
  },
  driver: {
    id: 'driver',
    title: 'Driver',
    description: 'Drive tokenized vehicles and earn from ride operations',
    icon: 'Gauge',
    features: [
      'Apply to drive listed cars',
      'Log rides and earnings',
      'Track fuel expenses',
      'Build your driver rating',
    ],
  },
  admin: {
    id: 'admin',
    title: 'Platform Admin',
    description: 'Manage platform settings, users, and operations',
    icon: 'Shield',
    features: [
      'Approve driver applications',
      'Manage KYC verifications',
      'Configure platform fees',
      'View platform analytics',
    ],
  },
};

// Backend auth response types
export interface BackendUserProfile {
  id: string;
  email: string | null;
  name: string;
  avatar: string | null;
  walletAddress: string | null;
  roles: UserRole[];
  activeRole: string | null;
  kycVerified: boolean;
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

// Role display info for unified dashboard
export const ROLE_TABS: Record<RegularUserRole, { label: string; icon: string; color: string }> = {
  investor: { label: 'Investor', icon: 'TrendingUp', color: 'emerald' },
  car_owner: { label: 'Car Owner', icon: 'Car', color: 'blue' },
  driver: { label: 'Driver', icon: 'Gauge', color: 'purple' },
};
