# CarShares Platform — Complete Application Flow

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React 19)                      │
│  Vite 7 · TypeScript 5.9 · Tailwind CSS v4 · Wagmi v3      │
│  TanStack Query v5 · Reown AppKit (WalletConnect)           │
├─────────────────────────────────────────────────────────────┤
│                     BACKEND (NestJS)                         │
│  Prisma ORM · PostgreSQL · JWT Auth · SIWE Wallet Auth      │
│  Rate Limiting (ThrottlerGuard) · class-validator DTOs       │
├─────────────────────────────────────────────────────────────┤
│                  BLOCKCHAIN (Ethereum)                        │
│  CarShares (ERC-1155) · Marketplace · Hoodi Testnet (560048)│
└─────────────────────────────────────────────────────────────┘
```

## User Roles

| Role | Description | Can Do |
|------|-------------|--------|
| **investor** | Buys/sells car shares | Browse cars, buy shares, trade on marketplace, view portfolio, claim dividends |
| **car_owner** | Tokenizes vehicles | Create cars, mint shares, monitor performance, distribute dividends |
| **driver** | Operates tokenized cars | Apply to drive, log rides, log expenses, earn commissions |
| **admin** | Platform administrator | Set fees, pause sales, withdraw fees, review KYC/applications/expenses, sync blockchain |

---

## Feature Flow (End-to-End)

### 1. Authentication Flow

```
User → /login or /signup
  ├── Email/Password Auth:
  │   POST /auth/signup  → { email, password, name, walletAddress? }
  │   POST /auth/login   → { email, password }
  │   Response: { accessToken, refreshToken, user }
  │
  ├── Wallet Auth (SIWE):
  │   POST /auth/wallet/nonce   → { walletAddress } → { nonce }
  │   POST /auth/wallet/verify  → { walletAddress, message, signature } → { accessToken, refreshToken, user }
  │
  ├── Token Refresh:
  │   POST /auth/refresh → { refreshToken } → { accessToken, refreshToken }
  │
  └── Logout:
      POST /auth/logout → clears session
```

**Frontend Flow:**
- `AuthContext` stores user + tokens in localStorage
- `api-client.ts` auto-attaches `Authorization: Bearer <token>` header
- `ProtectedRoute` component checks auth state, redirects to `/login` if unauthenticated
- `GuestOnlyRoute` redirects authenticated users to `/dashboard`

---

### 2. Car Creation & Tokenization Flow

```
Car Owner → /create
  │
  ├── Frontend: CreateCar form collects:
  │   make, model, year, vin, totalShares, pricePerShare, ownerReservedShares,
  │   minPurchase, description, image
  │
  ├── IPFS Upload:
  │   1. Upload image to Pinata → imageCID
  │   2. Create metadata JSON → upload to Pinata → metadataCID
  │
  ├── Smart Contract (CarShares.registerCar):
  │   registerCar(totalShares, pricePerShare, minPrimaryBuy, ownerReservedShares, metadataCID)
  │   → Emits CarRegistered(carId, owner, totalShares, pricePerShare)
  │   → Owner receives ownerReservedShares tokens
  │
  └── Backend Sync:
      POST /cars → { make, model, year, vin, tokenId, totalShares, pricePerShare, metadataCID }
      → Creates Car record with status: 'pending_approval'
      → Admin reviews → status: 'active'
```

**Contract State:**
- `carConfigs[carId]` stores: owner, totalSupply, remainingPublicSupply, pricePerShare, minPrimaryBuy, metadataCID, primarySaleActive, sharesSold
- Owner balance: `balanceOf(owner, carId)` = ownerReservedShares

---

### 3. Primary Share Purchase Flow

```
Investor → /car/:carId
  │
  ├── Frontend reads:
  │   Contract: useCarConfig(carId) → { totalSupply, remainingPublicSupply, pricePerShare, ... }
  │   Contract: useCarShares ABI → CarShares.carConfigs(carId)
  │   API: GET /cars/:id → car details (make, model, year, image)
  │   IPFS: useCarMetadata(metadataCID) → { name, description, image, attributes }
  │
  ├── User enters amount, clicks "Buy Shares":
  │   Contract: CarShares.buyShares(carId, amount) {value: totalCost}
  │   totalCost = amount * pricePerShare + platformFee
  │   platformFee = (amount * pricePerShare) * globalFeeBps / 10000
  │
  ├── On-chain effects:
  │   → Investor receives ERC-1155 tokens (carId, amount)
  │   → Car owner receives (payment - fee) via transfer
  │   → Platform accumulates fee
  │   → Emits SharesPurchased(buyer, carId, amount, totalCost)
  │
  └── Backend records:
      Transaction { carId, userId, type: 'primary_purchase', amount, price, txHash }
