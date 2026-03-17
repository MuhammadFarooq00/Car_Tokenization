import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { queryKeys } from './keys';
import type {
  ApiCar,
  ApiRide,
  ApiExpense,
  ApiCarShareholderData,
  ApiFleetShareOverview,
  ApiCarRevenueStats,
  ApiCarHistory,
  ApiFleetRevenueStats,
  PaginatedResponse,
  CreateCarPayload,
  CarStatus,
} from '@/types/api';

export function useCars(params?: { page?: number; limit?: number; status?: CarStatus }) {
  const page = params?.page || 1;
  const limit = params?.limit || 12;
  return useQuery({
    queryKey: queryKeys.cars.list({ page, limit, status: params?.status }),
    queryFn: () => {
      let url = `/cars?page=${page}&limit=${limit}`;
      if (params?.status) url += `&status=${params.status}`;
      return api.get<PaginatedResponse<ApiCar>>(url);
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useCar(id: number) {
  return useQuery({
    queryKey: queryKeys.cars.detail(id),
    queryFn: () => api.get<ApiCar>(`/cars/${id}`),
    enabled: id > 0, // never fire for id === 0 (unset)
    staleTime: 1000 * 60 * 5,
  });
}

export function useMyOwnedCars() {
  return useQuery({
    queryKey: queryKeys.cars.myOwned(),
    queryFn: () => api.get<ApiCar[]>('/cars/owner/me'),
  });
}

export function useCarStats(id: number) {
  return useQuery({
    queryKey: queryKeys.cars.stats(id),
    queryFn: () => api.get<Record<string, unknown>>(`/cars/${id}/stats`),
    enabled: id >= 0,
  });
}

export function useCreateCarApi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCarPayload) => api.post<ApiCar>('/cars', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cars.all });
    },
  });
}

// ─── Owner-specific hooks ─────────────────────────────────────────────────────

export function useOwnerCarRides(params?: { page?: number; limit?: number; carId?: number }) {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const carId = params?.carId;
  return useQuery({
    queryKey: queryKeys.cars.ownerRides({ page, limit, carId }),
    queryFn: () => {
      let url = `/cars/owner/me/rides?page=${page}&limit=${limit}`;
      if (carId) url += `&carId=${carId}`;
      return api.get<PaginatedResponse<ApiRide>>(url);
    },
  });
}

export function useOwnerCarExpenses(params?: { page?: number; limit?: number; carId?: number }) {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const carId = params?.carId;
  return useQuery({
    queryKey: queryKeys.cars.ownerExpenses({ page, limit, carId }),
    queryFn: () => {
      let url = `/cars/owner/me/expenses?page=${page}&limit=${limit}`;
      if (carId) url += `&carId=${carId}`;
      return api.get<PaginatedResponse<ApiExpense>>(url);
    },
  });
}

export function useOwnerShareholders() {
  return useQuery({
    queryKey: queryKeys.cars.ownerShareholders(),
    queryFn: () => api.get<{ count: number }>('/cars/owner/me/shareholders'),
  });
}

export function useSubmitOwnerExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { carId: number; type: string; amount: string; description?: string; receipt?: string }) =>
      api.post<ApiExpense>('/cars/owner/me/expenses', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cars.ownerExpenses() });
      queryClient.invalidateQueries({ queryKey: queryKeys.revenue.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.earnings.all });
    },
  });
}

export function useReviewExpenseAsOwner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) =>
      api.post(`/cars/owner/me/expenses/${id}/review`, { status }),
    onSuccess: () => {
      // Invalidate expense list (so status badge flips immediately)
      queryClient.invalidateQueries({ queryKey: queryKeys.cars.ownerExpenses() });
      // Invalidate all revenue/stats queries so stat cards update instantly
      queryClient.invalidateQueries({ queryKey: queryKeys.revenue.all });
      // Invalidate earnings summary
      queryClient.invalidateQueries({ queryKey: queryKeys.earnings.all });
    },
  });
}

export function useCarShareholders(carId: number) {
  return useQuery({
    queryKey: queryKeys.cars.carShareholders(carId),
    queryFn: () => api.get<ApiCarShareholderData>(`/cars/owner/me/car/${carId}/shareholders`),
    enabled: carId >= 0,
  });
}

export function useFleetShareOverview() {
  return useQuery({
    queryKey: queryKeys.cars.ownerShareOverview(),
    queryFn: () => api.get<ApiFleetShareOverview>('/cars/owner/me/share-overview'),
  });
}

// ─── Revenue / History hooks ───────────────────────────────────────────────────

export function useCarRevenueStats(carId: number) {
  return useQuery({
    queryKey: queryKeys.revenue.carRevenue(carId),
    queryFn: () => api.get<ApiCarRevenueStats>(`/cars/owner/me/car/${carId}/revenue-stats`),
    enabled: carId > 0,
  });
}

export function useCarHistory(carId: number) {
  return useQuery({
    queryKey: queryKeys.revenue.carHistory(carId),
    queryFn: () => api.get<ApiCarHistory>(`/cars/owner/me/car/${carId}/history`),
    enabled: carId > 0,
  });
}

export function useFleetRevenueStats() {
  return useQuery({
    queryKey: queryKeys.revenue.fleetRevenue(),
    queryFn: () => api.get<ApiFleetRevenueStats>('/cars/owner/me/fleet-revenue'),
  });
}

// ─── Report public supply withdrawn (closes primary sale) ─────────────────────

export function useReportPublicSupplyWithdrawn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { txHash: string; carId: number; amount: number }) =>
      api.post('/blockchain/report/public-supply-withdrawn', payload),
    onSuccess: (_data, variables) => {
      // Invalidate all car-related caches so UI updates immediately
      queryClient.invalidateQueries({ queryKey: queryKeys.cars.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.cars.saleStatus(variables.carId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.revenue.carRevenue(variables.carId) });
    },
  });
}
