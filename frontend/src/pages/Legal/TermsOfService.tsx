import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

export function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <section className="relative py-16 lg:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-background to-background" />
        <div className="container relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
              <FileText className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-accent">Legal</span>
            </div>
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-text-primary mb-4">
              Terms of <span className="text-gradient">Service</span>
            </h1>
            <p className="text-text-muted">Last updated: February 2025</p>
          </motion.div>
        </div>
      </section>

      <div className="container py-12 max-w-3xl">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <Section title="1. Acceptance of Terms">
            By accessing or using the CarShares platform (&quot;Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, you may not use the Service.
          </Section>

          <Section title="2. Description of Service">
            CarShares is a decentralized platform enabling fractional ownership of vehicles through blockchain-based tokenized shares. The platform facilitates the creation, buying, selling, and trading of vehicle shares as ERC-1155 tokens on Ethereum.
          </Section>

          <Section title="3. Eligibility">
            You must be at least 18 years old and legally able to enter into binding contracts in your jurisdiction. Users in jurisdictions where tokenized assets are prohibited may not use this Service.
          </Section>

          <Section title="4. Account Responsibilities">
            You are responsible for maintaining the security of your account credentials and wallet private keys. You agree to notify us immediately of any unauthorized access to your account. We are not liable for any loss resulting from unauthorized use of your account or wallet.
          </Section>

          <Section title="5. Tokenized Shares">
            Car shares are represented as ERC-1155 tokens on the Ethereum blockchain. Purchasing shares does not grant legal ownership of the underlying physical vehicle. Share ownership entitles you to proportional dividends from the vehicle&apos;s ride earnings as distributed through the smart contract.
          </Section>

          <Section title="6. Marketplace">
            The CarShares marketplace enables peer-to-peer trading of car shares. All marketplace transactions are executed via smart contracts. A platform fee may be applied to each trade. We do not guarantee the liquidity of any shares.
          </Section>

          <Section title="7. Earnings & Dividends">
            Dividends are distributed from ride earnings after deducting driver pay, expenses, and platform fees. Dividend amounts are not guaranteed and depend on actual ride activity for each vehicle.
          </Section>

          <Section title="8. KYC & Compliance">
            We may require identity verification (KYC) for certain platform features. You agree to provide accurate and truthful information. We reserve the right to suspend accounts that fail verification.
          </Section>

          <Section title="9. Prohibited Activities">
            You may not:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Use the Service for money laundering or illegal activities</li>
              <li>Manipulate market prices or engage in wash trading</li>
              <li>Attempt to exploit smart contract vulnerabilities</li>
              <li>Impersonate other users or entities</li>
              <li>Use bots or automated tools without authorization</li>
              <li>Circumvent platform security measures</li>
            </ul>
          </Section>

          <Section title="10. Risks">
            Using blockchain-based financial platforms involves inherent risks including but not limited to:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Volatility in token value</li>
              <li>Smart contract bugs or exploits</li>
              <li>Network congestion and high gas fees</li>
              <li>Loss of access to wallets or private keys</li>
              <li>Regulatory changes affecting digital assets</li>
            </ul>
            You acknowledge and accept these risks.
          </Section>

          <Section title="11. Limitation of Liability">
            To the maximum extent permitted by law, CarShares shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service. Our total liability shall not exceed the amount you paid to use the Service in the preceding 12 months.
          </Section>

          <Section title="12. Modifications">
            We reserve the right to modify these Terms at any time. Changes will be posted on this page with an updated date. Continued use of the Service after changes constitutes acceptance.
          </Section>

          <Section title="13. Contact">
            For questions regarding these Terms, please contact us at <strong>legal@carshares.io</strong>.
          </Section>
        </motion.div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8 rounded-2xl border border-border bg-surface p-6">
      <h2 className="font-heading font-bold text-lg text-text-primary mb-3">{title}</h2>
      <div className="text-text-secondary text-sm leading-relaxed">{children}</div>
    </div>
  );
}