```

---

### 4. Marketplace (Secondary Trading) Flow

```
Seller → /sell/:carId
  │
  ├── Create Listing:
  │   1. Approve Marketplace: CarShares.setApprovalForAll(marketplaceAddress, true)
  │   2. Create listing: Marketplace.createListing(carId, amount, pricePerShare)
  │   → Transfers shares to Marketplace contract (escrow)
  │   → Emits ListingCreated(listingId, seller, carId, amount, pricePerShare)
  │
Buyer → /listing/:listingId
  │
  ├── Buy from Listing:
  │   Marketplace.buyFromListing(listingId, amount) {value: totalCost}
  │   totalCost = amount * pricePerShare + marketplaceFee
  │   → Shares transferred from escrow to buyer
  │   → ETH sent to seller (minus fee)
  │   → Emits SharesSold(listingId, buyer, amount)
  │
  ├── Cancel Listing (seller only):
  │   Marketplace.cancelListing(listingId)
  │   → Returns escrowed shares to seller
  │   → Emits ListingCancelled(listingId)
  │
  └── Backend records:
      Transaction { type: 'listing_created' | 'listing_filled' | 'listing_cancelled' }
```

**Key Marketplace Hooks:**
- `useListing(id)` — reads listing from contract
- `useCalculateCost(listingId, amount)` — returns [baseCost, fee, totalRequired]
- `useBuyFromListing(listingId, amount, totalRequired)` — executes purchase
- `useCreateListing(carId, amount, price)` — creates listing
- `useCancelListing(listingId)` — cancels listing

---

### 5. Portfolio & Dividends Flow

```
Investor → /portfolio
  │
  ├── API: GET /portfolio/summary
  │   → { totalValue, totalDividends, totalCarsInvested, holdings[], recentTransactions[] }
  │
  ├── Each holding shows:
  │   - Car info (name, image from IPFS)
  │   - Number of shares owned
  │   - Current value (shares × pricePerShare)
  │   - Ownership percentage
  │
  └── Dividends:
      - Backend tracks dividends per investor per car
      - dividends accumulated from ride earnings distribution
      - Investor Dashboard shows "Pending Dividends" & "Claim Now" button
```

---

### 6. Driver Application & Operations Flow

```
User → /driver/apply
  │
  ├── Apply to be a driver:
  │   POST /drivers/apply → { licenseNumber, vehicleType, experience, ... }
  │   → Creates DriverApplication with status: 'pending'
  │   → Admin reviews at /admin/driver-approvals
  │   → On approval: user.roles gets 'driver' added
  │   → Notification sent to user
  │
Driver → /driver/log-ride
  │
  ├── Log a ride:
  │   POST /drivers/rides → { carId, pickup, dropoff, distance, earnings, timestamp }
  │   → Backend calculates:
  │     grossEarnings, commission (platform %), netEarnings
  │   → Records Ride entry
  │
Driver → /driver/log-expense
  │
  ├── Log an expense:
  │   POST /drivers/expenses → { carId, type, amount, description, receiptUrl? }
  │   → Creates Expense with status: 'pending'
  │   → Admin reviews at /admin → approves/rejects
  │   → Notification sent to driver
```

---

### 7. Earnings Flow

```
User → /earnings
  │
  ├── API: GET /earnings
  │   → { totalEarnings, thisMonth, lastMonth, pendingPayout, nextPayoutDate, byRole }
  │
  ├── Investor earnings:
  │   - Dividends from car ownership (proportional to shares)
  │   - Capital gains from marketplace trades
  │
  ├── Car Owner earnings:
  │   - Revenue from share sales (primary sale proceeds)
  │   - Ride revenue share from drivers
  │
  └── Driver earnings:
      - Net earnings from rides (gross - commission)
      - Displayed in ride-by-ride table
