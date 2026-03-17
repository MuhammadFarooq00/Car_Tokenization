import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FileText, ChevronLeft, CheckCircle2, XCircle, Clock, Car,
  AlertCircle, Loader2, Calendar, Star, Eye, Shield, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMyApplications } from '@/hooks/api/useDriverApi';
import type { ApiDriverApplication } from '@/types/api';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api$/, '');

function resolveDocUrl(url: string) {
  if (!url || url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'approved':
      return (
        <Badge variant="success" className="inline-flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" /> Approved
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="error" className="inline-flex items-center gap-1">
          <XCircle className="h-3 w-3" /> Rejected
        </Badge>
      );
    default:
      return (
        <Badge variant="warning" className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" /> Pending Review
        </Badge>
      );
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'approved':
      return (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 border border-success/20 shrink-0">
          <CheckCircle2 className="h-6 w-6 text-success" />
        </div>
      );
    case 'rejected':
      return (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-error/10 border border-error/20 shrink-0">
          <XCircle className="h-6 w-6 text-error" />
        </div>
      );
    default:
      return (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10 border border-warning/20 shrink-0">
          <Clock className="h-6 w-6 text-warning" />
        </div>
      );
  }
}

export function MyApplications() {
  const { data: applications, isLoading } = useMyApplications();

  const pending = (applications ?? []).filter((a) => a.status === 'pending');
  const approved = (applications ?? []).filter((a) => a.status === 'approved');
  const rejected = (applications ?? []).filter((a) => a.status === 'rejected');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="relative py-12 lg:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-primary/5 via-background to-background" />
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

            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="font-heading text-3xl font-bold text-text-primary">
                  My Applications
                </h1>
                <p className="text-text-secondary">
                  Track the status of your driver applications
                </p>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex gap-4 mt-6">
              <div className="px-4 py-2 rounded-xl bg-warning/10 border border-warning/20">
                <span className="text-lg font-bold text-warning">{pending.length}</span>
                <span className="text-sm text-text-muted ml-2">Pending</span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-success/10 border border-success/20">
                <span className="text-lg font-bold text-success">{approved.length}</span>
                <span className="text-sm text-text-muted ml-2">Approved</span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-error/10 border border-error/20">
                <span className="text-lg font-bold text-error">{rejected.length}</span>
                <span className="text-sm text-text-muted ml-2">Rejected</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container py-8">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !applications || applications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <FileText className="h-16 w-16 mx-auto mb-4 text-text-muted opacity-30" />
            <h2 className="font-heading text-xl font-bold text-text-primary mb-2">
              No Applications Yet
            </h2>
            <p className="text-text-muted max-w-md mx-auto mb-6">
              You haven't applied to drive any cars yet. Browse available cars and submit an application to get started.
            </p>
            <Button asChild variant="glow">
              <Link to="/driver/apply" className="inline-flex items-center gap-2">
                <Car className="h-4 w-4" />
                Apply to Drive
              </Link>
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {(applications ?? []).map((app, index) => (
              <ApplicationStatusCard key={app.id} app={app} index={index} />
            ))}

            {/* Apply for more */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (applications?.length ?? 0) }}
              className="flex justify-center pt-4"
            >
              <Button asChild variant="outline" size="lg" className="inline-flex items-center gap-2">
                <Link to="/driver/apply">
                  <Car className="h-5 w-5" />
                  Apply for Another Car
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Application Status Card ──────────────────────────────────────

