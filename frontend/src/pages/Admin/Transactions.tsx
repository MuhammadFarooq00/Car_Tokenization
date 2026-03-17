import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  CreditCard, ChevronLeft, ChevronRight, Loader2, Search,
  ArrowUpRight, ArrowDownLeft, ExternalLink, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminTransactions } from '@/hooks/api/useAdminApi';
import { formatAddress, weiToEth } from '@/lib/utils';

const TX_TYPE_INFO: Record<string, { label: string; color: string; icon: typeof ArrowUpRight }> = {
  car_created: { label: 'Car Created', color: 'bg-accent/10 text-accent', icon: ArrowUpRight },
  primary_purchase: { label: 'Primary Purchase', color: 'bg-success/10 text-success', icon: ArrowDownLeft },
  listing_created: { label: 'Listing Created', color: 'bg-info/10 text-info', icon: ArrowUpRight },
  listing_filled: { label: 'Listing Filled', color: 'bg-primary/10 text-primary', icon: ArrowDownLeft },
  listing_cancelled: { label: 'Listing Cancelled', color: 'bg-warning/10 text-warning', icon: ArrowUpRight },
};

export function TransactionsManagement() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const { data, isLoading } = useAdminTransactions({ page, limit: 20 });

  const transactions = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const filtered = transactions.filter((tx) => {
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    const matchesSearch =
      !search ||
      tx.txHash?.toLowerCase().includes(search.toLowerCase()) ||
      tx.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      tx.user?.walletAddress?.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="relative py-12 lg:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-info/5 via-background to-background" />
        <div className="container relative">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-text-secondary bg-background-elevated border border-border hover:text-text-primary hover:border-primary/40 hover:bg-background-hover transition-all mb-6"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Admin
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-info/10 border border-info/20 mb-4">
              <CreditCard className="h-4 w-4 text-info" />
              <span className="text-sm font-medium text-info">Transactions</span>
            </div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-2">
              All <span className="text-gradient">Transactions</span>
            </h1>
            <p className="text-text-secondary max-w-xl">
              View every on-chain transaction recorded on the platform.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container pb-16">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Input
            placeholder="Search by tx hash, user name, or wallet..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            inputSize="lg"
            className="flex-1"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-12 px-4 rounded-xl bg-surface border border-border text-text-primary text-sm focus:outline-none focus:border-primary"
          >
            <option value="all">All Types</option>
            <option value="car_created">Car Created</option>
            <option value="primary_purchase">Primary Purchase</option>
            <option value="listing_created">Listing Created</option>
            <option value="listing_filled">Listing Filled</option>
            <option value="listing_cancelled">Listing Cancelled</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <CreditCard className="h-12 w-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-muted">No transactions found.</p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-border bg-surface overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-background-elevated/50">
                      <th className="text-left p-4 font-medium text-text-muted">Type</th>
                      <th className="text-left p-4 font-medium text-text-muted">User</th>
                      <th className="text-left p-4 font-medium text-text-muted">Car ID</th>
                      <th className="text-right p-4 font-medium text-text-muted">Shares</th>
                      <th className="text-right p-4 font-medium text-text-muted">Price</th>
                      <th className="text-left p-4 font-medium text-text-muted">Tx Hash</th>
                      <th className="text-left p-4 font-medium text-text-muted">Block</th>
                      <th className="text-left p-4 font-medium text-text-muted">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((tx) => {
                      const info = TX_TYPE_INFO[tx.type] ?? {
                        label: tx.type,
                        color: 'bg-background-elevated text-text-muted',
                        icon: ArrowUpRight,
                      };
                      const Icon = info.icon;
                      return (
                        <tr key={tx.id} className="hover:bg-background-elevated/30 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${info.color}`}>
                                <Icon className="h-3.5 w-3.5" />
                              </div>
                              <span className="font-medium text-text-primary text-xs">{info.label}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <User className="h-3.5 w-3.5 text-text-muted" />
                              <span className="text-text-secondary">
                                {tx.user?.name || (tx.user?.walletAddress ? formatAddress(tx.user.walletAddress) : tx.userId.slice(0, 8))}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <Link to={`/car/${tx.carId}`} className="text-primary hover:underline font-mono text-xs">
                              #{tx.carId}
                            </Link>
                          </td>
                          <td className="p-4 text-right font-mono text-text-primary">{tx.amount}</td>
                          <td className="p-4 text-right font-mono text-text-primary">
                            {weiToEth(tx.price)} ETH
                          </td>
                          <td className="p-4">
                            <a
                              href={`https://etherscan.io/tx/${tx.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-primary hover:underline font-mono text-xs"
                            >
                              {tx.txHash.slice(0, 10)}...
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </td>
                          <td className="p-4 font-mono text-xs text-text-muted">{tx.blockNumber}</td>
                          <td className="p-4 text-xs text-text-muted whitespace-nowrap">
                            {new Date(tx.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-text-muted">
                  Page {page} of {totalPages} ({data?.total ?? 0} transactions)
                </p>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
