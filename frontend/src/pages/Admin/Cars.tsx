import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Car, ChevronLeft, ChevronRight, Loader2, Search,
  User, Calendar, DollarSign, Hash, Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAdminCars } from '@/hooks/api/useAdminApi';
import { weiToEth } from '@/lib/utils';

const STATUS_COLORS: Record<string, { variant: 'success' | 'warning' | 'error'; label: string }> = {
  active: { variant: 'success', label: 'Active' },
  paused: { variant: 'warning', label: 'Paused' },
  retired: { variant: 'error', label: 'Retired' },
};

export function CarsManagement() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data, isLoading } = useAdminCars({ page, limit: 20 });

  const cars = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const filtered = cars.filter((car) => {
    const matchesStatus = statusFilter === 'all' || car.status === statusFilter;
    const matchesSearch =
      !search ||
      car.name?.toLowerCase().includes(search.toLowerCase()) ||
      car.make?.toLowerCase().includes(search.toLowerCase()) ||
      car.model?.toLowerCase().includes(search.toLowerCase()) ||
      car.vin?.toLowerCase().includes(search.toLowerCase()) ||
      car.owner?.name?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="relative py-12 lg:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-background to-background" />
        <div className="container relative">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-text-secondary bg-background-elevated border border-border hover:text-text-primary hover:border-primary/40 hover:bg-background-hover transition-all mb-6"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Admin
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-4">
              <Car className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-accent">Fleet Manager</span>
            </div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-2">
              All <span className="text-gradient-gold">Cars</span>
            </h1>
            <p className="text-text-secondary max-w-xl">
              Browse every tokenized vehicle on the platform.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container pb-16">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Cars', value: data?.total ?? 0, color: 'text-primary' },
            { label: 'Active', value: cars.filter((c) => c.status === 'active').length, color: 'text-success' },
            { label: 'Paused', value: cars.filter((c) => c.status === 'paused').length, color: 'text-warning' },
            { label: 'Retired', value: cars.filter((c) => c.status === 'retired').length, color: 'text-error' },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-2xl bg-surface border border-border">
              <p className="text-sm text-text-muted">{s.label}</p>
              <p className={`font-heading text-2xl font-bold font-mono ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Input
            placeholder="Search by car name, make, model, VIN, or owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            inputSize="lg"
            className="flex-1"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-12 px-4 rounded-xl bg-surface border border-border text-text-primary text-sm focus:outline-none focus:border-primary"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="retired">Retired</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Car className="h-12 w-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-muted">No cars found.</p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-border bg-surface overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-background-elevated/50">
                      <th className="text-left p-4 font-medium text-text-muted">ID</th>
                      <th className="text-left p-4 font-medium text-text-muted">Car</th>
                      <th className="text-left p-4 font-medium text-text-muted">Owner</th>
                      <th className="text-left p-4 font-medium text-text-muted">VIN</th>
                      <th className="text-right p-4 font-medium text-text-muted">Shares</th>
                      <th className="text-right p-4 font-medium text-text-muted">Price/Share</th>
                      <th className="text-left p-4 font-medium text-text-muted">Status</th>
                      <th className="text-left p-4 font-medium text-text-muted">Created</th>
                      <th className="text-right p-4 font-medium text-text-muted">View</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((car) => {
                      const statusInfo = STATUS_COLORS[car.status] ?? STATUS_COLORS.active;
                      return (
                        <tr key={car.id} className="hover:bg-background-elevated/30 transition-colors">
                          <td className="p-4 font-mono text-text-muted">
                            <span className="flex items-center gap-1">
                              <Hash className="h-3 w-3" />
                              {car.id}
                            </span>
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="font-medium text-text-primary">{car.name}</p>
                              <p className="text-xs text-text-muted">
                                {car.year} {car.make} {car.model}
                              </p>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1.5 text-text-secondary">
                              <User className="h-3.5 w-3.5" />
                              {car.owner?.name || 'Unknown'}
                            </div>
                          </td>
                          <td className="p-4 font-mono text-xs text-text-muted">
                            {car.vin?.slice(0, 11)}...
                          </td>
                          <td className="p-4 text-right font-mono text-text-primary">{car.totalShares}</td>
                          <td className="p-4 text-right font-mono text-text-primary">
                            <span className="flex items-center justify-end gap-1">
                              <DollarSign className="h-3 w-3" />
                              {weiToEth(car.pricePerShare)} ETH
                            </span>
                          </td>
                          <td className="p-4">
                            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                          </td>
                          <td className="p-4 text-xs text-text-muted">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(car.createdAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <Link to={`/car/${car.id}`}>
                              <Button size="sm" variant="ghost">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
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
                  Page {page} of {totalPages} ({data?.total ?? 0} cars)
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
