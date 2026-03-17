# Car Co-Ownership Smart Contracts

Production-grade Solidity contracts for blockchain-based car co-ownership and trading on Ethereum mainnet.

## 📋 Overview

This system enables fractional car ownership through tokenization:
- **CarShares**: ERC-1155 contract managing car tokens and primary sales
- **Marketplace**: P2P secondary market for trading shares

## 🏗️ Architecture

### CarShares Contract
- **Standard**: ERC-1155 (OpenZeppelin)
- **Token Model**: 1 tokenId = 1 car, fungible shares per car
- **Features**:
  - Car creation with configurable supply splits
  - Primary sale mechanism with minimum buy requirements
  - Dynamic pricing (adjustable by car owner before sellout)
  - Platform fee collection
  - Metadata management (IPFS)
  - Unsold share withdrawal

### Marketplace Contract
- **Model**: Fixed-price P2P listings
- **Features**:
  - One active listing per user per car
  - Partial fill support
  - No minimum buy on secondary market
  - Automatic fee distribution
  - Instant cancellation with no penalty

## 🔐 Security Features

- ✅ ReentrancyGuard on all external state-changing functions
- ✅ Checks-Effects-Interactions pattern
- ✅ SafeERC1155 transfers
- ✅ Explicit custom errors for gas efficiency
- ✅ Immutable constructor parameters where applicable
- ✅ No upgradeability (immutable contracts)
- ✅ Access control with Ownable
- ✅ Input validation on all functions

## 📊 Fee Structure

- **Global Platform Fee**: Default 2.5% (250 basis points), max 10%
- **Applied To**: 
  - Primary sales (buyer pays)
  - Secondary market trades (buyer pays)
- **Fee Recipient**: Contract owner/admin

## 🚀 Deployment

### Prerequisites
```bash
npm install @openzeppelin/contracts@5.0.0
```

### Deployment Order

1. **Deploy CarShares**
   ```solidity
   CarShares carShares = new CarShares();
   ```

2. **Deploy Marketplace**
   ```solidity
   Marketplace marketplace = new Marketplace(address(carShares));
   ```

3. **Set Approval** (Users must approve marketplace)
   ```solidity
   carShares.setApprovalForAll(address(marketplace), true);
   ```

## 📖 Usage Examples

### Creating a Car

```solidity
// Create a car with 10,000 shares
// 30% (3,000 shares) for public sale
// 70% (7,000 shares) to owner
// Price: 0.01 ETH per share
// Min buy: 10 shares
uint256 carId = carShares.createCar(
    10000,                          // totalSupply
    3000,                           // publicRatioBps (30%)
    0.01 ether,                     // pricePerShare
    10,                             // minPrimaryBuy
    "QmX...abc123"                  // IPFS CID
);
```

### Primary Purchase

```solidity
// Buy 100 shares from primary sale
// Cost = (100 * 0.01 ETH) + 2.5% fee = 1.025 ETH
carShares.buyPrimary{value: 1.025 ether}(carId, 100);
```

### Updating Price (Car Owner Only)

```solidity
// Update price before sellout
carShares.updatePrice(carId, 0.015 ether);
```

### Withdrawing Unsold Shares (Car Owner Only)

```solidity
// Withdraw remaining public supply
carShares.withdrawPublicSupply(carId);
```

### Creating a Marketplace Listing

```solidity
// Approve marketplace first (one-time)
carShares.setApprovalForAll(address(marketplace), true);

// List 50 shares at 0.02 ETH each
uint256 listingId = marketplace.createListing(
    carId,           // carId
    50,              // amount
    0.02 ether       // pricePerShare
);
```

### Buying from Marketplace

```solidity
// Buy 20 shares from listing
// Cost = (20 * 0.02 ETH) + 2.5% fee = 0.41 ETH
marketplace.buyFromListing{value: 0.41 ether}(listingId, 20);
```

### Cancelling a Listing

```solidity
// Cancel and reclaim unsold shares
marketplace.cancelListing(listingId);
```

## 🔧 Admin Functions

### CarShares Admin

