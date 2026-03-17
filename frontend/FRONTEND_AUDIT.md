# Frontend Comprehensive Audit Report

**Project:** CarShares — Car Tokenization Platform  
**Stack:** React 19.2 · Vite 7.2 · TypeScript 5.9 · Tailwind CSS 4 · wagmi 3.4 · TanStack Query 5.90  
**Date:** 2025-07-24  

---

## 1. All Pages & Routes

### Route → Component Mapping

| Route | Component | Guard | Notes |
|---|---|---|---|
| `/` | `Home` | Public | Landing page with hero, features, car carousel |
| `/login` | `Login` | GuestOnlyRoute | No `<Layout>` wrapper |
| `/signup` | `Signup` | GuestOnlyRoute | No `<Layout>` wrapper |
| `/discover` | `Discover` | Public | Car browsing with client-side filtering |
| `/car/:carId` | `CarDetail` | Public | Dual-mode: on-chain → API fallback |
| `/marketplace` | `Marketplace` | Public | Secondary market listings |
| `/listing/:listingId` | `ListingDetail` | Public | Listing detail + purchase flow |
| `/portfolio` | `Portfolio` | Public (⚠) | Should be ProtectedRoute but is not |
| `/leaderboard` | `Leaderboard` | Public | Uses admin API endpoints |
| `/create` | `CreateCar` | ProtectedRoute `[car_owner, admin]` | IPFS upload → on-chain tx → DB sync |
| `/sell/:carId` | `SellShares` | Public (⚠) | Should be ProtectedRoute but is not |
| `/dashboard` | `Dashboard` | ProtectedRoute | Multi-role hub → sub-dashboards |
| `/profile` | `Profile` | ProtectedRoute | Profile edit, wallet, roles, KYC |
| `/earnings` | `Earnings` | ProtectedRoute | Multi-role earnings view |
| `/admin` | `Admin` | ProtectedRoute `[admin]` | Platform controls (fees, pause, withdraw) |
| `/admin/driver-approvals` | `DriverApprovals` | ProtectedRoute `[admin]` | Approve/reject driver applications |
| `/admin/kyc` | `KYCManagement` | ProtectedRoute `[admin]` | KYC document review |
| `/admin/analytics` | `AdminAnalytics` | ProtectedRoute `[admin]` | Platform charts (placeholder) |
| `/driver/apply` | `DriverApply` | ProtectedRoute (any role) | 4-step application wizard |
| `/driver/log-ride` | `LogRide` | ProtectedRoute `[driver]` | Log ride earnings |
| `/driver/log-expense` | `LogExpense` | ProtectedRoute `[driver]` | Log vehicle expenses |
| `/owner/monitoring` | `CarMonitoring` | ProtectedRoute `[car_owner, admin]` | Fleet overview |
| `/owner/monitoring/:carId` | `CarMonitoring` | ProtectedRoute `[car_owner, admin]` | Single car detail (same component) |
| `/investor/analytics` | `InvestorAnalytics` | ProtectedRoute `[investor]` | Portfolio analytics |
| `*` | `NotFound` | — | 404 catch-all |

**Total routes: 26** (including 2 auth routes outside Layout)

### Dashboard Sub-Components (rendered inside `/dashboard`)

| Component | File | Rendered For |
|---|---|---|
| `InvestorDashboard` | `Dashboard/InvestorDashboard.tsx` | Users with `investor` role |
| `OwnerDashboard` | `Dashboard/OwnerDashboard.tsx` | Users with `car_owner` role |
| `DriverDashboard` | `Dashboard/DriverDashboard.tsx` | Users with `driver` role |

### Pages Exported from `pages/index.ts`
`Home`, `Discover`, `CarDetail`, `Marketplace`, `ListingDetail`, `Portfolio`, `CreateCar`, `SellShares`, `Admin`

