import type { Address } from 'viem';

// Contract addresses - Update these after deployment
export const CONTRACT_ADDRESSES = {
  // Localhost/Hardhat
  31337: {
    carShares: '0x5FbDB2315678afecb367f032d93F642f64180aa3' as Address,
    marketplace: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' as Address,
  },
  // Hoodi Testnet - Chain ID 560048
  560048: {
    carShares: '0x40552E63259D54552BfeB9c89Bd93cB59dD5Fbf4' as Address,
    marketplace: '0x2ED8cfB0dc16f029ffbA4283EDa0439d43ABAd6D' as Address,
  },
} as const;

export type SupportedChainId = keyof typeof CONTRACT_ADDRESSES;

export function getContractAddresses(chainId: number) {
  const addresses = CONTRACT_ADDRESSES[chainId as SupportedChainId];
  if (!addresses) {
    throw new Error(`Chain ${chainId} is not supported`);
  }
  return addresses;
}
