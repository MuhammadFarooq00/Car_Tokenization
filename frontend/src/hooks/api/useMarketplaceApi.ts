import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { queryKeys } from './keys';
import type { ApiMarketplaceListing, ApiTransaction, PaginatedResponse } from '@/types/api';

export function useMarketplaceListings(params?: { page?: number; limit?: number }) {
  const page = params?.page || 1;
  const limit = params?.limit || 12;
  return useQuery({
    queryKey: queryKeys.marketplace.listings({ page, limit }),
    queryFn: () => api.get<PaginatedResponse<ApiMarketplaceListing>>(
      `/marketplace/listings?page=${page}&limit=${limit}`,
    ),
    staleTime: 1000 * 60 * 1,
  });
}

export function useMyListings(params?: { page?: number; limit?: number }) {
  const page = params?.page || 1;
  const limit = params?.limit || 100;
  return useQuery({
    queryKey: queryKeys.marketplace.myListings({ page, limit }),
    queryFn: () => api.get<PaginatedResponse<ApiMarketplaceListing>>(
      `/marketplace/listings/me?page=${page}&limit=${limit}`,
    ),
  });
}

export function useMarketplaceListing(id: number) {
  return useQuery({
    queryKey: queryKeys.marketplace.listing(id),
    queryFn: () => api.get<ApiMarketplaceListing>(`/marketplace/listings/${id}`),
    enabled: id >= 0,
  });
}

export function useMarketplaceCost(listingId: number, amount: number) {
  return useQuery({
    queryKey: queryKeys.marketplace.cost(listingId, amount),
    queryFn: () =>
      api.get<{ baseCost: string; fee: string; total: string }>(
        `/marketplace/cost/${listingId}/${amount}`,
      ),
    enabled: listingId >= 0 && amount > 0,
  });
}

export function useMarketplaceFee() {
  return useQuery({
    queryKey: queryKeys.marketplace.fee(),
    queryFn: () => api.get<{ feeBps: number; feePercent: number }>('/marketplace/fee'),
    staleTime: 1000 * 60 * 30,
  });
}

export function useMyTradeHistory(params?: { page?: number; limit?: number }) {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  return useQuery({
    queryKey: queryKeys.marketplace.myTrades({ page, limit }),
    queryFn: () => api.get<PaginatedResponse<ApiTransaction>>(
      `/marketplace/trades/me?page=${page}&limit=${limit}`,
    ),
  });
}

export function useCarTradeHistory(carId: number, params?: { page?: number; limit?: number }) {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  return useQuery({
    queryKey: queryKeys.marketplace.carTrades(carId, { page, limit }),
    queryFn: () => api.get<PaginatedResponse<ApiTransaction>>(
      `/marketplace/trades/${carId}?page=${page}&limit=${limit}`,
    ),
    enabled: carId >= 0,
  });
}