**Missing from barrel export (imported directly in router):** `Login`, `Signup`, `Dashboard`, `Profile`, `NotFound`, `ErrorPage`, `DriverApprovals`, `KYCManagement`, `AdminAnalytics`, `DriverApply`, `LogRide`, `LogExpense`, `CarMonitoring`, `InvestorAnalytics`, `Leaderboard`, `Earnings`

---

## 2. API Hooks — Complete Inventory

All API hooks use TanStack Query and call the custom fetch client at `src/lib/api-client.ts`.

### `useCarsApi.ts`
| Hook | Type | Endpoint | Query Key |
|---|---|---|---|
| `useCars(params?)` | Query | `GET /cars` | `['cars', params]` |
| `useCar(id)` | Query | `GET /cars/:id` | `['cars', id]` |
| `useMyOwnedCars()` | Query | `GET /cars/my/owned` | `['cars', 'my-owned']` |
| `useCarStats(id)` | Query | `GET /cars/:id/stats` | `['cars', id, 'stats']` |
| `useCreateCarApi()` | Mutation | `POST /cars` | Invalidates `['cars']` |

### `useMarketplaceApi.ts`
| Hook | Type | Endpoint | Query Key |
|---|---|---|---|
| `useMarketplaceListings(params?)` | Query | `GET /marketplace/listings` | `['marketplace', 'listings', params]` |
| `useMarketplaceListing(id)` | Query | `GET /marketplace/listings/:id` | `['marketplace', 'listings', id]` |
| `useMarketplaceCost(listingId, amount)` | Query | `GET /marketplace/listings/:id/cost?amount=` | `['marketplace', 'cost', id, amount]` |
| `useMyTradeHistory()` | Query | `GET /marketplace/my/trades` | `['marketplace', 'my-trades']` |

### `usePortfolioApi.ts`
| Hook | Type | Endpoint | Query Key |
|---|---|---|---|
| `usePortfolioSummary()` | Query | `GET /portfolio/summary` | `['portfolio', 'summary']` |
| `usePortfolioHoldings()` | Query | `GET /portfolio/holdings` | `['portfolio', 'holdings']` |
| `useCarHolding(carId)` | Query | `GET /portfolio/holdings/:carId` | `['portfolio', 'holdings', carId]` |
| `usePortfolioDividends()` | Query | `GET /portfolio/dividends` | `['portfolio', 'dividends']` |

### `useDriverApi.ts`
| Hook | Type | Endpoint | Query Key |
|---|---|---|---|
| `useDriverProfile()` | Query | `GET /drivers/profile` | `['driver', 'profile']` |
| `useDriverRides(params)` | Query | `GET /drivers/rides` | `['driver', 'rides', params]` |
| `useDriverExpenses(params)` | Query | `GET /drivers/expenses` | `['driver', 'expenses', params]` |
| `useApplyAsDriver()` | Mutation | `POST /drivers/apply` | Invalidates `['driver']` |
| `useLogRide()` | Mutation | `POST /drivers/rides` | Invalidates `['driver', 'rides']` |
| `useSubmitExpense()` | Mutation | `POST /drivers/expenses` | Invalidates `['driver', 'expenses']` |

### `useAdminApi.ts`
| Hook | Type | Endpoint | Query Key |
|---|---|---|---|
| `useAdminUsers(params?)` | Query | `GET /admin/users` | `['admin', 'users', params]` |
| `useAdminPendingKYC(params?)` | Query | `GET /admin/kyc/pending` | `['admin', 'kyc', params]` |
| `useAdminPendingApplications(params?)` | Query | `GET /admin/drivers/pending` | `['admin', 'drivers', params]` |
| `useAdminPendingExpenses(params?)` | Query | `GET /admin/expenses/pending` | `['admin', 'expenses', params]` |
| `useAdminAnalytics()` | Query | `GET /admin/analytics` | `['admin', 'analytics']` |
| `useReviewKYC()` | Mutation | `PATCH /admin/kyc/:id` | Invalidates `['admin', 'kyc']` |
| `useReviewApplication()` | Mutation | `PATCH /admin/drivers/:id` | Invalidates `['admin', 'drivers']` |
| `useReviewExpense()` | Mutation | `PATCH /admin/expenses/:id` | Invalidates `['admin', 'expenses']` |

