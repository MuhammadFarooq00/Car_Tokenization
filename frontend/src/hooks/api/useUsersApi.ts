import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { queryKeys } from './keys';
import type { ApiUser, ApiUserWallet, ApiKYCVerification, SubmitKYCPayload } from '@/types/api';

export function useUserProfile() {
  return useQuery({
    queryKey: queryKeys.users.profile(),
    queryFn: () => api.get<ApiUser>('/users/profile'),
  });
}

export function useKYCStatus() {
  return useQuery({
    queryKey: queryKeys.users.kyc(),
    queryFn: () => api.get<ApiKYCVerification>('/users/kyc/status'),
  });
}

export function useLinkWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (walletAddress: string) =>
      api.patch('/users/wallet', { walletAddress }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.profile() });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.wallets() });
    },
  });
}

export function useSubmitKYC() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitKYCPayload) =>
      api.post('/users/kyc', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.kyc() });
    },
  });
}

// ─── Multi-wallet hooks ─────────────────────────────────────────────────────

export function useUserWallets() {
  return useQuery({
    queryKey: queryKeys.users.wallets(),
    queryFn: () => api.get<ApiUserWallet[]>('/users/wallets'),
  });
}

export function useAddWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (walletAddress: string) =>
      api.post<ApiUserWallet[]>('/users/wallets', { walletAddress }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.wallets() });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.profile() });
    },
  });
}

export function useSetPrimaryWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (address: string) =>
      api.patch<ApiUserWallet[]>(`/users/wallets/${address}/primary`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.wallets() });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.profile() });
    },
  });
}

export function useRemoveWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (address: string) =>
      api.delete<ApiUserWallet[]>(`/users/wallets/${address}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.wallets() });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.profile() });
    },
  });
}
