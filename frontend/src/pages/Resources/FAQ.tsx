import { motion } from 'framer-motion';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

const faqs = [
  {
    category: 'Getting Started',
    items: [
      {
        q: 'What is CarShares?',
        a: 'CarShares is a blockchain-based platform that allows you to invest in premium vehicles through tokenized shares. Each car is represented as an ERC-1155 token on Ethereum, and shareholders earn dividends from the car\'s ride earnings.',
      },
      {
        q: 'How do I create an account?',
        a: 'You can sign up with your email and password, or connect your Ethereum wallet directly. If you sign up with email, you can link your wallet later from your profile.',
      },
      {
        q: 'What blockchain does CarShares use?',
        a: 'CarShares operates on the Ethereum blockchain, specifically on the Hoodi testnet for the current version. All share ownership and transactions are recorded on-chain.',
      },
      {
        q: 'Do I need a crypto wallet?',
        a: 'Yes, you need an Ethereum-compatible wallet (like MetaMask) to buy, sell, or hold car shares. The wallet is used to sign transactions and prove ownership.',
      },
    ],
  },
  {
    category: 'Investing',
    items: [
      {
        q: 'How do I buy car shares?',
        a: 'Browse available cars on the Discover page, select a car you\'re interested in, and click "Buy Shares." You\'ll need ETH in your connected wallet to complete the purchase.',
      },
      {
        q: 'How are dividends calculated?',
        a: 'Dividends come from the car\'s ride earnings. After deducting driver pay and platform fees, the remaining earnings are distributed proportionally to all shareholders based on their share percentage.',
      },
      {
        q: 'Can I sell my shares?',
        a: 'Yes! You can list your shares for sale on the Marketplace. Other investors can purchase them at your listed price. The marketplace uses smart contracts for trustless peer-to-peer trading.',
      },
      {
        q: 'What are the fees?',
        a: 'The platform charges a small fee on marketplace transactions. This fee is configurable by the platform administrator and is transparently enforced by the smart contract.',
      },
    ],
  },
  {
    category: 'Car Owners',
    items: [
      {
        q: 'How do I tokenize my car?',
        a: 'As a car owner, navigate to "Tokenize a Car" from the dashboard. Fill in your car details, set the total number of shares and price per share, and submit. The car will be uploaded to IPFS and registered on the blockchain.',
      },
      {
        q: 'How do I assign drivers?',
        a: 'Once your car is tokenized, drivers can apply to drive it. You\'ll receive applications that you can review and approve from your owner dashboard.',
      },
      {
        q: 'How do I monitor my car\'s performance?',
        a: 'Use the Car Monitoring page in your owner dashboard to track rides, earnings, expenses, and driver performance for each of your cars.',
      },
    ],
  },
  {
    category: 'Drivers',
    items: [
      {
        q: 'How do I become a driver?',
        a: 'Add the "Driver" role from your profile, then submit a driver application. Once approved by an admin, you can apply to drive specific cars.',
      },
      {
        q: 'How do I log rides?',
        a: 'After being assigned to a car, use the "Log Ride" page to record trip details including distance, fare, and any notes.',
      },
      {
        q: 'How are expense claims handled?',
        a: 'You can submit expenses (fuel, maintenance, etc.) from the "Log Expense" page. These are reviewed and approved by platform admins.',
      },
    ],
  },
  {
    category: 'Security & KYC',
    items: [
      {
        q: 'Is my investment secure?',
        a: 'All share ownership is recorded on the Ethereum blockchain via smart contracts. The contracts are immutable and auditable. However, as with all crypto investments, please do your own research.',
      },
      {
        q: 'What is KYC and why is it needed?',
        a: 'KYC (Know Your Customer) verification confirms your identity. It\'s required for certain platform features and helps maintain regulatory compliance and platform security.',
      },
      {
        q: 'How do I complete KYC?',
        a: 'Go to your Profile > KYC Verification section. Upload your identity document (passport, driver\'s license, or national ID) and optionally a selfie. Verification typically takes 1-3 business days.',
      },
    ],
  },
];

export function FAQ() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (key: string) => {
    setOpenItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="relative py-16 lg:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="container relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <HelpCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">FAQ</span>
            </div>
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-text-primary mb-4">
              Frequently Asked <span className="text-gradient">Questions</span>
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Everything you need to know about investing in tokenized car shares.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container py-12 max-w-4xl">
        {faqs.map((category, ci) => (
          <motion.div
            key={category.category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: ci * 0.1 }}
            className="mb-8"
          >
            <h2 className="font-heading font-bold text-xl text-text-primary mb-4">{category.category}</h2>
            <div className="space-y-3">
              {category.items.map((item, qi) => {
                const key = `${ci}-${qi}`;
                const isOpen = openItems.has(key);
                return (
                  <div key={key} className="rounded-xl border border-border bg-surface overflow-hidden">
                    <button
                      onClick={() => toggleItem(key)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-background-elevated/50 transition-colors"
                    >
                      <span className="font-medium text-text-primary pr-4">{item.q}</span>
                      {isOpen ? (
                        <ChevronUp className="h-5 w-5 text-text-muted shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-text-muted shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4">
                        <p className="text-text-secondary text-sm leading-relaxed">{item.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
