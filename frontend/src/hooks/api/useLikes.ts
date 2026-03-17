/**
 * Likes / Favourites — stored in localStorage.
 * Key: `car_likes` → JSON array of car IDs (numbers).
 */

import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { queryKeys } from './keys';
import type { ApiCar } from '@/types/api';

const STORAGE_KEY = 'car_likes';

function readLikedIds(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'number') : [];
  } catch {
    return [];
  }
}

function writeLikedIds(ids: number[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

// ─── Core likes hook ───────────────────────────────────────────────────────

export function useLikes() {
  const [likedIds, setLikedIds] = useState<Set<number>>(() => new Set(readLikedIds()));

  // Listen for cross-tab storage changes ONLY (not same-tab — we update state directly)
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setLikedIds(new Set(readLikedIds()));
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const toggleLike = useCallback((carId: number) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(carId)) {
        next.delete(carId);
      } else {
        next.add(carId);
      }
      // Write to localStorage immediately inside the setter — no useEffect needed
      writeLikedIds(Array.from(next));
      return next;
    });
  }, []);

  const isLiked = useCallback(
    (carId: number) => likedIds.has(carId),
    [likedIds],
  );

  return {
    likedIds,
    likedCount: likedIds.size,
    isLiked,
    toggleLike,
  };
}

// ─── Liked cars data hook (fetches full ApiCar objects) ───────────────────

export function useLikedCars() {
  const { likedIds, likedCount, isLiked, toggleLike } = useLikes();
  const ids = Array.from(likedIds);

  const { data: likedCars, isLoading } = useQuery({
    queryKey: [...queryKeys.likes.likedCars(), ids],
    queryFn: async () => {
      if (ids.length === 0) return [] as ApiCar[];
      const results = await Promise.all(
        ids.map((id) => api.get<ApiCar>(`/cars/${id}`).catch(() => null)),
      );
      return results.filter((c): c is ApiCar => c !== null);
    },
    staleTime: 1000 * 60 * 2,
    enabled: ids.length > 0,
  });

  return {
    likedCars: likedCars ?? [],
    isLoading: ids.length > 0 && isLoading,
    likedIds,
    likedCount,
    isLiked,
    toggleLike,
  };
}
