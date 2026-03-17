import { motion } from 'framer-motion';
import { BookOpen, Code, Coins, Shield, Users, Car } from 'lucide-react';
import { Link } from 'react-router-dom';

const sections = [
  {
    icon: Car,
    title: 'Platform Overview',
    color: 'text-primary',
    bg: 'bg-primary/10',
    content: `CarShares is a decentralized car ownership platform built on Ethereum. It enables fractional ownership of premium vehicles through ERC-1155 tokens. Each car is represented by a unique token ID, with shares distributed among investors. The platform connects three key participants: Car Owners who tokenize their vehicles, Investors who purchase shares, and Drivers who operate the vehicles and generate earnings.`,
  },
  {
    icon: Code,
    title: 'Smart Contracts',
    color: 'text-accent',
    bg: 'bg-accent/10',
    content: `The platform uses two main smart contracts:

**CarShares (ERC-1155)**: Manages car tokenization and share ownership. Car owners can create new car tokens with a specified total supply and price per share. Investors can buy shares directly from the contract.

**Marketplace**: Enables peer-to-peer trading of car shares. Users can create sell listings at custom prices, and buyers can purchase shares from the marketplace. A configurable platform fee is applied to each trade.

Both contracts are deployed on the Hoodi testnet and are fully auditable on-chain.`,
  },
  {
    icon: Coins,
    title: 'Tokenomics & Earnings',
    color: 'text-success',
    bg: 'bg-success/10',
    content: `Each tokenized car has a fixed total supply of shares. The price per share is set during tokenization. Earnings flow as follows:

1. **Drivers** complete rides and log earnings
2. **Platform** deducts the platform fee percentage
3. **Driver** receives their share of ride earnings
4. **Remaining earnings** are distributed as dividends to shareholders proportionally

Dividend distributions are tracked on-chain and can be claimed by shareholders through the smart contract.`,
  },
  {
    icon: Users,
    title: 'User Roles',
    color: 'text-info',
    bg: 'bg-info/10',
    content: `CarShares supports multi-role accounts. A single user can have multiple roles:

**Investor**: Browse cars, purchase shares, track portfolio, receive dividends, and trade on the marketplace.

**Car Owner**: Tokenize vehicles, manage share offerings, assign drivers, and monitor car performance.

**Driver**: Apply to drive tokenized cars, log rides and earnings, submit expense claims, and build a driver rating.

**Admin**: Manage users, approve driver applications, review KYC submissions, handle expense approvals, and view platform analytics.`,
  },
  {
    icon: Shield,
    title: 'Security & KYC',
    color: 'text-warning',
    bg: 'bg-warning/10',
    content: `The platform implements multiple security layers:

**Authentication**: Dual auth support — email/password with bcrypt hashing, or wallet-based Sign-In With Ethereum (SIWE).

**Authorization**: JWT access/refresh token system with role-based access control.

**KYC**: Identity verification through document submission. Required for certain platform features.

**On-chain Security**: Smart contracts enforce share ownership, transfer rules, and marketplace trading logic without trusted intermediaries.`,
  },
//   {
//     icon: BookOpen,
//     title: 'API Reference',
//     color: 'text-primary',
//     bg: 'bg-primary/10',
//     content: `The backend exposes a RESTful API with the following main endpoints:

// **Auth**: \`POST /auth/signup\`, \`POST /auth/login\`, \`POST /auth/wallet-login\`, \`POST /auth/refresh\`

// **Users**: \`GET /users/profile\`, \`PUT /users/profile\`, \`POST /users/kyc\`, \`POST /users/role\`

// **Cars**: \`GET /cars\`, \`GET /cars/:id\`, \`POST /cars\`

// **Marketplace**: \`GET /marketplace/listings\`, \`POST /marketplace/listings\`

// **Portfolio**: \`GET /portfolio/summary\`, \`GET /portfolio/holdings\`

// **Leaderboard**: \`GET /leaderboard/stats\`, \`GET /leaderboard/investors\`, \`GET /leaderboard/owners\`, \`GET /leaderboard/drivers\`

// All authenticated endpoints require a Bearer JWT token in the Authorization header.`,
//   },
];

export function Documentation() {
  return (
    <div className="min-h-screen bg-background">
      <section className="relative py-16 lg:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="container relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Documentation</span>
            </div>
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-text-primary mb-4">
              Platform <span className="text-gradient">Documentation</span>
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Learn how CarShares works, from smart contracts to user guides.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container py-12 max-w-4xl">
        {/* Quick nav */}
        <div className="mb-12 p-6 rounded-2xl bg-surface border border-border">
          <h2 className="font-heading font-bold text-lg text-text-primary mb-4">Quick Navigation</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {sections.map((s, i) => {
              const Icon = s.icon;
              return (
                <a key={i} href={`#section-${i}`} className="flex items-center gap-2 p-3 rounded-xl bg-background-elevated hover:bg-primary/10 transition-colors text-sm">
                  <Icon className={`h-4 w-4 ${s.color}`} />
                  <span className="text-text-primary">{s.title}</span>
                </a>
              );
            })}
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((section, i) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={i}
                id={`section-${i}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-border bg-surface overflow-hidden"
              >
                <div className="p-6 border-b border-border flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${section.bg}`}>
                    <Icon className={`h-5 w-5 ${section.color}`} />
                  </div>
                  <h2 className="font-heading font-bold text-xl text-text-primary">{section.title}</h2>
                </div>
                <div className="p-6">
                  <div className="prose prose-sm max-w-none text-text-secondary leading-relaxed whitespace-pre-line">
                    {section.content}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-text-muted mb-4">Have more questions?</p>
          <div className="flex gap-4 justify-center">
            <Link to="/faq" className="text-primary hover:underline text-sm">Browse FAQ</Link>
            <Link to="/support" className="text-primary hover:underline text-sm">Contact Support</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
