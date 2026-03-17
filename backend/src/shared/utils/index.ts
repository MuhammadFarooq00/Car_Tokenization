import { formatEther, parseEther, getAddress } from 'viem';

export function formatWei(wei: string): string {
  return formatEther(BigInt(wei));
}

export function toWei(eth: string): string {
  return parseEther(eth).toString();
}

export function paginate<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
) {
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/** Proper EIP-55 checksum address using viem */
export function checksumAddress(address: string): string {
  try {
    return getAddress(address);
  } catch {
    return address.toLowerCase();
  }
}

/** Validate Ethereum address format */
export function isValidEthAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
