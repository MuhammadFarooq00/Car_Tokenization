import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { queryKeys } from './keys';

// ---------- Types ----------

export interface LeaderboardStats {
  totalUsers: number;
  totalCars: number;
  totalRides: number;
  totalTransactions: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string | null;
  walletAddress: string | null;
  kycVerified: boolean;
  joinedAt: string;
  totalCars?: number;
  totalRides?: number;
  totalSharesBought?: number;
}

// ---------- API calls ----------

async function fetchLeaderboardStats(): Promise<LeaderboardStats> {
  return api.get('/leaderboard/stats');
}

async function fetchTopInvestors(limit = 10): Promise<LeaderboardEntry[]> {
  return api.get(`/leaderboard/investors?limit=${limit}`);
}

async function fetchTopOwners(limit = 10): Promise<LeaderboardEntry[]> {
  return api.get(`/leaderboard/owners?limit=${limit}`);
}

async function fetchTopDrivers(limit = 10): Promise<LeaderboardEntry[]> {
  return api.get(`/leaderboard/drivers?limit=${limit}`);
}

// ---------- Hooks ----------

export function useLeaderboardStats() {
  return useQuery({
    queryKey: queryKeys.leaderboard.stats(),
    queryFn: fetchLeaderboardStats,
    staleTime: 60_000,
  });
}

export function useTopInvestors(limit = 10) {
  return useQuery({
    queryKey: queryKeys.leaderboard.investors(limit),
    queryFn: () => fetchTopInvestors(limit),
    staleTime: 60_000,
  });
}

export function useTopOwners(limit = 10) {
  return useQuery({
    queryKey: queryKeys.leaderboard.owners(limit),
    queryFn: () => fetchTopOwners(limit),
    staleTime: 60_000,
  });
}

export function useTopDrivers(limit = 10) {
  return useQuery({
    queryKey: queryKeys.leaderboard.drivers(limit),
    queryFn: () => fetchTopDrivers(limit),
    staleTime: 60_000,
  });
}