### `useEarningsApi.ts`
| Hook | Type | Endpoint | Query Key |
|---|---|---|---|
| `useEarningsSummary()` | Query | `GET /earnings/summary` | `['earnings', 'summary']` |
| `useEarningsBreakdown(params?)` | Query | `GET /earnings/breakdown` | `['earnings', 'breakdown', params]` |

### `useNotificationsApi.ts`
| Hook | Type | Endpoint | Query Key |
|---|---|---|---|
| `useNotifications(params?)` | Query | `GET /notifications` | `['notifications', params]` |
| `useUnreadCount()` | Query | `GET /notifications/unread-count` | `['notifications', 'unread']` (refetchInterval: 30s) |
| `useMarkAllRead()` | Mutation | `POST /notifications/mark-all-read` | Invalidates `['notifications']` |

### `useUsersApi.ts`
| Hook | Type | Endpoint | Query Key |
|---|---|---|---|
| `useUserProfile()` | Query | `GET /users/profile` | `['users', 'profile']` |
| `useKYCStatus()` | Query | `GET /users/kyc/status` | `['users', 'kyc']` |
| `useLinkWallet()` | Mutation | `POST /users/wallet/link` | Invalidates `['users']` |
| `useSubmitKYC()` | Mutation | `POST /users/kyc` | Invalidates `['users', 'kyc']` |

**Total: 33 API hooks** (21 queries + 12 mutations)

---

## 3. Contract Hooks — Complete Inventory

### `useCarShares.ts` (ERC-1155 CarShares contract)

**Read hooks (via `useReadContract`):**
| Hook | Solidity Function | Returns |
|---|---|---|
| `useNextCarId()` | `nextCarId()` | `bigint` — next auto-increment car ID |
| `useCarConfig(carId)` | `carConfigs(carId)` | `CarConfig` struct (owner, totalShares, sharePrice, metadataCID, saleActive) |
| `useBalanceOf(address, carId)` | `balanceOf(address, carId)` | `bigint` — share balance |
| `useSharesSold(carId)` | `sharesSold(carId)` | `bigint` — shares sold for a car |
| `useIsPlatformOwner(address)` | platform owner check | `boolean` |
| `useGlobalFeeBps()` | `globalFeeBps()` | `bigint` — fee in basis points |
| `usePrimarySalesPaused()` | `primarySalesPaused()` | `boolean` |
| `useAccumulatedFees()` | `accumulatedFees()` | `bigint` — wei fees available |

**Write hooks (via `useWriteContract`):**
| Hook | Solidity Function | Used By |
|---|---|---|
| `useBuyPrimary()` | `buyPrimary(carId, amount)` | CarDetail (primary purchase) |
| `useCreateCar()` | `createCar(totalShares, pricePerShare, metadataCID)` | CreateCar |
| `useSetGlobalFee()` | `setGlobalFeeBps(bps)` | Admin |
| `useTogglePrimarySalesPause()` | `togglePrimarySalesPause()` | Admin |
| `useWithdrawFees()` | `withdrawFees()` | Admin |

### `useMarketplace.ts` (Marketplace contract)

**Read hooks:**
| Hook | Solidity Function | Returns |
|---|---|---|
| `useListing(listingId)` | `listings(listingId)` | `Listing` struct |
| `useCalculateCost(listingId, amount)` | `calculateCost(listingId, amount)` | `[bigint, bigint]` — [baseCost, fee] |
| `useMyActiveListings(address)` | `getActiveListings()` + filter | Filtered `Listing[]` |
| `useNextListingId()` | `nextListingId()` | `bigint` |