```solidity
// Pause/unpause primary sales
carShares.pausePrimarySales(true);

// Update platform fee (max 10%)
carShares.setGlobalFee(300); // 3%

// Withdraw accumulated fees
carShares.withdrawFees();
```

## 📐 Contract Specifications

### CarShares.sol

**State Variables:**
- `nextCarId`: Counter for car IDs
- `globalFeeBps`: Platform fee in basis points
- `primarySalesPaused`: Global pause state
- `accumulatedFees`: Total fees collected
- `cars`: Mapping of car configurations

**Key Functions:**
- `createCar()`: Create new tokenized car
- `buyPrimary()`: Purchase from primary sale
- `updatePrice()`: Update primary sale price
- `updateMetadata()`: Update IPFS metadata
- `withdrawPublicSupply()`: Reclaim unsold shares
- `pausePrimarySales()`: Admin pause
- `setGlobalFee()`: Admin fee update
- `withdrawFees()`: Admin fee withdrawal

**Events:**
- `CarCreated`
- `PrimaryPurchase`
- `PriceUpdated`
- `MetadataUpdated`
- `PublicSupplyWithdrawn`
- `GlobalFeeUpdated`
- `PrimarySalesPaused`
- `FeesWithdrawn`

### Marketplace.sol

**State Variables:**
- `carShares`: Immutable reference to CarShares contract
- `nextListingId`: Counter for listings
- `listings`: Mapping of listing details
- `activeListings`: Per-user per-car active listing tracker

**Key Functions:**
- `createListing()`: List shares for sale
- `buyFromListing()`: Purchase from listing (partial fills supported)
- `cancelListing()`: Cancel active listing
- `calculateCost()`: View function for cost calculation

**Events:**
- `ListingCreated`
- `ListingFilled`
- `ListingClosed`
- `ListingCancelled`

## 🧪 Testing Checklist

- [ ] Car creation with various supply splits
- [ ] Primary purchase with exact/over payment
- [ ] Primary purchase below minimum (should fail)
- [ ] Price updates before/after sellout
- [ ] Unsold share withdrawal
- [ ] Marketplace listing creation
- [ ] Partial fills on marketplace
- [ ] Full fills closing listings
- [ ] Listing cancellation
- [ ] Fee calculations and distributions
- [ ] Reentrancy protection
- [ ] Access control enforcement
- [ ] Pause functionality
- [ ] Edge cases (zero amounts, invalid IDs, etc.)

## ⚠️ Important Notes

1. **Immutability**: Contracts cannot be upgraded. Deploy carefully.
2. **Fees**: Buyers pay fees on top of share prices.
3. **One Listing**: Users can only have one active listing per car.
4. **No Minimums on Secondary**: Marketplace has no minimum buy requirement.
5. **Metadata**: IPFS CIDs are mutable by car owners only.
6. **Primary Sale**: Owner can update price until public supply sells out.
7. **Marketplace Cannot Be Paused**: Only primary sales can be paused.

## 📄 License

MIT

## 🔗 Dependencies

- OpenZeppelin Contracts v5.0.0+
- Solidity ^0.8.20

## 💡 Integration Notes

**Off-Chain Revenue Distribution:**
- Read on-chain balances: `carShares.balanceOf(user, carId)`
- Calculate ownership percentage
- Distribute revenue proportionally off-chain

**Metadata Structure (IPFS):**
```json
{
  "name": "2023 Tesla Model S",
  "description": "Premium electric sedan",
  "image": "ipfs://Qm...",
  "attributes": [
    {"trait_type": "Make", "value": "Tesla"},
    {"trait_type": "Model", "value": "Model S"},
    {"trait_type": "Year", "value": "2023"}
  ]
}
```

## 🔍 Gas Optimization

- Tight variable packing in structs
- Custom errors instead of strings
- Batch operations where possible
- Minimal storage reads/writes
- Immutable variables for references

## 📞 Support

For issues or questions, refer to:
- OpenZeppelin documentation: https://docs.openzeppelin.com
- Solidity documentation: https://docs.soliditylang.org
