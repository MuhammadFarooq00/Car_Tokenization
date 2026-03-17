import {
  useReadContract,
  useWriteContract,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useAccount,
  useChainId,
} from 'wagmi';
import { CarSharesABI } from '@/contracts/abis/CarShares';
import { getContractAddresses } from '@/contracts/addresses';
import type { CarConfig } from '@/types';
import type { Address } from 'viem';

// Get contract address for current chain
function useCarSharesAddress() {
  const chainId = useChainId();
  try {
    return getContractAddresses(chainId).carShares;
  } catch {
    return undefined;
  }
}

// Read hooks
export function useNextCarId() {
  const address = useCarSharesAddress();
  return useReadContract({
    address,
    abi: CarSharesABI,
    functionName: 'nextCarId',
    query: { enabled: !!address },
  });
}

export function useCarConfig(carId: bigint) {
  const address = useCarSharesAddress();
  return useReadContract({
    address,
    abi: CarSharesABI,
    functionName: 'getCarConfig',
    args: [carId],
    query: { enabled: !!address && carId > 0n },
  }) as ReturnType<typeof useReadContract> & { data: CarConfig | undefined };
}

export function useCarExists(carId: bigint) {
  const address = useCarSharesAddress();
  return useReadContract({
    address,
    abi: CarSharesABI,
    functionName: 'carExists',
    args: [carId],
    query: { enabled: !!address && carId > 0n },
  });
}

export function useCarUri(carId: bigint) {
  const address = useCarSharesAddress();
  return useReadContract({
    address,
    abi: CarSharesABI,
    functionName: 'uri',
    args: [carId],
    query: { enabled: !!address && carId > 0n },
  });
}

export function useBalanceOf(account: Address | undefined, carId: bigint) {
  const address = useCarSharesAddress();
  return useReadContract({
    address,
    abi: CarSharesABI,
    functionName: 'balanceOf',
    args: account ? [account, carId] : undefined,
    query: { enabled: !!address && !!account && carId > 0n },
  });
}

export function useGlobalFeeBps() {
  const address = useCarSharesAddress();
  return useReadContract({
    address,
    abi: CarSharesABI,
    functionName: 'globalFeeBps',
    query: { enabled: !!address },
  });
}

export function usePrimarySalesPaused() {
  const address = useCarSharesAddress();
  return useReadContract({
    address,
    abi: CarSharesABI,
    functionName: 'primarySalesPaused',
    query: { enabled: !!address },
  });
}

export function useAccumulatedFees() {
  const address = useCarSharesAddress();
  return useReadContract({
    address,
    abi: CarSharesABI,
    functionName: 'accumulatedFees',
    query: { enabled: !!address },
  });
}

export function useContractOwner() {
  const address = useCarSharesAddress();
  return useReadContract({
    address,
    abi: CarSharesABI,
    functionName: 'owner',
    query: { enabled: !!address },
  });
}

export function useIsApprovedForAll(owner: Address | undefined, operator: Address | undefined) {
  const address = useCarSharesAddress();
  return useReadContract({
    address,
    abi: CarSharesABI,
    functionName: 'isApprovedForAll',
    args: owner && operator ? [owner, operator] : undefined,
    query: { enabled: !!address && !!owner && !!operator },
  });
}

// Write hooks with simulation
export function useCreateCar() {
  const address = useCarSharesAddress();
  const chainId = useChainId();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createCar = (
    totalSupply: bigint,
    publicRatioBps: bigint,
    pricePerShare: bigint,
    minPrimaryBuy: bigint,
    metadataCID: string
  ) => {
    if (!address) {
      console.error(`Contract not configured for chain ID: ${chainId}`);
      return;
    }
    console.log('Creating car with params:', {
      address,
      totalSupply: totalSupply.toString(),
      publicRatioBps: publicRatioBps.toString(),
      pricePerShare: pricePerShare.toString(),
      minPrimaryBuy: minPrimaryBuy.toString(),
      metadataCID,
    });
    writeContract({
      address,
      abi: CarSharesABI,
      functionName: 'createCar',
      args: [totalSupply, publicRatioBps, pricePerShare, minPrimaryBuy, metadataCID],
    });
  };

  return {
    createCar,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    contractAddress: address,
  };
}

