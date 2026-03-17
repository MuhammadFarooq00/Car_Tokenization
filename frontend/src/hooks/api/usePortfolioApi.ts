import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { queryKeys } from './keys';
import type {
  ApiPortfolioSummary,
  ApiHolding,
  ApiDividend,
  ApiActivityTransaction,
  ApiInvestorCarRevenue,
  ApiCarDistributionHistory,
  ApiInvestorCarDividendHistory,
  PaginatedResponse,
} from '@/types/api';

export function usePortfolioSummary() {
  return useQuery({
    queryKey: queryKeys.portfolio.summary(),
    queryFn: () => api.get<ApiPortfolioSummary>('/portfolio'),
  });
}

export function usePortfolioHoldings() {
  return useQuery({
    queryKey: queryKeys.portfolio.holdings(),
    queryFn: () => api.get<ApiHolding[]>('/portfolio/holdings'),
  });
}

export function useCarHolding(carId: number) {
  return useQuery({
    queryKey: queryKeys.portfolio.carHolding(carId),
    queryFn: () => api.get<ApiHolding>(`/portfolio/car/${carId}`),
    enabled: carId >= 0,
  });
}

export function usePortfolioDividends(params?: { page?: number; limit?: number }) {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  return useQuery({
    queryKey: queryKeys.portfolio.dividends({ page, limit }),
    queryFn: () => api.get<PaginatedResponse<ApiDividend>>(
      `/portfolio/dividends?page=${page}&limit=${limit}`,
    ),
  });
}

export function useActivityHistory(params?: { page?: number; limit?: number }) {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  return useQuery({
    queryKey: queryKeys.portfolio.activity({ page, limit }),
    queryFn: () => api.get<PaginatedResponse<ApiActivityTransaction>>(
      `/portfolio/activity?page=${page}&limit=${limit}`,
    ),
  });
}

export function useCarRevenueForInvestor(carId: number) {
  return useQuery({
    queryKey: queryKeys.revenue.investorCarRevenue(carId),
    queryFn: () => api.get<ApiInvestorCarRevenue>(`/portfolio/car/${carId}/revenue`),
    enabled: carId > 0,
  });
}

export function useCarDistributionHistory(carId: number) {
  return useQuery({
    queryKey: queryKeys.portfolio.carDistributions(carId),
    queryFn: () => api.get<ApiCarDistributionHistory>(`/portfolio/car/${carId}/distributions`),
    enabled: carId > 0,
  });
}

export function useInvestorCarDividendHistory(carId: number) {
  return useQuery({
    queryKey: queryKeys.portfolio.carDividends(carId),
    queryFn: () => api.get<ApiInvestorCarDividendHistory>(`/portfolio/car/${carId}/dividends`),
    enabled: carId > 0,
  });
}
