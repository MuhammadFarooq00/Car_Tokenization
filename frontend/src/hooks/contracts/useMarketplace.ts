import {
  useReadContract,
  useWriteContract,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useChainId,
} from 'wagmi';
import { MarketplaceABI } from '@/contracts/abis/Marketplace';
import { getContractAddresses } from '@/contracts/addresses';
import type { Listing } from '@/types';
import type { Address } from 'viem';

// Get contract address for current chain
function useMarketplaceAddress() {
  const chainId = useChainId();
  try {
    return getContractAddresses(chainId).marketplace;
  } catch {
    return undefined;
  }
}

// Read hooks
export function useNextListingId() {
  const address = useMarketplaceAddress();
  return useReadContract({
    address,
    abi: MarketplaceABI,
    functionName: 'nextListingId',
    query: { enabled: !!address },
  });
}

export function useListing(listingId: bigint) {
  const address = useMarketplaceAddress();
  return useReadContract({
    address,
    abi: MarketplaceABI,
    functionName: 'getListing',
    args: [listingId],
    query: { enabled: !!address && listingId > 0n },
  }) as ReturnType<typeof useReadContract> & { data: Listing | undefined };
}

export function useIsListingActive(listingId: bigint) {
  const address = useMarketplaceAddress();
  return useReadContract({
    address,
    abi: MarketplaceABI,
    functionName: 'isListingActive',
    args: [listingId],
    query: { enabled: !!address && listingId > 0n },
  });
}

export function useActiveListing(seller: Address | undefined, carId: bigint) {
  const address = useMarketplaceAddress();
  return useReadContract({
    address,
    abi: MarketplaceABI,
    functionName: 'getActiveListing',
    args: seller ? [seller, carId] : undefined,
    query: { enabled: !!address && !!seller && carId > 0n },
  });
}

export function useCalculateCost(listingId: bigint, amount: bigint) {
  const address = useMarketplaceAddress();
  return useReadContract({
    address,
    abi: MarketplaceABI,
    functionName: 'calculateCost',
    args: [listingId, amount],
    query: { enabled: !!address && listingId > 0n && amount > 0n },
  }) as ReturnType<typeof useReadContract> & {
    data: readonly [bigint, bigint, bigint] | undefined;
  };
}

// Write hooks with simulation
export function useCreateListing() {
  const address = useMarketplaceAddress();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createListing = (carId: bigint, amount: bigint, pricePerShare: bigint) => {
    if (!address) return;
    writeContract({
      address,
      abi: MarketplaceABI,
      functionName: 'createListing',
      args: [carId, amount, pricePerShare],
    });
  };

  return {
    createListing,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useBuyFromListing(listingId: bigint, amount: bigint, value: bigint) {
  const address = useMarketplaceAddress();

  // Simulate first
  const { data: simulation, error: simulateError } = useSimulateContract({
    address,
    abi: MarketplaceABI,
    functionName: 'buyFromListing',
    args: [listingId, amount],
    value,
    query: { enabled: !!address && listingId > 0n && amount > 0n && value > 0n },
  });

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const execute = () => {
    if (simulation?.request) {
      writeContract(simulation.request);
    }
  };

  return {
    execute,
    canExecute: !!simulation?.request,
    simulateError,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useCancelListing() {
  const address = useMarketplaceAddress();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const cancelListing = (listingId: bigint) => {
    if (!address) return;
    writeContract({
      address,
      abi: MarketplaceABI,
      functionName: 'cancelListing',
      args: [listingId],
    });
  };

  return {
    cancelListing,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Get marketplace contract address (for approval)
export function useMarketplaceContractAddress() {
  return useMarketplaceAddress();
}
