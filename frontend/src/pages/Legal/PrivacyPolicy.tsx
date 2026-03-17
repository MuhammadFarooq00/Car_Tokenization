import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <section className="relative py-16 lg:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="container relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Legal</span>
            </div>
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-text-primary mb-4">
              Privacy <span className="text-gradient">Policy</span>
            </h1>
            <p className="text-text-muted">Last updated: February 2025</p>
          </motion.div>
        </div>
      </section>

      <div className="container py-12 max-w-3xl">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="prose-custom">
          <Section title="1. Introduction">
            This Privacy Policy explains how CarShares (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) collects, uses, and protects your personal information when you use our platform and services. By using CarShares, you agree to the practices described in this policy.
          </Section>

          <Section title="2. Information We Collect">
            <strong>Account Information:</strong> When you create an account, we collect your email address, name, and encrypted password. If you use wallet-based authentication, we collect your public Ethereum wallet address.
            <br /><br />
            <strong>KYC Information:</strong> If you complete identity verification, we collect your document type, identity document images, and selfie images.
            <br /><br />
            <strong>Transaction Data:</strong> We record your on-platform activities including share purchases, marketplace listings, ride logs, and dividend claims.
            <br /><br />
            <strong>Usage Data:</strong> We may collect information about how you access and use the platform, including IP addresses, browser type, and pages visited.
          </Section>

          <Section title="3. How We Use Your Information">
            We use collected information to:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related notifications</li>
              <li>Verify your identity for KYC compliance</li>
              <li>Communicate with you about updates, security alerts, and support</li>
              <li>Detect and prevent fraud or abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </Section>

          <Section title="4. Blockchain Data">
            Transactions on the Ethereum blockchain are publicly visible and immutable. Your wallet address and on-chain transaction history cannot be modified or deleted by us. We recommend using a dedicated wallet for privacy.
          </Section>

          <Section title="5. Data Sharing">
            We do not sell your personal information. We may share data with:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Service providers who assist in operating our platform</li>
              <li>Law enforcement when required by law</li>
              <li>Other users, limited to publicly visible profile information (username, avatar, role)</li>
            </ul>
          </Section>

          <Section title="6. Data Security">
            We implement industry-standard security measures including encrypted data transmission (HTTPS), bcrypt password hashing, and JWT-based session management. However, no method of electronic storage is 100% secure.
          </Section>

          <Section title="7. Data Retention">
            We retain your account data as long as your account is active. You may request account deletion by contacting support. Blockchain records cannot be deleted due to the immutable nature of distributed ledgers.
          </Section>

          <Section title="8. Your Rights">
            Depending on your jurisdiction, you may have the right to:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to data processing</li>
              <li>Export your data in a portable format</li>
            </ul>
          </Section>

          <Section title="9. Contact Us">
            For privacy-related inquiries, please contact us at <strong>privacy@carshares.io</strong>.
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
