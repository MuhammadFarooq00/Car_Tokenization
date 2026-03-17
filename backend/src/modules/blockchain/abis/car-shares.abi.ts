export const CAR_SHARES_ABI = [
  {
    type: 'event',
    name: 'CarCreated',
    inputs: [
      { name: 'carId', type: 'uint256', indexed: true },
      { name: 'owner', type: 'address', indexed: true },
      { name: 'totalSupply', type: 'uint256', indexed: false },
      { name: 'publicSupply', type: 'uint256', indexed: false },
      { name: 'pricePerShare', type: 'uint256', indexed: false },
      { name: 'minPrimaryBuy', type: 'uint256', indexed: false },
      { name: 'metadataCID', type: 'string', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'PrimaryPurchase',
    inputs: [
      { name: 'carId', type: 'uint256', indexed: true },
      { name: 'buyer', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'totalCost', type: 'uint256', indexed: false },
      { name: 'fee', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'MetadataUpdated',
    inputs: [
      { name: 'carId', type: 'uint256', indexed: true },
      { name: 'newMetadataCID', type: 'string', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'PriceUpdated',
    inputs: [
      { name: 'carId', type: 'uint256', indexed: true },
      { name: 'oldPrice', type: 'uint256', indexed: false },
      { name: 'newPrice', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'TransferSingle',
    inputs: [
      { name: 'operator', type: 'address', indexed: true },
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'id', type: 'uint256', indexed: false },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'function',
    name: 'getCarConfig',
    inputs: [{ name: 'carId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'owner', type: 'address' },
          { name: 'totalSupply', type: 'uint256' },
          { name: 'publicSupply', type: 'uint256' },
          { name: 'publicSold', type: 'uint256' },
          { name: 'pricePerShare', type: 'uint256' },
          { name: 'minPrimaryBuy', type: 'uint256' },
          { name: 'metadataCID', type: 'string' },
          { name: 'exists', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'nextCarId',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'id', type: 'uint256' },
    ],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'globalFeeBps',
    inputs: [],
    outputs: [{ type: 'uint96' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'accumulatedFees',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;
