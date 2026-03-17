import { motion } from 'framer-motion';
import { Cookie } from 'lucide-react';

export function CookiePolicy() {
  return (
    <div className="min-h-screen bg-background">
      <section className="relative py-16 lg:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-warning/5 via-background to-background" />
        <div className="container relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warning/10 border border-warning/20 mb-6">
              <Cookie className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium text-warning">Legal</span>
            </div>
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-text-primary mb-4">
              Cookie <span className="text-gradient">Policy</span>
            </h1>
            <p className="text-text-muted">Last updated: February 2025</p>
          </motion.div>
        </div>
      </section>

      <div className="container py-12 max-w-3xl">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <Section title="1. What Are Cookies?">
            Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences and improve your browsing experience.
          </Section>

          <Section title="2. How We Use Cookies">
            CarShares uses cookies and similar technologies for:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Essential Cookies:</strong> Required for the platform to function — authentication tokens, session management, and security preferences.</li>
              <li><strong>Preference Cookies:</strong> Remember your settings like theme, language, and notification preferences.</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how users interact with the platform so we can improve the user experience.</li>
            </ul>
          </Section>

          <Section title="3. Cookies We Use">
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-2 pr-4 font-semibold text-text-primary">Cookie</th>
                    <th className="pb-2 pr-4 font-semibold text-text-primary">Purpose</th>
                    <th className="pb-2 font-semibold text-text-primary">Duration</th>
                  </tr>
                </thead>
                <tbody className="text-text-muted">
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">access_token</td>
                    <td className="py-2 pr-4">JWT authentication</td>
                    <td className="py-2">15 minutes</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">refresh_token</td>
                    <td className="py-2 pr-4">Session renewal</td>
                    <td className="py-2">7 days</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">theme_preference</td>
                    <td className="py-2 pr-4">UI theme setting</td>
                    <td className="py-2">1 year</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">notification_prefs</td>
                    <td className="py-2 pr-4">Notification settings</td>
                    <td className="py-2">Persistent</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="4. Local Storage">
            In addition to cookies, we use browser Local Storage for storing authentication tokens and user preferences. Local Storage data persists until explicitly cleared.
          </Section>

          <Section title="5. Third-Party Cookies">
            We may use third-party services that set their own cookies:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Wallet Providers:</strong> Services like MetaMask or WalletConnect may store connection data.</li>
              <li><strong>Analytics:</strong> If enabled, analytics providers may set tracking cookies.</li>
            </ul>
          </Section>

          <Section title="6. Managing Cookies">
            You can manage or delete cookies through your browser settings. Most browsers allow you to:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>View and delete existing cookies</li>
              <li>Block all or specific cookies</li>
              <li>Configure cookie preferences by site</li>
            </ul>
            <p className="mt-2">Note: Disabling essential cookies may prevent you from using platform features like authentication.</p>
          </Section>

          <Section title="7. Contact">
            For questions about our cookie practices, contact us at <strong>privacy@carshares.io</strong>.
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
