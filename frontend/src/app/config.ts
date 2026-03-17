import { http, createConfig } from 'wagmi';
import { defineChain } from 'viem';
import { mainnet, sepolia, hardhat } from 'wagmi/chains';

// Reown Project ID (WalletConnect) - should be set via env var in production
export const REOWN_PROJECT_ID = import.meta.env.VITE_REOWN_PROJECT_ID || 'c393f03d1f1862474d10921e825246ca';

// Define Hoodi testnet chain
export const hoodi = defineChain({
  id: 560048,
  name: 'Hoodi',
  nativeCurrency: {
    name: 'Hoodi Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.hoodi.ethpandaops.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Hoodi Explorer',
      url: 'https://explorer.hoodi.ethpandaops.io',
    },
  },
  testnet: true,
});

// Platform configuration
export const PLATFORM_CONFIG = {
  name: 'Car Tokenization',
  description: 'Own a piece of premium vehicles through tokenized shares',
  platformFeeBps: 250, // 2.5%
  ipfsGateway: 'https://gateway.pinata.cloud/ipfs/',
};

// Wagmi configuration
export const wagmiConfig = createConfig({
  chains: [mainnet, sepolia, hardhat, hoodi],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [hardhat.id]: http('http://127.0.0.1:8545'),
    [hoodi.id]: http('https://rpc.hoodi.ethpandaops.io'),
  },
});

// Supported chains for the app
export const supportedChains = [mainnet, sepolia, hardhat, hoodi] as const;

// Default chain
export const defaultChain = hoodi;

// Metadata for Reown AppKit
export const appKitMetadata = {
  name: PLATFORM_CONFIG.name,
  description: PLATFORM_CONFIG.description,
  url: typeof window !== 'undefined' ? window.location.origin : 'https://cartokenization.app',
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
};
