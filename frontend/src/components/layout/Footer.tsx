import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Car, Github, Twitter, Linkedin, ArrowUpRight, Globe } from 'lucide-react';

const platformLinks = [
  { href: '/discover', label: 'Discover Cars' },
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/create', label: 'Tokenize a Car' },
];

const communityLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/portfolio', label: 'Portfolio' },
  // { href: '/earnings', label: 'Earnings' }, // disabled — page not ready
];

const resourceLinks = [
  { href: '/docs', label: 'Documentation' },
  { href: '/faq', label: 'FAQ' },
  { href: '/support', label: 'Support' },
];

const legalLinks = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/cookies', label: 'Cookie Policy' },
];

const socialLinks = [
  { href: 'https://twitter.com', icon: Twitter, label: 'Twitter' },
  { href: 'https://github.com', icon: Github, label: 'GitHub' },
  { href: 'https://linkedin.com', icon: Linkedin, label: 'LinkedIn' },
];

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    // TODO: Connect to actual newsletter API
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 3000);
  };

  return (
    <footer className="border-t border-border bg-surface">
      <div className="container py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link to="/" className="flex  items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg shadow-primary/20">
                <Car className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-bold text-text-primary">CarShares</span>
                <span className="text-[10px] text-text-muted uppercase tracking-wider">
                  Tokenized Ownership
                </span>
              </div>
            </Link>
            <p className="mt-4 text-sm text-text-secondary leading-relaxed max-w-xs">
              Own a piece of premium vehicles through tokenized shares.
              Invest, earn from rides, and trade on the marketplace.
            </p>

            {/* Social Links */}
            <div className="mt-6 flex gap-2">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-background-elevated text-text-muted hover:bg-primary hover:text-white transition-all duration-200"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>

            {/* Newsletter */}
            <div className="mt-6">
              <p className="text-sm font-medium text-text-primary mb-2">Stay updated</p>
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 h-9 px-3 text-sm rounded-lg bg-background-elevated border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  className="h-9 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
                >
                  {subscribed ? '✓ Done' : 'Subscribe'}
                </button>
              </form>
              {subscribed && (
                <p className="text-xs text-success mt-1">Thanks for subscribing!</p>
              )}
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="font-heading font-semibold text-sm mb-4 text-text-primary">Platform</h3>
            <ul className="space-y-3">
              {platformLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-text-secondary hover:text-primary transition-colors inline-flex items-center gap-1 group"
                  >
                    {link.label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community Links */}
          <div>
            <h3 className="font-heading font-semibold text-sm mb-4 text-text-primary">Community</h3>
            <ul className="space-y-3">
              {communityLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-text-secondary hover:text-primary transition-colors inline-flex items-center gap-1 group"
                  >
                    {link.label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-heading font-semibold text-sm mb-4 text-text-primary">Resources</h3>
            <ul className="space-y-3">
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-text-secondary hover:text-primary transition-colors inline-flex items-center gap-1 group"
                  >
                    {link.label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-heading font-semibold text-sm mb-4 text-text-primary">Legal</h3>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-text-secondary hover:text-primary transition-colors inline-flex items-center gap-1 group"
                  >
                    {link.label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-text-muted">
              &copy; {new Date().getFullYear()} CarShares. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                Built on Ethereum
              </span>
              <span className="w-1 h-1 rounded-full bg-text-muted" />
              <span>Hoodi Testnet</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
