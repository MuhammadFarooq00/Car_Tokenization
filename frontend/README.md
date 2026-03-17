# Car Tokenization Frontend

A React.js frontend for the Car Tokenization platform - enabling fractional ownership of vehicles through ERC-1155 tokens.

## Tech Stack

- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Web3:** wagmi v2 + viem
- **Wallet:** Reown AppKit (WalletConnect)
- **Styling:** Tailwind CSS + Radix UI
- **Animations:** Framer Motion
- **Forms:** react-hook-form + zod
- **IPFS:** Pinata SDK

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A Pinata account for IPFS uploads (optional, for creating cars)

### Installation

```bash
cd frontend
npm install
```

### Environment Setup

Create a `.env` file in the frontend directory:

```env
# Pinata IPFS Configuration (required for car creation)
VITE_PINATA_JWT=your_pinata_jwt_token
VITE_PINATA_GATEWAY=your_gateway.mypinata.cloud
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Hero section, featured cars, recent listings |
| `/discover` | Discover | Browse all tokenized cars |
| `/car/:carId` | Car Detail | View car info, buy primary shares |
| `/marketplace` | Marketplace | Browse secondary market listings |
| `/listing/:listingId` | Listing Detail | View and buy from a listing |
| `/portfolio` | Portfolio | Your holdings, listings, and history |
| `/create` | Create Car | Tokenize a new vehicle |
| `/sell/:carId` | Sell Shares | Create a marketplace listing |
| `/admin` | Admin | Platform owner controls |

## Contract Integration

The frontend integrates with two smart contracts:

### CarShares.sol
- `createCar()` - Tokenize a new vehicle
- `buyPrimary()` - Purchase shares in primary sale
- `getCarConfig()` - Get car configuration
- `balanceOf()` - Check share balance

### Marketplace.sol
- `createListing()` - List shares for sale
- `buyFromListing()` - Purchase from listing
- `cancelListing()` - Cancel active listing
- `getListing()` - Get listing details

## Supported Networks

- Sepolia Testnet (Chain ID: 11155111)
- Localhost (Chain ID: 31337)

Contract addresses are configured in `src/contracts/addresses.ts`.

## Project Structure

```
src/
├── app/           # App config (providers, router)
├── components/    # Reusable components
│   ├── ui/        # Base UI components
│   ├── layout/    # Header, Footer, Layout
│   ├── wallet/    # Wallet connection
│   ├── car/       # Car display components
│   ├── marketplace/  # Listing components
│   └── feedback/  # Loading, Empty, Error states
├── contracts/     # ABIs and addresses
├── hooks/         # Custom React hooks
│   └── contracts/ # Contract interaction hooks
├── lib/           # Utilities
├── pages/         # Page components
├── stores/        # Zustand stores
├── styles/        # Global CSS
└── types/         # TypeScript types
```

## Color Scheme

"Pearl White" theme with navy and copper accents:

- **Background:** Off-white (#fafafa)
- **Primary Accent:** Deep Navy (#1e293b)
- **Warm Accent:** Copper (#c2410c)

## License

MIT
