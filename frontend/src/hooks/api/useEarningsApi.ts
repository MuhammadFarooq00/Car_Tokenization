import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { queryKeys } from './keys';

interface EarningsSummary {
  totalEarnings: string;
  thisMonth: string;
  lastMonth: string;
  pendingPayout: string;
  nextPayoutDate: string | null;
}

interface EarningsBreakdownItem {
  period: string;
  amount: string;
  type: string;
}

export function useEarningsSummary() {
  return useQuery({
    queryKey: queryKeys.earnings.summary(),
    queryFn: () => api.get<EarningsSummary>('/earnings'),
  });
}

export function useEarningsBreakdown(period?: string) {
  return useQuery({
    queryKey: queryKeys.earnings.breakdown(period),
    queryFn: () =>
      api.get<EarningsBreakdownItem[]>(
        `/earnings/breakdown${period ? `?period=${period}` : ''}`,
      ),
  });
}
