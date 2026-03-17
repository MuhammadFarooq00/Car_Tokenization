import { useQuery } from '@tanstack/react-query';
import { getIpfsUrl } from '@/lib/utils';
import type { CarMetadata } from '@/types';

async function fetchMetadata(cid: string): Promise<CarMetadata | null> {
  if (!cid) return null;

  try {
    const url = getIpfsUrl(cid);
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch metadata');
    return response.json();
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return null;
  }
}

export function useCarMetadata(cid: string | undefined) {
  return useQuery({
    queryKey: ['carMetadata', cid],
    queryFn: () => fetchMetadata(cid || ''),
    enabled: !!cid,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}
