import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatEther, parseEther } from 'viem';
import { PLATFORM_CONFIG } from '@/app/config';

// Classname utility for Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format ETH value with proper decimals (from bigint)
export function formatEth(value: bigint, decimals = 4): string {
  const formatted = formatEther(value);
  const num = parseFloat(formatted);
  if (num === 0) return '0';
  if (num < 0.0001) return '<0.0001';
  return num.toFixed(decimals);
}

// Format ETH value from a wei string (convenience wrapper)
export function weiToEth(wei: string, decimals = 4): string {
  try {
    return formatEth(BigInt(wei), decimals);
  } catch {
    const num = Number(wei) / 1e18;
    if (num === 0) return '0';
    if (num < 0.0001) return '<0.0001';
    return num.toFixed(decimals);
  }
}

// Parse ETH string to wei
export function parseEth(value: string): bigint {
  try {
    return parseEther(value);
  } catch {
    return 0n;
  }
}

// Calculate total cost with fee
export function calculateTotalCost(
  amount: bigint,
  pricePerShare: bigint,
  feeBps: number = PLATFORM_CONFIG.platformFeeBps
): { baseCost: bigint; fee: bigint; total: bigint } {
  const baseCost = amount * pricePerShare;
  const fee = (baseCost * BigInt(feeBps)) / 10000n;
  const total = baseCost + fee;
  return { baseCost, fee, total };
}

// Format address for display
export function formatAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

// Format number with commas
export function formatNumber(value: number | bigint): string {
  return value.toLocaleString();
}

// Format percentage
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// Convert basis points to percentage
export function bpsToPercent(bps: number): number {
  return bps / 100;
}

// Convert percentage to basis points
export function percentToBps(percent: number): number {
  return Math.round(percent * 100);
}

// Get IPFS URL from CID
export function getIpfsUrl(cid: string): string {
  if (!cid) return '';
  if (cid.startsWith('http')) return cid;
  if (cid.startsWith('ipfs://')) {
    return `${PLATFORM_CONFIG.ipfsGateway}${cid.replace('ipfs://', '')}`;
  }
  return `${PLATFORM_CONFIG.ipfsGateway}${cid}`;
}

// Parse IPFS metadata URL
export function parseIpfsUrl(url: string): string {
  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', '');
  }
  return url;
}

// Sleep utility for async operations
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Truncate text with ellipsis
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return `${text.slice(0, length)}...`;
}

// Check if value is positive bigint
export function isPositiveBigInt(value: unknown): value is bigint {
  return typeof value === 'bigint' && value > 0n;
}

// Parse error message from contract error
export function parseContractError(error: unknown): string {
  if (!error) return 'An unknown error occurred';

  const errorString = String(error);

  // Common contract errors
  const errorMappings: Record<string, string> = {
    BelowMinimumPurchase: 'Purchase amount is below the minimum required',
    InsufficientPayment: 'Insufficient payment amount',
    InsufficientPublicSupply: 'Not enough shares available for purchase',
    InvalidCarId: 'Invalid car ID',
    InvalidPrice: 'Invalid price specified',
    InvalidAmount: 'Invalid amount specified',
    PrimarySalesPausedError: 'Primary sales are currently paused',
    OnlyCarOwner: 'Only the car owner can perform this action',
    ListingNotActive: 'This listing is no longer active',
    OnlySeller: 'Only the seller can perform this action',
    ExistingActiveListing: 'You already have an active listing for this car',
    InsufficientListingAmount: 'Not enough shares available in this listing',
    'User rejected': 'Transaction was rejected',
    'user rejected': 'Transaction was rejected',
  };

  for (const [key, message] of Object.entries(errorMappings)) {
    if (errorString.includes(key)) {
      return message;
    }
  }

  // Try to extract revert reason
  const revertMatch = errorString.match(/revert(?:ed)?:?\s*(.+)/i);
  if (revertMatch) {
    return revertMatch[1].trim();
  }

  return 'Transaction failed. Please try again.';
}

// Generate random ID for keys
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Validate Ethereum address
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Format date
export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Format time ago
export function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return formatDate(timestamp);
}
