import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { queryKeys } from './keys';
import type {
  ApiUser,
  ApiKYCVerification,
  ApiDriverApplication,
  ApiExpense,
  ApiTransaction,
  ApiCar,
  ApiPlatformAnalytics,
  PaginatedResponse,
} from '@/types/api';

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useAdminUsers(params?: { page?: number; limit?: number }) {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  return useQuery({
    queryKey: queryKeys.admin.users({ page, limit }),
    queryFn: () => api.get<PaginatedResponse<ApiUser>>(
      `/admin/users?page=${page}&limit=${limit}`,
    ),
  });
}

export function useAdminPendingKYC(params?: { page?: number; limit?: number }) {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  return useQuery({
    queryKey: queryKeys.admin.kycPending({ page, limit }),
    queryFn: () => api.get<PaginatedResponse<ApiKYCVerification>>(
      `/admin/kyc/pending?page=${page}&limit=${limit}`,
    ),
  });
}

export function useAdminPendingApplications(params?: { page?: number; limit?: number }) {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  return useQuery({
    queryKey: queryKeys.admin.applicationsPending({ page, limit }),
    queryFn: () => api.get<PaginatedResponse<ApiDriverApplication>>(
      `/admin/applications/pending?page=${page}&limit=${limit}`,
    ),
  });
}

export function useAdminPendingExpenses(params?: { page?: number; limit?: number }) {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  return useQuery({
    queryKey: queryKeys.admin.expensesPending({ page, limit }),
    queryFn: () => api.get<PaginatedResponse<ApiExpense>>(
      `/admin/expenses/pending?page=${page}&limit=${limit}`,
    ),
  });
}

export function useAdminTransactions(params?: { page?: number; limit?: number }) {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  return useQuery({
    queryKey: queryKeys.admin.transactions({ page, limit }),
    queryFn: () => api.get<PaginatedResponse<ApiTransaction>>(
      `/admin/transactions?page=${page}&limit=${limit}`,
    ),
  });
}

export function useAdminCars(params?: { page?: number; limit?: number }) {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  return useQuery({
    queryKey: queryKeys.admin.cars({ page, limit }),
    queryFn: () => api.get<PaginatedResponse<ApiCar>>(
      `/admin/cars?page=${page}&limit=${limit}`,
    ),
  });
}

export function useAdminAnalytics() {
  return useQuery({
    queryKey: queryKeys.admin.analytics(),
    queryFn: () => api.get<ApiPlatformAnalytics>('/admin/analytics'),
    staleTime: 1000 * 60 * 5,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useReviewKYC() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reviewNote }: { id: string; status: string; reviewNote?: string }) =>
      api.post(`/admin/kyc/${id}/review`, { status, reviewNote }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.kycPending() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.analytics() });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.kyc() });
    },
  });
}

export function useReviewApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reviewNote }: { id: string; status: string; reviewNote?: string }) =>
      api.post(`/admin/applications/${id}/review`, { status, reviewNote }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.applicationsPending() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.analytics() });
      queryClient.invalidateQueries({ queryKey: queryKeys.drivers.myApplications() });
      queryClient.invalidateQueries({ queryKey: queryKeys.drivers.applicationsForMyCars() });
      queryClient.invalidateQueries({ queryKey: queryKeys.drivers.profile() });
    },
  });
}

export function useReviewExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) =>
      api.post(`/admin/expenses/${id}/review`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.expensesPending() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.analytics() });
      queryClient.invalidateQueries({ queryKey: queryKeys.drivers.expenses() });
      queryClient.invalidateQueries({ queryKey: queryKeys.earnings.all });
    },
  });
}

export function useTriggerSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/admin/sync'),
    onSuccess: () => {
      // Sync touches everything — invalidate broadly
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.analytics() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.transactions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.cars() });
      queryClient.invalidateQueries({ queryKey: queryKeys.cars.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolio.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.marketplace.all });
    },
  });
}

export function useUpdateUserRoles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, roles }: { id: string; roles: string[] }) =>
      api.put(`/admin/users/${id}/roles`, { roles }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.analytics() });
    },
  });
}

export function useAdminPendingOnboarding(params?: { page?: number; limit?: number }) {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  return useQuery({
    queryKey: queryKeys.admin.onboardingPending({ page, limit }),
    queryFn: () => api.get<PaginatedResponse<ApiUser>>(
      `/admin/onboarding/pending?page=${page}&limit=${limit}`,
    ),
  });
}

export function useReviewOnboardingRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      role,
      decision,
      reviewNote,
    }: {
      userId: string;
      role: string;
      decision: 'approved' | 'rejected';
      reviewNote?: string;
    }) =>
      api.post(`/admin/onboarding/${userId}/role/review`, { role, decision, reviewNote }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.onboardingPending() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.analytics() });
    },
  });
}