```

---

### 8. Admin Operations Flow

```
Admin → /admin
  │
  ├── Platform Controls (on-chain):
  │   useSetGlobalFee(bps) → CarShares.setGlobalFeeBps(newFee)
  │   usePausePrimarySales(paused) → CarShares.pausePrimarySales() / unpause
  │   useWithdrawFees() → CarShares.withdrawFees() → sends accumulated fees to owner
  │   useAccumulatedFees() → reads contract balance
  │
  ├── Review Workflows (API):
  │   GET  /admin/kyc-pending → list KYC submissions
  │   POST /admin/kyc/:id/review → { status: 'approved'|'rejected', reason? }
  │   → Sends notification to user
  │
  │   GET  /admin/applications-pending → list driver applications
  │   POST /admin/applications/:id/review → { status: 'approved'|'rejected', reason? }
  │   → If approved: adds 'driver' role to user
  │   → Sends notification to user
  │
  │   GET  /admin/expenses-pending → list expense claims
  │   POST /admin/expenses/:id/review → { status: 'approved'|'rejected', reason? }
  │   → Sends notification to submitter
  │
  ├── Analytics:
  │   GET /admin/analytics → { totalUsers, totalCars, totalTransactions, totalVolume }
  │
  └── Blockchain Sync:
      POST /admin/sync → triggers re-sync of on-chain events to DB
```

---

### 9. Notifications Flow

```
Backend → NotificationsService
  │
  ├── Created automatically when:
  │   - KYC reviewed (approved/rejected)
  │   - Driver application reviewed
  │   - Expense reviewed
  │   - Share purchase confirmed
  │   - Dividend distributed
  │
  ├── API Endpoints:
  │   GET  /notifications?page=1&limit=20 → paginated notifications
  │   GET  /notifications/unread-count → { count }
  │   POST /notifications/mark-read → marks all as read
  │   POST /notifications/:id/read → marks single as read
  │
  └── Frontend:
      - useUnreadCount() polls every 30s
      - NotificationBell in header shows badge with unread count
      - Click opens notification panel
      - useMarkOneRead() / useMarkAllRead() mutations
```

---

## Data Flow Diagram

```
 ┌──────────┐    wagmi/viem     ┌───────────────┐
 │ Frontend │ ◄──────────────► │ Smart Contracts│
 │ (React)  │                  │ (Ethereum)     │
 │          │    REST API       │                │
 │          │ ◄──────────────► ├───────────────┤
 └──────────┘                  │ Backend (Nest) │
                               │                │
                               │  ┌──────────┐  │
                               │  │ Prisma   │  │
                               │  │ (PG DB)  │  │
                               │  └──────────┘  │
                               └───────────────┘