export function useBuyPrimary(carId: bigint, amount: bigint, value: bigint) {
  const address = useCarSharesAddress();

  // Simulate first
  const { data: simulation, error: simulateError } = useSimulateContract({
    address,
    abi: CarSharesABI,
    functionName: 'buyPrimary',
    args: [carId, amount],
    value,
    query: { enabled: !!address && carId > 0n && amount > 0n && value > 0n },
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

export function useSetApprovalForAll() {
  const address = useCarSharesAddress();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const setApproval = (operator: Address, approved: boolean) => {
    if (!address) return;
    writeContract({
      address,
      abi: CarSharesABI,
      functionName: 'setApprovalForAll',
      args: [operator, approved],
    });
  };

  return {
    setApproval,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Admin functions
export function useSetGlobalFee() {
  const address = useCarSharesAddress();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const setFee = (newFeeBps: number) => {
    if (!address) return;
    writeContract({
      address,
      abi: CarSharesABI,
      functionName: 'setGlobalFee',
      args: [BigInt(newFeeBps)],
    });
  };

  return {
    setFee,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function usePausePrimarySales() {
  const address = useCarSharesAddress();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const pause = (paused: boolean) => {
    if (!address) return;
    writeContract({
      address,
      abi: CarSharesABI,
      functionName: 'pausePrimarySales',
      args: [paused],
    });
  };

  return {
    pause,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useWithdrawFees() {
  const address = useCarSharesAddress();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const withdraw = () => {
    if (!address) return;
    writeContract({
      address,
      abi: CarSharesABI,
      functionName: 'withdrawFees',
    });
  };

  return {
    withdraw,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Hook to check if user is platform owner
export function useIsPlatformOwner() {
  const { address: userAddress } = useAccount();
  const { data: ownerAddress } = useContractOwner();

  return {
    isOwner: userAddress && ownerAddress && userAddress.toLowerCase() === ownerAddress.toLowerCase(),
    ownerAddress,
  };
}

// ─── Earnings hooks ────────────────────────────────────────────────────────────

/** Read on-chain earnings balance deposited for a car */
export function useCarEarningsBalance(carId: bigint) {
  const address = useCarSharesAddress();
  return useReadContract({
    address,
    abi: CarSharesABI,
    functionName: 'carEarningsBalance',
    args: [carId],
    query: { enabled: !!address && carId > 0n },
  });
}

/**
 * Owner deposits ETH into the contract for a given car.
 * Call `deposit(carId, ethValue)` where `ethValue` is in wei (bigint).
 */
export function useDepositEarnings() {
  const address = useCarSharesAddress();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const deposit = (carId: bigint, value: bigint) => {
    if (!address) return;
    writeContract({
      address,
      abi: CarSharesABI,
      functionName: 'depositCarEarnings',
      args: [carId],
      value,
    });
  };

  return { deposit, hash, isPending, isConfirming, isSuccess, error, reset };
}

/**
 * Owner burns remaining unsold public supply — closes the primary sale.
 * After this tx, primarySaleActive = false, unsold shares are destroyed,
 * and totalSupply is reduced to only the actually circulating shares.
 */
export function useBurnPublicSupply() {
  const address = useCarSharesAddress();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const burn = (carId: bigint) => {
    if (!address) return;
    // Use a conservative gas limit to avoid exceeding Hoodi testnet block gas cap.
    writeContract({
      address,
      abi: CarSharesABI,
      functionName: 'burnPublicSupply',
      args: [carId],
      gas: 300_000n,
    });
  };

  return { burn, hash, isPending, isConfirming, isSuccess, error, reset };
}

/**
 * Owner distributes deposited earnings to all shareholders proportionally.
 * Passes shareholders[], shareAmounts[], totalShares to the contract.
 */
export function useDistributeEarnings() {
  const address = useCarSharesAddress();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const distribute = (
    carId: bigint,
    shareholders: Address[],
    shareAmounts: bigint[],
    totalShares: bigint,
  ) => {
    if (!address) return;
    // Use a conservative gas limit: 80k base + 30k per shareholder.
    // Hoodi testnet rejects transactions whose gas limit exceeds the block gas limit,
    // so we must not let wagmi over-estimate.
    const gasLimit = BigInt(80_000 + shareholders.length * 30_000);
    writeContract({
      address,
      abi: CarSharesABI,
      functionName: 'distributeEarnings',
      args: [carId, shareholders, shareAmounts, totalShares],
      gas: gasLimit,
    });
  };

  return { distribute, hash, isPending, isConfirming, isSuccess, error, reset };
}
