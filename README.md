# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.js
```
<!-- RedisInsight-20a008ae-c806-1742376552419 -->




Backend Built Successfully
Project Structure (69 TypeScript files)

backend/
├── prisma/
│   └── schema.prisma              # 12 models, 9 enums, all relations
├── generated/prisma/               # Auto-generated Prisma client
├── src/
│   ├── main.ts                     # Entry point with Swagger, CORS, Helmet, Validation
│   ├── app.module.ts               # Root module wiring all modules
│   ├── config/                     # 4 config modules (database, jwt, blockchain, redis)
│   ├── common/
│   │   ├── guards/                 # JwtAuthGuard, RolesGuard, AdminGuard
│   │   ├── decorators/             # @CurrentUser, @Roles, @Public
│   │   ├── interceptors/           # Logging, Transform (wraps responses)
│   │   ├── filters/                # Global exception filter
│   │   └── pipes/                  # Zod validation pipe
│   ├── modules/
│   │   ├── auth/                   # JWT + SIWE login, signup, wallet auth, refresh tokens
│   │   ├── users/                  # Profile CRUD, KYC submission, role management
│   │   ├── blockchain/             # Event indexer, contract reads via viem
│   │   ├── cars/                   # Car discovery, details with on-chain enrichment
│   │   ├── marketplace/            # Active listings from chain, trade history from DB
│   │   ├── portfolio/              # Holdings (on-chain balance checks), dividends
│   │   ├── drivers/                # Applications, ride logging, expenses
│   │   ├── earnings/               # Cross-role earnings aggregation
│   │   ├── admin/                  # User mgmt, KYC reviews, app approvals, analytics
│   │   └── notifications/          # In-app notification system
│   └── shared/                     # Types, utils (formatWei, pagination)
├── docker-compose.yml              # PostgreSQL + Redis + API
├── Dockerfile                      # Multi-stage production build
├── .env / .env.example             # All environment variables
└── package.json                    # All scripts including prisma commands
API Endpoints (via Swagger at /api/docs)
Module	Endpoints
Auth	POST /api/auth/signup, login, nonce, wallet-login, refresh, GET /me
Users	GET/PUT /api/users/profile, GET /wallet/:address, POST /kyc, GET /kyc/status
Cars	GET /api/cars (paginated), GET /:id (on-chain enriched), GET /owner/me, GET /:id/stats
Marketplace	GET /api/marketplace/listings, GET /listings/:id, GET /trades/:carId, GET /trades/me
Portfolio	GET /api/portfolio (summary), GET /holdings, GET /dividends
Drivers	POST /api/drivers/apply, GET /applications, GET /profile, POST /rides, POST /expenses
Earnings	GET /api/earnings (cross-role), GET /breakdown?period=month
Admin	GET /api/admin/users, PUT /users/:id/roles, KYC/application/expense reviews, GET /analytics
Notifications	GET /api/notifications, GET /unread-count, POST /mark-read
To Get Started

cd backend

# 1. Start PostgreSQL + Redis
docker-compose up -d postgres redis

# 2. Run migrations
npx prisma migrate dev --name init

# 3. Start dev server
npm run start:dev
# → http://localhost:3001/api/docs (Swagger)