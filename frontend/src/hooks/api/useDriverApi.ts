import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { queryKeys } from './keys';
import type {
  ApiDriverProfile,
  ApiDriverStats,
  ApiRide,
  ApiExpense,
  ApplyDriverPayload,
  LogRidePayload,
  SubmitExpensePayload,
  ApiDriverApplication,
  PaginatedResponse,
} from '@/types/api';

export interface ApiDriverUser {
  id: string;
  name: string;
  avatar?: string | null;
  driverProfile?: {
    id: string;
    approved: boolean;
    totalRides: number;
    rating?: number | null;
    experience: number;
    assignedCarId?: number | null;
  } | null;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useDriverStats() {
  return useQuery({
    queryKey: queryKeys.drivers.stats(),
    queryFn: () => api.get<ApiDriverStats>('/drivers/stats'),
    staleTime: 1000 * 60 * 2, // 2 min
    retry: 1,
  });
}

export function useDriverProfile() {
  return useQuery({
    queryKey: queryKeys.drivers.profile(),
    queryFn: () => api.get<ApiDriverProfile>('/drivers/profile'),
    staleTime: 1000 * 60 * 5, // 5 min — profile rarely changes
    retry: 1,
  });
}

export function useDriverRides(params?: { page?: number; limit?: number }) {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  return useQuery({
    queryKey: queryKeys.drivers.rides({ page, limit }),
    queryFn: () => api.get<PaginatedResponse<ApiRide>>(
      `/drivers/rides?page=${page}&limit=${limit}`,
    ),
    staleTime: 1000 * 60 * 2, // 2 min
  });
}

export function useDriverExpenses(params?: { page?: number; limit?: number }) {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  return useQuery({
    queryKey: queryKeys.drivers.expenses({ page, limit }),
    queryFn: () => api.get<PaginatedResponse<ApiExpense>>(
      `/drivers/expenses?page=${page}&limit=${limit}`,
    ),
    staleTime: 1000 * 60 * 2, // 2 min
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useApplyAsDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ApplyDriverPayload) =>
      api.post<ApiDriverApplication>('/drivers/apply', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drivers.all });
    },
  });
}

export function useLogRide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LogRidePayload) => api.post<ApiRide>('/drivers/rides', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drivers.rides() });
      queryClient.invalidateQueries({ queryKey: queryKeys.drivers.stats() });
      queryClient.invalidateQueries({ queryKey: queryKeys.earnings.all });
    },
  });
}

export function useSubmitExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitExpensePayload) =>
      api.post<ApiExpense>('/drivers/expenses', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drivers.expenses() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.expensesPending() });
    },
  });
}

// ─── My Applications (applicant view) ─────────────────────────────────────────

export function useMyApplications(enabled = true) {
  return useQuery({
    queryKey: queryKeys.drivers.myApplications(),
    queryFn: () => api.get<ApiDriverApplication[]>('/drivers/applications'),
    enabled,
  });
}

// ─── Owner: applications for my cars ──────────────────────────────────────────

export function useApplicationsForMyCars(params?: { page?: number; limit?: number }, enabled = true) {
  const page = params?.page || 1;
  const limit = params?.limit || 50;
  return useQuery({
    queryKey: queryKeys.drivers.applicationsForMyCars({ page, limit }),
    queryFn: () => api.get<PaginatedResponse<ApiDriverApplication>>(
      `/drivers/applications/for-my-cars?page=${page}&limit=${limit}`,
    ),
    enabled,
  });
}

export function useReviewDriverApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reviewNote }: { id: string; status: 'approved' | 'rejected'; reviewNote?: string }) =>
      api.post(`/drivers/applications/${id}/review`, { status, reviewNote }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drivers.applicationsForMyCars() });
      queryClient.invalidateQueries({ queryKey: queryKeys.drivers.myApplications() });
      queryClient.invalidateQueries({ queryKey: queryKeys.drivers.profile() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.applicationsPending() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.analytics() });
    },
  });
}

// ─── Driver user list (for owner assign-driver picker) ────────────────────────

export function useDriverUsersList() {
  return useQuery({
    queryKey: ['drivers', 'user-list'],
    queryFn: () => api.get<ApiDriverUser[]>('/drivers/list'),
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

export function useAssignDriverToCar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ carId, driverUserId }: { carId: number; driverUserId: string }) =>
      api.post(`/cars/owner/me/car/${carId}/assign-driver`, { driverUserId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cars.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.cars.myOwned() });
    },
  });
}
