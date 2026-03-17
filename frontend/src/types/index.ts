import type { Address } from 'viem';

// Car configuration from smart contract
export interface CarConfig {
  owner: Address;
  totalSupply: bigint;
  remainingPublicSupply: bigint;
  pricePerShare: bigint;
  minPrimaryBuy: bigint;
  metadataCID: string;
  primarySaleActive: boolean;
  sharesSold: bigint;
}

// Marketplace listing from smart contract
export interface Listing {
  seller: Address;
  carId: bigint;
  amount: bigint;
  pricePerShare: bigint;
  active: boolean;
}

// Car metadata stored on IPFS
export interface CarMetadata {
  name: string;
  description: string;
  image: string;
  attributes: CarAttribute[];
  external_url?: string;
}

export interface CarAttribute {
  trait_type: string;
  value: string | number;
}

// Extended car data combining on-chain and IPFS data
export interface Car {
  id: bigint;
  config: CarConfig;
  metadata?: CarMetadata;
}

// Extended listing data with car info
export interface ListingWithCar {
  id: bigint;
  listing: Listing;
  car?: Car;
}

// User portfolio holding
export interface Holding {
  carId: bigint;
  balance: bigint;
  car?: Car;
}

// Transaction history types
export type TransactionType =
  | 'primary_purchase'
  | 'listing_created'
  | 'listing_filled'
  | 'listing_cancelled';

export interface Transaction {
  type: TransactionType;
  carId: bigint;
  amount: bigint;
  price: bigint;
  timestamp: number;
  txHash: string;
}

// Form types
export interface CreateCarFormData {
  name: string;
  description: string;
  image: File | null;
  make: string;
  model: string;
  year: number;
  vin: string;
  mileage: number;
  color: string;
  totalSupply: number;
  publicRatioBps: number;
  pricePerShare: string;
  minPrimaryBuy: number;
}

export interface SellSharesFormData {
  carId: bigint;
  amount: number;
  pricePerShare: string;
}

// API response types
export interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

// Error types
export interface ContractError {
  name: string;
  message: string;
}