```

**Read paths:**
- Car config (totalSupply, price) → Smart Contract (always fresh & trustless)
- Car metadata (name, image) → IPFS via Pinata gateway
- Car details (make, model, year) → Backend API → PostgreSQL
- User data, transactions, earnings → Backend API → PostgreSQL

**Write paths:**
- Buy shares, create listings → Smart Contract tx → Backend syncs event
- Create car, log ride, submit KYC → Backend API → PostgreSQL
- Register car on-chain → Smart Contract tx → Backend records

---

## API Endpoints Summary (44 total)

| Group | Endpoint | Method | Auth | Description |
|-------|----------|--------|------|-------------|
| Auth | `/auth/signup` | POST | No | Register new user |
| Auth | `/auth/login` | POST | No | Email/password login |
| Auth | `/auth/refresh` | POST | No | Refresh access token |
| Auth | `/auth/logout` | POST | Yes | Logout / clear session |
| Auth | `/auth/wallet/nonce` | POST | No | Request SIWE nonce |
| Auth | `/auth/wallet/verify` | POST | No | Verify SIWE signature |
| Users | `/users/me` | GET | Yes | Current user profile |
| Users | `/users/me` | PUT | Yes | Update profile |
| Users | `/users/me/kyc` | POST | Yes | Submit KYC documents |
| Users | `/users/me/kyc/status` | GET | Yes | Check KYC status |
| Cars | `/cars` | GET | No | List all cars |
| Cars | `/cars/:id` | GET | No | Car details |
| Cars | `/cars` | POST | Yes (owner/admin) | Create car |
| Cars | `/cars/:id` | PUT | Yes | Update car |
| Cars | `/cars/:id/status` | PUT | Yes | Update car status |
| Cars | `/cars/:id/stats` | GET | No | Car statistics |
| Cars | `/cars/owner/me` | GET | Yes | My owned cars |
| Marketplace | `/marketplace/listings` | GET | No | All listings |
| Marketplace | `/marketplace/listings/:id` | GET | No | Listing details |
| Marketplace | `/marketplace/fee` | GET | No | Platform fee |
| Marketplace | `/marketplace/my-trades` | GET | Yes | My trades |
| Marketplace | `/marketplace/car/:carId/trades` | GET | No | Car trade history |
| Portfolio | `/portfolio/summary` | GET | Yes | Portfolio summary |
| Portfolio | `/portfolio/holdings` | GET | Yes | All holdings |
| Portfolio | `/portfolio/car/:carId` | GET | Yes | Single car holding |
| Portfolio | `/portfolio/dividends` | GET | Yes | Dividend history |
| Earnings | `/earnings` | GET | Yes | Earnings summary |
| Earnings | `/earnings/breakdown` | GET | Yes | Earnings breakdown |
| Drivers | `/drivers/apply` | POST | Yes | Apply to drive |
| Drivers | `/drivers/profile` | GET | Yes (driver) | Driver profile |
| Drivers | `/drivers/rides` | GET | Yes (driver) | List rides |
| Drivers | `/drivers/rides` | POST | Yes (driver) | Log ride |
| Drivers | `/drivers/expenses` | GET | Yes (driver) | List expenses |
| Drivers | `/drivers/expenses` | POST | Yes (driver) | Log expense |
| Notifications | `/notifications` | GET | Yes | List notifications |
| Notifications | `/notifications/unread-count` | GET | Yes | Unread count |
| Notifications | `/notifications/mark-read` | POST | Yes | Mark all read |
| Notifications | `/notifications/:id/read` | POST | Yes | Mark one read |
| Admin | `/admin/analytics` | GET | Yes (admin) | Platform analytics |
| Admin | `/admin/users` | GET | Yes (admin) | List users |
| Admin | `/admin/kyc-pending` | GET | Yes (admin) | Pending KYC |
| Admin | `/admin/kyc/:id/review` | POST | Yes (admin) | Review KYC |
| Admin | `/admin/applications-pending` | GET | Yes (admin) | Pending applications |
| Admin | `/admin/applications/:id/review` | POST | Yes (admin) | Review application |
| Admin | `/admin/expenses-pending` | GET | Yes (admin) | Pending expenses |
| Admin | `/admin/expenses/:id/review` | POST | Yes (admin) | Review expense |
| Admin | `/admin/sync` | POST | Yes (admin) | Sync blockchain |

---

## Frontend Route Map (25 routes)

| Route | Component | Auth | Role |
|-------|-----------|------|------|
| `/` | Home | No | — |
| `/login` | Login | Guest only | — |
| `/signup` | Signup | Guest only | — |
| `/discover` | Discover | No | — |
| `/car/:carId` | CarDetail | No | — |
| `/marketplace` | Marketplace | No | — |
| `/listing/:listingId` | ListingDetail | No | — |
| `/portfolio` | Portfolio | No | — |
| `/leaderboard` | Leaderboard | No | — |
| `/create` | CreateCar | Yes | car_owner, admin |
| `/sell/:carId` | SellShares | Yes | — |
| `/dashboard` | Dashboard | Yes | — |
| `/profile` | Profile | Yes | — |
| `/earnings` | Earnings | Yes | — |
| `/admin` | Admin | Yes | admin |
| `/admin/driver-approvals` | DriverApprovals | Yes | admin |
| `/admin/kyc` | KYCManagement | Yes | admin |
| `/admin/analytics` | AdminAnalytics | Yes | admin |
| `/driver/apply` | DriverApply | Yes | — |
| `/driver/log-ride` | LogRide | Yes | driver |
| `/driver/log-expense` | LogExpense | Yes | driver |
| `/owner/monitoring` | CarMonitoring | Yes | car_owner, admin |
| `/owner/monitoring/:carId` | CarMonitoring | Yes | car_owner, admin |
| `/investor/analytics` | InvestorAnalytics | Yes | investor |
| `*` | NotFound | No | — |

---

## Smart Contract Addresses (Hoodi Testnet — Chain ID 560048)

| Contract | Address |
|----------|---------|
| CarShares (ERC-1155) | `0x1d02bb94857b23aA30EBF1eeA703650dbCb7276A` |
| Marketplace | `0xC767915cDF8cB5dF72aD46C3F8B8fE56F6001B91` |

---

## Key Technical Decisions

1. **ERC-1155 for car shares** — Each carId is a token ID with fungible shares
2. **Dual auth** — Email/password for Web2 users + SIWE for Web3 wallet users
3. **IPFS for metadata** — Car images/details stored on IPFS via Pinata
4. **TanStack Query** — Centralized cache with `queryKeys` factory for consistency
5. **Wagmi v3** — Type-safe contract interactions with hooks
6. **Marketplace escrow** — Shares held by contract during listing (trustless)
7. **Platform fee via BPS** — Configurable fee in basis points (250 = 2.5%)
8. **Prisma with PostgreSQL** — Type-safe ORM with indexed foreign keys
9. **Global rate limiting** — ThrottlerGuard protects all endpoints
10. **ErrorBoundary** — Global React error boundary catches render crashes
