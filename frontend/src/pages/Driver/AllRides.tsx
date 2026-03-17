import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Navigation, MapPin, Clock, ChevronLeft, ChevronRight,
  Car, Loader2, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useDriverRides } from '@/hooks/api/useDriverApi';
import { weiToEth } from '@/lib/utils';

export function AllRides() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const limit = 20;

  const { data: ridesResponse, isLoading } = useDriverRides({ page, limit });

  const rides = ridesResponse?.data ?? [];
  const totalItems = ridesResponse?.total ?? 0;
  const totalPages = Math.ceil(totalItems / limit);

  const filteredRides = search.trim()
    ? rides.filter(
        (r) =>
          r.pickup.toLowerCase().includes(search.toLowerCase()) ||
          r.dropoff.toLowerCase().includes(search.toLowerCase()) ||
          r.car?.name?.toLowerCase().includes(search.toLowerCase()),
      )
    : rides;

  // Compute page totals
  const pageEarnings = rides.reduce((sum, r) => sum + BigInt(r.grossEarnings || '0'), 0n);
  const pageDistance = rides.reduce((sum, r) => sum + (r.distance || 0), 0);
  const pageDuration = rides.reduce((sum, r) => sum + (r.duration || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <section className="relative py-12 lg:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-text-secondary bg-background-elevated border border-border hover:text-text-primary hover:border-primary/40 hover:bg-background-hover transition-all mb-6"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Navigation className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">All Rides</span>
            </div>

            <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-2">
              Ride History
            </h1>
            <p className="text-text-secondary">
              View and search through all your completed rides.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container py-12">
        {/* Summary stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="p-4 rounded-xl bg-surface border border-border text-center">
            <p className="text-2xl font-bold text-text-primary font-mono">{totalItems}</p>
            <p className="text-xs text-text-muted mt-1">Total Rides</p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border text-center">
            <p className="text-2xl font-bold text-success font-mono">
              {pageEarnings > 0n ? weiToEth(pageEarnings.toString(), 4) : '0'} ETH
            </p>
            <p className="text-xs text-text-muted mt-1">Page Gross Fares</p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border text-center">
            <p className="text-2xl font-bold text-primary font-mono">{pageDistance.toFixed(1)} km</p>
            <p className="text-xs text-text-muted mt-1">Page Distance</p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border text-center">
            <p className="text-2xl font-bold text-info font-mono">{(pageDuration / 60).toFixed(1)}h</p>
            <p className="text-xs text-text-muted mt-1">Page Hours</p>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-6"
        >
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by location or car name..."
            inputSize="lg"
            leftIcon={<Search className="h-5 w-5" />}
            className="max-w-md"
          />
        </motion.div>

        {/* Rides List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="rounded-2xl border border-border bg-surface overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              </div>
            ) : filteredRides.length === 0 ? (
              <div className="p-12 text-center">
                <Navigation className="h-10 w-10 text-text-muted mx-auto mb-3" />
                <p className="text-text-muted">
                  {search ? 'No rides match your search.' : 'No rides logged yet.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredRides.map((ride) => (
                  <div key={ride.id} className="p-5 hover:bg-background-elevated/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background-elevated shrink-0">
                        <MapPin className="h-6 w-6 text-primary" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-text-primary">
                            {ride.car?.name ?? `Car #${ride.carId}`}
                          </p>
                          <Badge
                            variant={ride.status === 'completed' ? 'success' : 'warning'}
                            className="text-[10px] px-1.5 py-0"
                          >
                            {ride.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-text-muted truncate mb-1.5">
                          {ride.pickup} → {ride.dropoff}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
                          <span className="inline-flex items-center gap-1">
                            <Navigation className="h-3 w-3" /> {ride.distance} km
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {ride.duration} min
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Car className="h-3 w-3" /> {new Date(ride.timestamp).toLocaleDateString()}
                          </span>
                          <span className="text-text-muted">
                            {new Date(ride.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-mono font-semibold text-success">+{weiToEth(ride.grossEarnings)} ETH</p>
                        <p className="text-xs text-text-muted mt-1">
                          Yours: {weiToEth(ride.netEarnings)} ETH
                        </p>
                        <p className="text-xs text-error">
                          Fee: -{weiToEth(ride.commission)} ETH
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-border">
                <p className="text-sm text-text-muted">
                  Page {page} of {totalPages} ({totalItems} rides)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