**Write hooks:**
| Hook | Solidity Function | Used By |
|---|---|---|
| `useCreateListing()` | `createListing(carId, amount, pricePerShare)` | SellShares |
| `useBuyFromListing()` | `buyListing(listingId, amount)` | ListingDetail |
| `useCancelListing()` | `cancelListing(listingId)` | Portfolio |
| `useSetApprovalForAll()` | (CarShares) `setApprovalForAll(marketplace, true)` | SellShares |

**Total: 21 contract hooks** (12 read + 9 write)

---

## 4. Auth Flow

### Architecture
`AuthContext.tsx` provides all auth state + methods. Wraps the entire app via `Providers.tsx`.

### Bootstrap Sequence
1. On mount, checks `localStorage` for `auth_token`
2. If found, calls `GET /auth/profile` to validate and hydrate user
3. If 401, attempts refresh via `POST /auth/refresh` (httpOnly refresh token cookie)
4. Sets `isAuthenticated`, `user`, `token` state

### Login Flows
**Email/Password:**
1. `POST /auth/login` with `{ email, password }`
2. Response: `{ user, token }` — token stored in `localStorage`

**Wallet (SIWE):**
1. User connects wallet via Reown AppKit (WalletConnect)
2. Frontend calls `GET /auth/nonce?address=<address>` to get challenge nonce
3. Frontend constructs SIWE message and signs with wallet
4. Frontend sends `POST /auth/wallet-login` with `{ message, signature }`
5. Response: `{ user, token }`

### Signup
1. Collects name, email, password, roles (multi-select)
2. `POST /auth/signup` with `{ name, email, password, roles }`
3. Auto-login on success

### Role Management
- `addRole(role)` → `POST /auth/roles/add`
- `removeRole(role)` → `POST /auth/roles/remove`
- `switchActiveRole(role)` → local state only, no API call

### Token Refresh
- `api-client.ts` intercepts 401 responses
- Attempts `POST /auth/refresh` (uses httpOnly cookie)
- If refresh succeeds, retries original request with new token
- If refresh fails, clears auth state and redirects to login

### Route Protection
- `ProtectedRoute` checks `isAuthenticated` + optional `allowedRoles`
- `GuestOnlyRoute` redirects authenticated users to `/dashboard`
- Both show `LoadingState` spinner during auth bootstrap

---

## 5. Component Inventory

### Layout (`src/components/layout/`)
| Component | File | Description |
|---|---|---|
| `Layout` | `Layout.tsx` | Root `<Outlet>` wrapper with Header + Footer + ScrollToTop |
| `Header` | `Header.tsx` (486 lines) | Responsive nav, notifications dropdown, wallet connect, role badge |
| `Footer` | `Footer.tsx` | Site links (all `#` hrefs), newsletter (non-functional), social links |

### Auth (`src/components/auth/`)
| Component | File | Description |
|---|---|---|
| `ProtectedRoute` | `ProtectedRoute.tsx` | Auth + role guard, redirects to `/login` |
| `GuestOnlyRoute` | `ProtectedRoute.tsx` | Redirects authenticated users to `/dashboard` |
| `RoleSelector` | `RoleSelector.tsx` | Multi-role select with checkboxes + role descriptions |

### Car (`src/components/car/`)
| Component | File | Description |
|---|---|---|
| `CarCard` | `CarCard.tsx` | On-chain car display (reads contract + IPFS metadata) |
| `ApiCarCard` | `ApiCarCard.tsx` | Backend API car display (resolves IPFS image) |
| `CarCardSkeleton` | `CarCardSkeleton.tsx` | Loading placeholder |
| `CarGrid` | `CarGrid.tsx` | Grid of on-chain cars (iterates `nextCarId`) |