function ApplicationStatusCard({ app, index }: { app: ApiDriverApplication; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="rounded-2xl border border-border bg-surface overflow-hidden"
    >
      {/* Status bar at top */}
      <div
        className={`h-1 ${
          app.status === 'approved'
            ? 'bg-success'
            : app.status === 'rejected'
              ? 'bg-error'
              : 'bg-warning'
        }`}
      />

      <div className="p-6">
        <div className="flex items-start gap-4">
          <StatusIcon status={app.status} />

          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="font-heading font-bold text-lg text-text-primary flex items-center gap-2">
                  <Car className="h-5 w-5 text-accent" />
                  {app.car
                    ? `${app.car.name}`
                    : `Car #${app.carId}`}
                </h3>
                {app.car && (
                  <p className="text-sm text-text-muted mt-0.5">
                    {app.car.make} {app.car.model} {app.car.year}
                  </p>
                )}
              </div>
              <StatusBadge status={app.status} />
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-background-elevated">
                <p className="text-xs text-text-muted mb-0.5">License</p>
                <p className="font-mono text-sm font-medium text-text-primary">{app.license}</p>
              </div>
              <div className="p-3 rounded-xl bg-background-elevated">
                <p className="text-xs text-text-muted mb-0.5">Experience</p>
                <p className="text-sm font-medium text-text-primary flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-warning" />
                  {app.experience} years
                </p>
              </div>
              <div className="p-3 rounded-xl bg-background-elevated">
                <p className="text-xs text-text-muted mb-0.5">Applied</p>
                <p className="text-sm font-medium text-text-primary flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(app.submittedAt)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-background-elevated">
                <p className="text-xs text-text-muted mb-0.5">Updated</p>
                <p className="text-sm font-medium text-text-primary">
                  {app.reviewedAt ? timeAgo(app.reviewedAt) : 'Awaiting review'}
                </p>
              </div>
            </div>

            {/* Documents */}
            {app.documents && Object.keys(app.documents).length > 0 && (
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {Object.entries(app.documents).map(([key, url]) => (
                  <div
                    key={key}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background-elevated border border-border text-xs"
                  >
                    <Shield className="h-3 w-3 text-text-muted" />
                    <span className="text-text-secondary capitalize">{key.replace(/_/g, ' ')}</span>
                    {url && url !== 'uploaded' && (
                      <a
                        href={resolveDocUrl(url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline flex items-center gap-0.5"
                      >
                        <Eye className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Review note */}
            {app.reviewNote && (
              <div
                className={`p-4 rounded-xl border ${
                  app.status === 'approved'
                    ? 'bg-success/5 border-success/20'
                    : app.status === 'rejected'
                      ? 'bg-error/5 border-error/20'
                      : 'bg-info/5 border-info/20'
                }`}
              >
                <div className="flex items-start gap-2">
                  <AlertCircle
                    className={`h-4 w-4 mt-0.5 shrink-0 ${
                      app.status === 'approved'
                        ? 'text-success'
                        : app.status === 'rejected'
                          ? 'text-error'
                          : 'text-info'
                    }`}
                  />
                  <div>
                    <p className="text-xs font-medium text-text-muted mb-0.5">Review Note</p>
                    <p className="text-sm text-text-secondary">{app.reviewNote}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Pending message */}
            {app.status === 'pending' && (
              <div className="p-4 rounded-xl bg-warning/5 border border-warning/20">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-warning" />
                  <p className="text-sm text-warning">
                    Your application is being reviewed by the car owner. You'll be notified once a decision is made.
                  </p>
                </div>
              </div>
            )}

            {/* Approved next steps */}
            {app.status === 'approved' && (
              <div className="flex gap-3 mt-2">
                <Button asChild variant="success" size="sm" className="inline-flex items-center gap-1">
                  <Link to="/driver/log-ride">
                    <Car className="h-4 w-4" />
                    Start Driving
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="inline-flex items-center gap-1">
                  <Link to="/dashboard">
                    <ChevronRight className="h-4 w-4" />
                    Go to Dashboard
                  </Link>
                </Button>
              </div>
            )}

            {/* Rejected — apply again */}
            {app.status === 'rejected' && (
              <div className="mt-2">
                <Button asChild variant="outline" size="sm" className="inline-flex items-center gap-1">
                  <Link to="/driver/apply">
                    <Car className="h-4 w-4" />
                    Apply for Another Car
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
