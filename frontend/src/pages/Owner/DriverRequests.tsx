import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Users, ChevronLeft, CheckCircle2, XCircle, Clock, FileText,
  Loader2, X, Eye, Shield, Calendar, Car, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApplicationsForMyCars, useReviewDriverApplication } from '@/hooks/api/useDriverApi';
import type { ApiDriverApplication } from '@/types/api';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api$/, '');

function resolveDocUrl(url: string) {
  if (!url || url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

function statusBadge(status: string) {
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
          <Clock className="h-3 w-3" /> Pending
        </Badge>
      );
  }
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

export function DriverRequests() {
  const { data: response, isLoading } = useApplicationsForMyCars({ page: 1, limit: 50 });
  const reviewMutation = useReviewDriverApplication();
  const [selectedApp, setSelectedApp] = useState<ApiDriverApplication | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  const applications: ApiDriverApplication[] = response?.data ?? [];
  const pending = applications.filter((a) => a.status === 'pending');
  const reviewed = applications.filter((a) => a.status !== 'pending');

  const handleReview = (id: string, status: 'approved' | 'rejected') => {
    reviewMutation.mutate(
      { id, status, reviewNote: reviewNote.trim() || undefined },
      {
        onSuccess: () => {
          setSelectedApp(null);
          setReviewNote('');
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="relative py-12 lg:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-accent/5 via-background to-background" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

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
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h1 className="font-heading text-3xl font-bold text-text-primary">
                  Driver Requests
                </h1>
                <p className="text-text-secondary">
                  Review and manage driver applications for your fleet
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-4 mt-6">
              <div className="px-4 py-2 rounded-xl bg-warning/10 border border-warning/20">
                <span className="text-lg font-bold text-warning">{pending.length}</span>
                <span className="text-sm text-text-muted ml-2">Pending</span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-success/10 border border-success/20">
                <span className="text-lg font-bold text-success">
                  {applications.filter((a) => a.status === 'approved').length}
                </span>
                <span className="text-sm text-text-muted ml-2">Approved</span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-error/10 border border-error/20">
                <span className="text-lg font-bold text-error">
                  {applications.filter((a) => a.status === 'rejected').length}
                </span>
                <span className="text-sm text-text-muted ml-2">Rejected</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container py-8">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : applications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Users className="h-16 w-16 mx-auto mb-4 text-text-muted opacity-30" />
            <h2 className="font-heading text-xl font-bold text-text-primary mb-2">
              No Driver Applications Yet
            </h2>
            <p className="text-text-muted max-w-md mx-auto">
              When drivers apply to drive one of your cars, their applications will appear here.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {/* Pending Applications */}
            {pending.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="font-heading font-bold text-lg text-text-primary mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-warning" />
                  Pending Review ({pending.length})
                </h2>
                <div className="space-y-4">
                  {pending.map((app) => (
                    <ApplicationCard
                      key={app.id}
                      app={app}
                      onViewDetails={() => setSelectedApp(app)}
                      onApprove={() => handleReview(app.id, 'approved')}
                      onReject={() => setSelectedApp(app)} // open modal for note
                      isReviewing={reviewMutation.isPending}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Reviewed Applications */}
            {reviewed.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <h2 className="font-heading font-bold text-lg text-text-primary mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-text-muted" />
                  Previously Reviewed ({reviewed.length})
                </h2>
                <div className="space-y-4">
                  {reviewed.map((app) => (
                    <ApplicationCard
                      key={app.id}
                      app={app}
                      onViewDetails={() => setSelectedApp(app)}
                      isReviewing={false}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Details / Review Modal */}
      <AnimatePresence>
        {selectedApp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => { setSelectedApp(null); setReviewNote(''); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-surface rounded-2xl border border-border shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-border bg-surface">
                <div>
                  <h2 className="font-heading font-bold text-xl text-text-primary">
                    Application Details
                  </h2>
                  <p className="text-sm text-text-muted mt-1">
                    {selectedApp.car?.name ?? `Car #${selectedApp.carId}`}
                  </p>
                </div>
                <button
                  onClick={() => { setSelectedApp(null); setReviewNote(''); }}
                  className="p-2 rounded-lg hover:bg-background-hover transition-colors"
                >
                  <X className="h-5 w-5 text-text-muted" />
                </button>
              </div>

              {/* Applicant Info */}
              <div className="p-6 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 border border-accent/20 shrink-0">
                    {selectedApp.user?.avatar ? (
                      <img
                        src={resolveDocUrl(selectedApp.user.avatar)}
                        alt={selectedApp.user.name}
                        className="h-14 w-14 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-xl font-bold text-accent">
                        {selectedApp.user?.name?.charAt(0) ?? '?'}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-lg text-text-primary">
                      {selectedApp.user?.name ?? 'Unknown'}
                    </h3>
                    <p className="text-sm text-text-muted">{selectedApp.user?.email ?? ''}</p>
                    <div className="flex items-center gap-3 mt-2">
                      {statusBadge(selectedApp.status)}
                      <span className="text-xs text-text-muted flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Applied {timeAgo(selectedApp.submittedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-background-elevated">
                    <p className="text-xs text-text-muted mb-1">License Number</p>
                    <p className="font-mono font-medium text-text-primary">{selectedApp.license}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-background-elevated">
                    <p className="text-xs text-text-muted mb-1">Experience</p>
                    <p className="font-mono font-medium text-text-primary flex items-center gap-1">
                      <Star className="h-4 w-4 text-warning" />
                      {selectedApp.experience} years
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-background-elevated col-span-2">
                    <p className="text-xs text-text-muted mb-1">Applying for</p>
                    <p className="font-medium text-text-primary flex items-center gap-2">
                      <Car className="h-4 w-4 text-accent" />
                      {selectedApp.car
                        ? `${selectedApp.car.name} (${selectedApp.car.make} ${selectedApp.car.model} ${selectedApp.car.year})`
                        : `Car #${selectedApp.carId}`}
                    </p>
                  </div>
                </div>

                {/* Documents */}
                {selectedApp.documents && Object.keys(selectedApp.documents).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-text-muted mb-3">Uploaded Documents</h4>
                    <div className="space-y-2">
                      {Object.entries(selectedApp.documents).map(([key, url]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between p-3 rounded-xl bg-background-elevated border border-border"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-text-muted" />
                            <span className="text-sm text-text-primary capitalize">
                              {key.replace(/_/g, ' ')}
                            </span>
                          </div>
                          {url && url !== 'uploaded' && (
                            <a
                              href={resolveDocUrl(url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-accent hover:underline flex items-center gap-1"
                            >
                              <Eye className="h-3 w-3" />
                              View
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Review Note (if already reviewed) */}
                {selectedApp.reviewNote && (
                  <div className="p-4 rounded-xl bg-info/10 border border-info/20">
                    <p className="text-sm font-medium text-info mb-1">Review Note</p>
                    <p className="text-sm text-text-secondary">{selectedApp.reviewNote}</p>
                  </div>
                )}

                {/* Review Actions (only for pending) */}
                {selectedApp.status === 'pending' && (
                  <div className="space-y-4 pt-4 border-t border-border">
                    <div>
                      <label className="text-sm font-medium text-text-muted block mb-2">
                        Review Note (optional)
                      </label>
                      <textarea
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                        placeholder="Add a note for the applicant..."
                        rows={3}
                        className="w-full rounded-xl border border-border bg-background-elevated px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="success"
                        className="flex-1 inline-flex items-center justify-center gap-2"
                        onClick={() => handleReview(selectedApp.id, 'approved')}
                        isLoading={reviewMutation.isPending}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Approve Driver
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 inline-flex items-center justify-center gap-2 text-error border-error/30 hover:bg-error/10"
                        onClick={() => handleReview(selectedApp.id, 'rejected')}
                        isLoading={reviewMutation.isPending}
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Application Card ─────────────────────────────────────────────

function ApplicationCard({
  app,
  onViewDetails,
  onApprove,
  onReject,
  isReviewing,
}: {
  app: ApiDriverApplication;
  onViewDetails: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  isReviewing: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 hover:border-accent/30 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          {/* Avatar */}
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 border border-accent/20 shrink-0">
            <span className="text-lg font-bold text-accent">
              {app.user?.name?.charAt(0) ?? '?'}
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-heading font-bold text-text-primary">
                {app.user?.name ?? 'Unknown'}
              </h3>
              {statusBadge(app.status)}
            </div>
            <p className="text-sm text-text-muted mt-0.5">{app.user?.email}</p>

            {/* Car + meta */}
            <div className="flex items-center gap-4 mt-2 text-sm text-text-secondary">
              <span className="flex items-center gap-1">
                <Car className="h-3.5 w-3.5 text-accent" />
                {app.car?.name ?? `Car #${app.carId}`}
              </span>
              <span className="flex items-center gap-1">
                <Shield className="h-3.5 w-3.5" />
                {app.experience} yrs exp
              </span>
              <span className="flex items-center gap-1 text-text-muted">
                <Calendar className="h-3.5 w-3.5" />
                {timeAgo(app.submittedAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={onViewDetails} className="inline-flex items-center gap-1">
            <Eye className="h-4 w-4" />
            Details
          </Button>
          {app.status === 'pending' && onApprove && onReject && (
            <>
              <Button
                variant="success"
                size="sm"
                onClick={onApprove}
                disabled={isReviewing}
                className="inline-flex items-center gap-1"
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onReject}
                disabled={isReviewing}
                className="inline-flex items-center gap-1 text-error border-error/30 hover:bg-error/10"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
