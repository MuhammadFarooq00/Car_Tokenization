import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, ChevronLeft, Check, X, Eye, FileText,
  Clock, CheckCircle2, XCircle, Search, AlertCircle, Mail, User, Calendar,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAdminPendingKYC, useReviewKYC } from '@/hooks/api/useAdminApi';
import type { ApiKYCVerification } from '@/types/api';

export function KYCManagement() {
  // API hooks
  const { data: kycData, isLoading } = useAdminPendingKYC({ page: 1, limit: 20 });
  const reviewKYC = useReviewKYC();

  const submissions: ApiKYCVerification[] = kycData?.data ?? [];

  // Local UI state
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<ApiKYCVerification | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const filteredSubmissions = submissions.filter((sub) => {
    if (filter !== 'all' && sub.status !== filter) return false;
    const name = sub.user?.name ?? '';
    if (searchQuery && !name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleVerify = (id: string) => {
    reviewKYC.mutate({ id, status: 'verified' }, {
      onSuccess: () => {
        setShowDetailModal(false);
        setSelectedSubmission(null);
      },
    });
  };

  const handleReject = (id: string) => {
    reviewKYC.mutate(
      { id, status: 'rejected', reviewNote: rejectionReason || 'Documents not acceptable' },
      {
        onSuccess: () => {
          setShowRejectModal(false);
          setShowDetailModal(false);
          setSelectedSubmission(null);
          setRejectionReason('');
        },
      },
    );
  };

  const openDetailModal = (sub: ApiKYCVerification) => {
    setSelectedSubmission(sub);
    setShowDetailModal(true);
  };

  const openRejectModal = (sub: ApiKYCVerification) => {
    setSelectedSubmission(sub);
    setShowRejectModal(true);
  };

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
              to="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-text-secondary bg-background-elevated border border-border hover:text-text-primary hover:border-primary/40 hover:bg-background-hover transition-all mb-6"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Admin
            </Link>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">KYC Management</span>
            </div>

            <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-2">
              KYC Verification
            </h1>
            <p className="text-text-secondary">
              Review and verify user identity documents for compliance.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container py-12">
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col md:flex-row gap-4 mb-8"
        >
          <div className="flex-1">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name..."
              inputSize="lg"
              leftIcon={<Search className="h-5 w-5" />}
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'pending', 'verified', 'rejected'] as const).map((status) => (
              <Button
                key={status}
                variant={filter === status ? 'default' : 'outline'}
                onClick={() => setFilter(status)}
                className="capitalize"
              >
                {status}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-warning" />
              <div>
                <p className="font-heading font-bold text-2xl text-warning">
                  {submissions.filter((s) => s.status === 'pending').length}
                </p>
                <p className="text-sm text-text-muted">Pending Review</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-success/10 border border-success/20">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <div>
                <p className="font-heading font-bold text-2xl text-success">
                  {submissions.filter((s) => s.status === 'verified').length}
                </p>
                <p className="text-sm text-text-muted">Verified</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-error/10 border border-error/20">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-error" />
              <div>
                <p className="font-heading font-bold text-2xl text-error">
                  {submissions.filter((s) => s.status === 'rejected').length}
                </p>
                <p className="text-sm text-text-muted">Rejected</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Submissions List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-2xl border border-border bg-surface overflow-hidden"
        >
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-text-secondary">Loading submissions...</span>
            </div>
          ) : (
          <div className="divide-y divide-border">
            {filteredSubmissions.map((sub) => (
              <div key={sub.id} className="p-6 hover:bg-background-elevated/50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Avatar & Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-background-elevated shrink-0 flex items-center justify-center">
                      <User className="h-6 w-6 text-text-muted" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-bold text-text-primary">{sub.user?.name ?? 'Unknown'}</p>
                      <p className="text-sm text-text-muted">{sub.user?.email ?? ''}</p>
                      {sub.user?.walletAddress && (
                        <p className="text-xs text-text-muted font-mono truncate mt-1">{sub.user.walletAddress}</p>
                      )}
                    </div>
                  </div>

                  {/* Document Type */}
                  <div className="flex flex-wrap gap-2 md:w-64">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-background-elevated text-xs text-text-muted"
                    >
                      <FileText className="h-3 w-3" />
                      {sub.documentType}
                    </span>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-4">
                    <Badge
                      variant={
                        sub.status === 'verified'
                          ? 'success'
                          : sub.status === 'rejected'
                          ? 'error'
                          : 'warning'
                      }
                    >
                      {sub.status}
                    </Badge>

                    {sub.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="success"
                          disabled={reviewKYC.isPending}
                          onClick={() => handleVerify(sub.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-error hover:bg-error/10"
                          onClick={() => openRejectModal(sub)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDetailModal(sub)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    <span className="text-xs text-text-muted">
                      {new Date(sub.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {sub.status === 'rejected' && sub.reviewNote && (
                  <div className="mt-4 p-3 rounded-lg bg-error/10 border border-error/20 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-error shrink-0 mt-0.5" />
                    <p className="text-sm text-error">{sub.reviewNote}</p>
                  </div>
                )}
              </div>
            ))}

            {filteredSubmissions.length === 0 && (
              <div className="p-12 text-center">
                <Shield className="h-12 w-12 text-text-muted mx-auto mb-4" />
                <p className="text-text-secondary">No submissions found</p>
              </div>
            )}
          </div>
          )}
        </motion.div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedSubmission && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-surface border border-border rounded-2xl shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-text-primary">KYC Submission</h3>
                    <p className="text-sm text-text-muted">Review user documents</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 rounded-lg hover:bg-background-elevated transition-colors"
                >
                  <X className="h-5 w-5 text-text-muted" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                {/* User Info */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-background-elevated border-2 border-border flex items-center justify-center">
                    <User className="h-7 w-7 text-text-muted" />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-lg text-text-primary">
                      {selectedSubmission.user?.name ?? 'Unknown'}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-text-muted">
                      <Mail className="h-4 w-4" />
                      {selectedSubmission.user?.email ?? ''}
                    </div>
                    {selectedSubmission.user?.walletAddress && (
                      <p className="text-xs text-text-muted font-mono truncate mt-1 max-w-[250px]">
                        {selectedSubmission.user.walletAddress}
                      </p>
                    )}
                  </div>
                </div>

                {/* Submission Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-background-elevated">
                    <div className="flex items-center gap-2 text-text-muted mb-1">
                      <Calendar className="h-4 w-4" />
                      <span className="text-xs">Submitted</span>
                    </div>
                    <p className="font-medium text-text-primary">
                      {new Date(selectedSubmission.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-background-elevated">
                    <div className="flex items-center gap-2 text-text-muted mb-1">
                      <User className="h-4 w-4" />
                      <span className="text-xs">Status</span>
                    </div>
                    <Badge
                      variant={
                        selectedSubmission.status === 'verified'
                          ? 'success'
                          : selectedSubmission.status === 'rejected'
                          ? 'error'
                          : 'warning'
                      }
                    >
                      {selectedSubmission.status}
                    </Badge>
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <h5 className="font-medium text-text-primary mb-3">Submitted Documents</h5>
                  <div className="space-y-2">
                    <div
                      className="flex items-center justify-between p-3 rounded-xl bg-background-elevated border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium text-text-primary">{selectedSubmission.documentType}</span>
                      </div>
                      {selectedSubmission.documentUrl && (
                        <Button size="sm" variant="ghost" asChild>
                          <a href={selectedSubmission.documentUrl} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                    {selectedSubmission.selfieUrl && (
                      <div
                        className="flex items-center justify-between p-3 rounded-xl bg-background-elevated border border-border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium text-text-primary">Selfie</span>
                        </div>
                        <Button size="sm" variant="ghost" asChild>
                          <a href={selectedSubmission.selfieUrl} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rejection Reason if rejected */}
                {selectedSubmission.status === 'rejected' && selectedSubmission.reviewNote && (
                  <div className="p-4 rounded-xl bg-error/10 border border-error/20">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-error shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-error">Rejection Reason</p>
                        <p className="text-sm text-error/80">{selectedSubmission.reviewNote}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer - Actions */}
              {selectedSubmission.status === 'pending' && (
                <div className="flex items-center gap-3 p-6 border-t border-border bg-background-elevated/50">
                  <Button
                    variant="outline"
                    className="flex-1 text-error border-error/30 hover:bg-error/10"
                    onClick={() => {
                      setShowDetailModal(false);
                      setShowRejectModal(true);
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    variant="success"
                    className="flex-1"
                    disabled={reviewKYC.isPending}
                    onClick={() => handleVerify(selectedSubmission.id)}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Verify
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && selectedSubmission && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowRejectModal(false);
              setRejectionReason('');
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-error/10">
                    <XCircle className="h-5 w-5 text-error" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-text-primary">Reject Submission</h3>
                    <p className="text-sm text-text-muted">Provide a reason for rejection</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                  className="p-2 rounded-lg hover:bg-background-elevated transition-colors"
                >
                  <X className="h-5 w-5 text-text-muted" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-background-elevated">
                  <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-text-muted" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">{selectedSubmission.user?.name ?? 'Unknown'}</p>
                    <p className="text-sm text-text-muted">{selectedSubmission.user?.email ?? ''}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Rejection Reason
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter the reason for rejecting this KYC submission..."
                    className="w-full h-32 px-4 py-3 rounded-xl bg-background border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
                  />
                </div>

                <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <p className="text-sm text-warning">
                    The user will be notified about this rejection and can resubmit their documents.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center gap-3 p-6 border-t border-border bg-background-elevated/50">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  className="flex-1 bg-error hover:bg-error/90"
                  disabled={reviewKYC.isPending}
                  onClick={() => handleReject(selectedSubmission.id)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Submission
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
