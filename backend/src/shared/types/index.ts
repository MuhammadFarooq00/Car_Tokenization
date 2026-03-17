export type { UserRole, CarStatus, ApplicationStatus, RideStatus, ExpenseType, ExpenseStatus, PaymentStatus, TransactionType, KYCStatus } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email?: string;
  walletAddress?: string;
  roles: string[];
  activeRole?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
