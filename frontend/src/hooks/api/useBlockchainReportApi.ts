import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { queryKeys } from './keys';

// ─── Report Payloads ───────────────────────────────────────────────────────

interface ReportCarCreatedPayload {
  txHash: string;
  carId: number;
  totalShares: number;
  publicSupply: number;
  pricePerShare: string;
}

interface ReportPrimaryPurchasePayload {
  txHash: string;
  carId: number;
  amount: number;
  totalCost: string;
}

interface ReportListingCreatedPayload {
  txHash: string;
  listingId: number;
  carId: number;
  amount: number;
  pricePerShare: string;
}

interface ReportListingFilledPayload {
  txHash: string;
  listingId: number;
  amount: number;
  totalCost: string;
  carId: number;
}

interface ReportListingCancelledPayload {
  txHash: string;
  listingId: number;
}

// ─── Mutation Hooks ─────────────────────────────────────────────────────────

export function useReportCarCreated() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReportCarCreatedPayload) =>
      api.post('/blockchain/report/car-created', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolio.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.cars.all });
    },
  });
}

export function useReportPrimaryPurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReportPrimaryPurchasePayload) =>
      api.post('/blockchain/report/primary-purchase', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolio.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.cars.all });
    },
  });
}

export function useReportListingCreated() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReportListingCreatedPayload) =>
      api.post('/blockchain/report/listing-created', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolio.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.marketplace.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.revenue.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.cars.all });
    },
  });
}

export function useReportListingFilled() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReportListingFilledPayload) =>
      api.post('/blockchain/report/listing-filled', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolio.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.marketplace.all });
    },
  });
}

export function useReportListingCancelled() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReportListingCancelledPayload) =>
      api.post('/blockchain/report/listing-cancelled', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolio.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.marketplace.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.revenue.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.cars.all });
    },
  });
}