### Marketplace (`src/components/marketplace/`)
| Component | File | Description |
|---|---|---|
| `ListingCard` | `ListingCard.tsx` | Marketplace listing display |
| `ListingCardSkeleton` | `ListingCardSkeleton.tsx` | Loading placeholder |
| `ListingGrid` | `ListingGrid.tsx` | Grid of on-chain listings (iterates `nextListingId`) |

### Feedback (`src/components/feedback/`)
| Component | File | Description |
|---|---|---|
| `EmptyState` | `EmptyState.tsx` | Empty data placeholder with icon + message + action |
| `ErrorState` | `ErrorState.tsx` | Error display with retry button |
| `LoadingState` | `LoadingState.tsx` | Full-page spinner |

### Wallet (`src/components/wallet/`)
| Component | File | Description |
|---|---|---|
| `ConnectButton` | `ConnectButton.tsx` | Wallet connect via `useAppKit()` |
| `RequireWallet` | `RequireWallet.tsx` | Wrapper that shows connect prompt if no wallet |

### UI Primitives (`src/components/ui/`)
| Component | Exported from `index.ts` | Based On |
|---|---|---|
| `Button` | ✅ | Custom (cva variants) |
| `Card` | ✅ | Custom |
| `Input` | ✅ | Custom |
| `Label` | ✅ | Custom |
| `Badge` | ✅ | Custom (cva variants) |
| `Skeleton` | ✅ | Custom |
| `Separator` | ✅ | Custom |
| `Progress` | ✅ | Custom |
| `Tabs` | ✅ | Custom |
| `Dialog` | ✅ | Radix UI |
| `Select` | ✅ | Radix UI |
| `Toast` | ❌ Not exported | Used via ToastContext |
| `Spinner` | ❌ Not exported | — |
| `Textarea` | ❌ Not exported | — |
| `Icon` | ❌ Not exported | — |
| `DecorativeCardStack` | ❌ Not exported | Used directly in pages |
| `Tooltip` | ❌ Not exported | — |

---

## 6. State Management

### TanStack Query (Primary)
- **All server state** is managed via TanStack Query
- `QueryClient` config: `staleTime: 5min`, `gcTime: 30min`, `retry: 1`
- Used in every page for data fetching, caching, and mutations
- Cache invalidation on mutations via `queryClient.invalidateQueries()`

### React Context
| Context | File | State Managed |
|---|---|---|
| `AuthContext` | `AuthContext.tsx` | `user`, `token`, `isAuthenticated`, `isLoading`, `activeRole` |
| `ToastContext` | `ToastContext.tsx` | Toast notifications queue (success/error/warning/info) |

### wagmi/viem (Blockchain State)
- Wallet connection state via wagmi's `useAccount`, `useChainId`
- Contract read/write state via `useReadContract`, `useWriteContract`, `useWaitForTransactionReceipt`
- Chain config via `wagmiConfig` in `app/config.ts`

### Local Component State
- Every page uses `useState` for UI state (filters, modals, form inputs, pagination)
- No shared client state store

### zustand
- **Listed in `package.json` but NEVER imported or used anywhere in the codebase**
- Dead dependency — should be removed

---

## 7. API Client Configuration

### Base Setup (`src/lib/api-client.ts`)
```
Base URL:  VITE_API_URL environment variable (no .env file found in frontend/)
Auth:      Bearer token from localStorage ('auth_token')
Headers:   Content-Type: application/json
```

### Request Flow
1. All requests go through `apiClient.fetch(endpoint, options)`
2. Token attached via `Authorization: Bearer <token>` header
3. Response parsed as JSON automatically
4. Non-ok responses throw `ApiError` with status + message

### 401 Handling / Token Refresh
1. On 401, attempts `POST /auth/refresh` (one retry)
2. Refresh endpoint uses httpOnly cookie (set by backend)
3. On refresh success: updates `localStorage` token, retries original request
4. On refresh failure: clears token, triggers `auth:logout` custom event
5. Mutex lock prevents concurrent refresh attempts

