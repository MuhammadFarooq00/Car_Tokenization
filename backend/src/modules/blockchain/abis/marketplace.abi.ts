export const MARKETPLACE_ABI = [
  {
    type: 'event',
    name: 'ListingCreated',
    inputs: [
      { name: 'listingId', type: 'uint256', indexed: true },
      { name: 'seller', type: 'address', indexed: true },
      { name: 'carId', type: 'uint256', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'pricePerShare', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ListingFilled',
    inputs: [
      { name: 'listingId', type: 'uint256', indexed: true },
      { name: 'buyer', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'totalCost', type: 'uint256', indexed: false },
      { name: 'fee', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ListingCancelled',
    inputs: [
      { name: 'listingId', type: 'uint256', indexed: true },
      { name: 'remainingAmount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ListingClosed',
    inputs: [
      { name: 'listingId', type: 'uint256', indexed: true },
    ],
  },
  {
    type: 'function',
    name: 'getListing',
    inputs: [{ name: 'listingId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'seller', type: 'address' },
          { name: 'carId', type: 'uint256' },
          { name: 'amount', type: 'uint256' },
          { name: 'pricePerShare', type: 'uint256' },
          { name: 'active', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'nextListingId',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'calculateCost',
    inputs: [
      { name: 'listingId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [
      { name: 'totalCost', type: 'uint256' },
      { name: 'fee', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
] as const;