### Environment Variables Required
| Variable | Used In | Purpose |
|---|---|---|
| `VITE_API_URL` | `api-client.ts` | Backend API base URL |
| `VITE_REOWN_PROJECT_ID` | `app/config.ts` | WalletConnect/Reown project ID |
| `VITE_PINATA_JWT` | `hooks/useIPFS.ts` | Pinata IPFS upload auth |
| `VITE_GATEWAY_URL` | `hooks/useIPFS.ts` | Pinata IPFS gateway URL |

**⚠ No `.env` or `.env.example` file exists in the frontend directory. Developers have no reference for required env vars.**

---

## 8. Missing / Incomplete Features

### Non-Functional UI Elements (Buttons/Links That Do Nothing)

| Location | Element | Issue |
|---|---|---|
| `CarDetail` | Heart (favorite) button | `onClick` handler is empty / missing |
| `CarDetail` | Share button | `onClick` handler is empty / missing |
| `Earnings` | "Claim All" button | No handler — button is decorative |
| `Earnings` | "Export Report" button | No handler |
| `Investor/Analytics` | "Export" button | No handler |
| `Investor/Analytics` | "Filters" button | No handler |
| `Profile` | Camera icon (avatar upload) | Non-functional — no file input |
| `Footer` | Newsletter email subscribe | Form with no submit handler |
| `Footer` | All product/resource links | All point to `#` |
| `Login` | "Forgot password?" link | Points to `/forgot-password` (route doesn't exist) |
| `Error` | Support `/help` link | Route doesn't exist |
| `NotFound` | "Go Back" button | Conflicting `<Link to="/">` wrapping `onClick={window.history.back()}` |
| `DriverDashboard` | "View All" rides button | No navigation, just a `<Button>` with no handler |
| `DriverDashboard` | "Request Time Off" button | No handler |

### Placeholder / Mock Implementations

| Location | Feature | Issue |
|---|---|---|
| `Driver/Apply` | Document uploads (license, insurance, background check) | UI-only — submits hardcoded `{ license: 'uploaded', insurance: 'uploaded', background: 'uploaded' }` |
| `Driver/LogExpense` | Receipt upload | UI-only — no file handling |
| `Admin/Analytics` | Revenue chart | Placeholder text: "Integrate with your preferred charting library" |
| `InvestorDashboard` | Claim dividends modal | Uses `setTimeout(2000)` to simulate — no real contract call |
| `CarMonitoring` | Distribute earnings modal | Uses `setTimeout(2000)` to simulate — no real contract call |
| `CarMonitoring` | Schedule maintenance | Local state only — no API call |
| `CarMonitoring` | Driver pool/assignment | "Coming soon" placeholder |
| `DriverDashboard` | Schedule feature | "Coming soon" placeholder |
| `DriverDashboard` | "Hours This Week" | Always shows `--`, no tracking |
| `OwnerDashboard` | Monthly Earnings | Always shows `-- ETH` |
| `OwnerDashboard` | Shareholders count | Always shows `--` |

### Missing Routes Referenced in Code

| Referenced Route | Referenced From | Status |
|---|---|---|
| `/forgot-password` | `Login.tsx` | Does not exist in router |
| `/help` | `Error/index.tsx` | Does not exist in router |

### Missing Access Control

| Route | Issue |
|---|---|
| `/portfolio` | Public — should require authentication |
| `/sell/:carId` | Public — should require authentication |
| `/leaderboard` | Uses `useAdminAnalytics()` + `useAdminUsers()` — admin-only API endpoints called from a public page |

---

## 9. Import Analysis & Potential Broken References

### Verified Working Imports
All page components import from valid paths. The `@/` alias resolves correctly via Vite config (`tsconfig.json` paths + Vite resolve alias).

### Potentially Problematic Patterns

| File | Import | Issue |
|---|---|---|
| `Discover/index.tsx` | `DecorativeCardStack` from `@/components/ui/decorative-card-stack` | Not exported from `@/components/ui/index.ts` — must be imported by direct path |
| `Marketplace/index.tsx` | `DecorativeCardStack` | Same as above |
| `CarMonitoring.tsx` | `Badge` with `size="lg"` prop | Badge component may not support `size` prop — needs verification |
| `OwnerDashboard.tsx` | `useAdminPendingExpenses`, `useReviewExpense` | Owner using admin API — may fail with 403 if backend enforces admin-only |
| `Leaderboard/index.tsx` | `useAdminAnalytics`, `useAdminUsers` | Public page using admin API hooks |

### Dead Exports in `pages/index.ts`
The barrel file exports 9 pages, but the router imports 17+ page components directly. The barrel file is only partially used.

---

## 10. Notification System Status

### Implementation
- **Backend integration:** ✅ Full API hooks exist (`useNotifications`, `useUnreadCount`, `useMarkAllRead`)
- **Polling:** ✅ `useUnreadCount` refetches every 30 seconds
- **UI display:** ✅ `Header.tsx` shows notification bell with unread badge + dropdown panel
- **Mark as read:** ✅ "Mark all as read" button in dropdown calls `useMarkAllRead` mutation

### Notification Dropdown (Header.tsx)
- Shows unread count as red badge on bell icon
- Dropdown lists recent notifications with icons by type
- Each notification shows title, message, relative timestamp
- "Mark all as read" action available
- Links to relevant pages based on notification type

### Gaps
- No individual notification mark-as-read (only bulk)
- No push notifications or WebSocket real-time updates
- No notification preferences/settings page
- No notification type filtering in the dropdown

---

## 11. Hardcoded Values

### Statistics & Marketing Copy

| File | Value | Context |
|---|---|---|
| `Home/index.tsx` | `"1,200+"`, `"$2.5M+"`, `"75+"`, `"15,000+"` | Platform stats section (investors, volume, cars, transactions) |
| `Signup.tsx` | `"$2.4M+"`, `"150+"`, `"5,000+"` | Side panel stats |
| `Login.tsx` | Demo credentials displayed in UI | `investor@demo.com/demo123`, `owner@demo.com/demo123`, etc. |

### Blockchain & Network

| File | Value | Issue |
|---|---|---|
| `app/config.ts` | Chain ID `560048` (Hoodi testnet) | Correct for testnet, needs change for mainnet |
| `contracts/addresses.ts` | Sepolia addresses are all `0x0000...` | Sepolia not deployed |
| `Profile/index.tsx` | `https://etherscan.io/address/` | **Wrong** — should be Hoodi explorer URL |
| `app/config.ts` | `VITE_REOWN_PROJECT_ID` fallback: `''` | Empty string fallback will break WalletConnect |
| `ListingDetail/index.tsx` | `"Listed 2h ago"` | Hardcoded timestamp instead of computed |
| `ListingCard.tsx` | `"Listed 2h ago"` | Same hardcoded timestamp |
| `components/car/CarCard.tsx` | `"Listed 2h ago"` | Same pattern |

### Financial

| File | Value | Context |
|---|---|---|
| `CarMonitoring.tsx` | `$3200` ETH/USD rate | Hardcoded in USD conversion: `parseFloat(netProfit) * 3200` |
| `CarMonitoring.tsx` | `~0.01 ETH` gas fee estimate | Static estimate shown in distribute modal |
| `InvestorDashboard.tsx` | `~0.002 ETH` gas fee estimate | Static estimate shown in claim modal |
| `app/config.ts` | `platformFeeBps: 250` | 2.5% hardcoded (also in contract, but duplicated client-side) |
| `Earnings/index.tsx` | `"5 days"` next payout | Hardcoded countdown |
| `Error/index.tsx` | `support@carshares.io` | Hardcoded support email |

---

## 12. Error Handling Patterns

### Global Error Handling
- **Route error boundary:** `ErrorPage` component set as `errorElement` on root route — catches React Router errors via `useRouteError()`
- **API client:** Throws `ApiError` class with `status`, `message`, `data` fields
- **TanStack Query:** `retry: 1` globally, renders error states based on `isError` flag

### Per-Component Patterns

| Pattern | Used In | Description |
|---|---|---|
| `isError` + `ErrorState` | Most pages | Show error message with retry button on query failure |
| `isLoading` + `LoadingState`/`Loader2` | All pages | Full-page or inline spinner during data fetch |
| Empty state | Most pages | Custom empty UI when data array is empty |
| `try/catch` in handlers | `CreateCar`, `SellShares` | Wraps contract write calls with toast error display |
| Transaction error display | `CarDetail`, `ListingDetail` | Shows `parseContractError()` result for failed simulations |
| `useWaitForTransactionReceipt` | `CreateCar`, `SellShares`, `Admin` | Waits for tx confirmation, shows pending state |
| Image `onError` fallback | `ApiCarCard`, `CarCard`, dashboard images | Falls back to `/placeholder-car.svg` |

### Error Handling Gaps

| Location | Issue | Severity |
|---|---|---|
| `Admin/index.tsx` | `if (feeSuccess)` and `if (withdrawSuccess)` called during render (should be in `useEffect`) | **Bug** — causes potential state update during render |
| `CarMonitoring.tsx` | `handleDistribute()` is a `setTimeout` mock — no error handling for real scenario | Medium |
| `InvestorDashboard.tsx` | `handleClaimDividends()` same mock issue | Medium |
| `CarMonitoring.tsx` | `setSelectedCar(myCars[0])` called during render (no useEffect) | **Bug** — state update during render |
| `Discover/index.tsx` | Category filter state exists but filter logic not implemented | Medium |
| `Discover/index.tsx` | "funded" sort option has no implementation case | Low |
| `LogExpense.tsx` | Date field present in UI but not sent in mutation payload | Low |
| `Leaderboard/index.tsx` | Rankings sorted by `createdAt` (join date) not by any performance metric | Design flaw |
| Various pages | No error boundaries around individual page sections — one failing component crashes entire page | Medium |
| Toast context | No programmatic toast on wallet disconnect or network switch | Low |

---

## Summary of Critical Findings

### High Priority
1. **No `.env.example` file** — developers have no reference for 4 required env vars
2. **`/portfolio` and `/sell/:carId` routes lack authentication guards** — any visitor can access
3. **Leaderboard uses admin-only API endpoints** on a public page — will likely 403 for regular users
4. **Admin page has render-time side effects** — `if (feeSuccess)` / `if (withdrawSuccess)` outside `useEffect`
5. **CarMonitoring sets state during render** — `setSelectedCar()` should be in `useEffect`
6. **Profile Etherscan link hardcoded to mainnet** — should use Hoodi testnet explorer
7. **zustand is an unused dependency** — adds ~3KB gzipped for nothing

### Medium Priority
8. **Claim/Distribute dividends flows are mocked** with `setTimeout` — no real contract interaction
9. **Driver document uploads are fake** — submits hardcoded strings instead of actual files
10. **5+ non-functional buttons** across the app (Export, Claim All, Share, Heart, etc.)
11. **"Listed 2h ago"** hardcoded in 3 components instead of computed from timestamp
12. **Category filter in Discover** is wired in state but never applied
13. **Hardcoded ETH/USD rate** ($3200) in CarMonitoring — should use an oracle or API
14. **Demo credentials displayed on Login page** — security concern for production

### Low Priority
15. All Footer links point to `#`
16. Newsletter subscribe form is non-functional
17. Analytics chart is a placeholder
18. Driver schedule feature is "coming soon"
19. Barrel export `pages/index.ts` is incomplete (9 of 17+ pages)
20. `DecorativeCardStack`, `toast`, `spinner`, `textarea`, `icon`, `tooltip` not exported from UI barrel
