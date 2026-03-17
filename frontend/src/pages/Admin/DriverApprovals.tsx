import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, ChevronLeft, Check, X, Eye, FileText, Car,
  Clock, CheckCircle2, XCircle, Search, Shield, Calendar, Mail, Phone, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAdminPendingApplications, useReviewApplication } from '@/hooks/api/useAdminApi';
import type { ApiDriverApplication } from '@/types/api';


export function DriverApprovals() {
  const { data: response, isLoading } = useAdminPendingApplications({ page: 1, limit: 20 });
  const reviewApp = useReviewApplication();

  const applications = useMemo<ApiDriverApplication[]>(() => response?.data ?? [], [response]);

  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<ApiDriverApplication | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const filteredApps = useMemo(() => applications.filter((app) => {
    if (filter !== 'all' && app.status !== filter) return false;
    const name = app.user?.name ?? '';
    if (searchQuery && !name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }), [applications, filter, searchQuery]);

  const pendingCount = useMemo(() => applications.filter((a) => a.status === 'pending').length, [applications]);
  const approvedCount = useMemo(() => applications.filter((a) => a.status === 'approved').length, [applications]);
  const rejectedCount = useMemo(() => applications.filter((a) => a.status === 'rejected').length, [applications]);

  const handleApprove = (id: string) => {
    reviewApp.mutate({ id, status: 'approved' }, {
      onSuccess: () => {
        setShowDetailModal(false);
        setSelectedApp(null);
      },
    });
  };

  const handleReject = (id: string) => {
    reviewApp.mutate({ id, status: 'rejected', reviewNote: 'Application rejected by admin' }, {
      onSuccess: () => {
        setShowDetailModal(false);
        setSelectedApp(null);
      },
    });
  };

  const openDetailModal = (app: ApiDriverApplication) => {
    setSelectedApp(app);
    setShowDetailModal(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <section className="relative py-12 lg:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-background to-background" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

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

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-4">
              <Users className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-accent">Driver Approvals</span>
            </div>

            <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-2">
              Driver Applications
            </h1>
            <p className="text-text-secondary">
              Review and manage driver applications for the platform.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container py-12">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
            <p className="text-text-secondary">Loading applications...</p>
          </div>
        )}

        {!isLoading && <>
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
            {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
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
                  {pendingCount}
                </p>
                <p className="text-sm text-text-muted">Pending</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-success/10 border border-success/20">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <div>
                <p className="font-heading font-bold text-2xl text-success">
                  {approvedCount}
                </p>
                <p className="text-sm text-text-muted">Approved</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-error/10 border border-error/20">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-error" />
              <div>
                <p className="font-heading font-bold text-2xl text-error">
                  {rejectedCount}
                </p>
                <p className="text-sm text-text-muted">Rejected</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Applications List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-2xl border border-border bg-surface overflow-hidden"
        >
          <div className="divide-y divide-border">
            {filteredApps.map((app) => (
              <div key={app.id} className="p-6 hover:bg-background-elevated/50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Avatar & Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background-elevated shrink-0">
                      <Users className="h-6 w-6 text-text-muted" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-bold text-text-primary">{app.user?.name ?? 'Unknown'}</p>
                      <p className="text-sm text-text-muted">{app.user?.email ?? ''}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-text-muted">
                          <FileText className="h-3 w-3 inline mr-1" />
                          {app.license}
                        </span>
                        <span className="text-xs text-text-muted">
                          {app.experience} years exp.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Car */}
                  <div className="flex items-center gap-3 md:w-64">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background-elevated shrink-0">
                      <Car className="h-5 w-5 text-text-muted" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary truncate">{`Car #${app.carId}`}</p>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-4">
                    <Badge
                      variant={
                        app.status === 'approved'
                          ? 'success'
                          : app.status === 'rejected'
                          ? 'error'
                          : 'warning'
                      }
                    >
                      {app.status}
                    </Badge>

                    {app.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleApprove(app.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-error hover:bg-error/10"
                          onClick={() => handleReject(app.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDetailModal(app)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    <span className="text-xs text-text-muted">{new Date(app.submittedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}

            {filteredApps.length === 0 && (
              <div className="p-12 text-center">
                <Users className="h-12 w-12 text-text-muted mx-auto mb-4" />
                <p className="text-text-secondary">No applications found</p>
              </div>
            )}
          </div>
        </motion.div>
        </>}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedApp && (
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
              transition={{ duration: 0.2 }}
              className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-surface rounded-2xl border border-border shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-border bg-surface">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background-elevated">
                    <Users className="h-6 w-6 text-text-muted" />
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-xl text-text-primary">{selectedApp.user?.name ?? 'Unknown'}</h2>
                    <p className="text-sm text-text-muted">Driver Application</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 rounded-lg hover:bg-background-hover transition-colors"
                >
                  <X className="h-5 w-5 text-text-muted" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-background-elevated/50 border border-border">
                    <Mail className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-text-muted">Email</p>
                      <p className="text-sm font-medium text-text-primary">{selectedApp.user?.email ?? ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-background-elevated/50 border border-border">
                    <Phone className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-text-muted">Phone</p>
                      <p className="text-sm font-medium text-text-primary">--</p>
                    </div>
                  </div>
                </div>

                {/* Experience & Submitted Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <p className="text-2xl font-bold text-primary">{selectedApp.experience}</p>
                    <p className="text-xs text-text-muted">Years Experience</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-accent/5 border border-accent/20">
                    <Calendar className="h-5 w-5 text-accent mx-auto mb-1" />
                    <p className="text-xs text-text-muted">{new Date(selectedApp.submittedAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* License Info */}
                <div className="p-4 rounded-xl bg-background-elevated border border-border">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="h-5 w-5 text-success" />
                    <p className="font-medium text-text-primary">Driver License</p>
                  </div>
                  <p className="text-sm text-text-secondary font-mono">{selectedApp.license}</p>
                </div>

                {/* Requested Car */}
                <div className="p-4 rounded-xl bg-background-elevated border border-border">
                  <div className="flex items-center gap-3 mb-3">
                    <Car className="h-5 w-5 text-accent" />
                    <p className="font-medium text-text-primary">Requested Vehicle</p>
                  </div>
                  <p className="text-sm text-text-primary">{`Car #${selectedApp.carId}`}</p>
                </div>

                {/* Documents */}
                <div>
                  <p className="font-medium text-text-primary mb-3">Submitted Documents</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(selectedApp.documents).map((key) => (
                      <Badge key={key} variant="default" className="gap-1">
                        <FileText className="h-3 w-3" />
                        {key}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Current Status */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-background-elevated border border-border">
                  <span className="text-sm text-text-muted">Current Status</span>
                  <Badge
                    variant={
                      selectedApp.status === 'approved'
                        ? 'success'
                        : selectedApp.status === 'rejected'
                        ? 'error'
                        : 'warning'
                    }
                    size="lg"
                  >
                    {selectedApp.status}
                  </Badge>
                </div>
              </div>

              {/* Modal Footer */}
              {selectedApp.status === 'pending' && (
                <div className="sticky bottom-0 flex items-center gap-3 p-6 border-t border-border bg-surface">
                  <Button
                    variant="outline"
                    className="flex-1 text-error border-error/30 hover:bg-error/10"
                    onClick={() => handleReject(selectedApp.id)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject Application
                  </Button>
                  <Button
                    variant="success"
                    className="flex-1"
                    onClick={() => handleApprove(selectedApp.id)}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve Application
                  </Button>
                </div>
              )}

              {selectedApp.status !== 'pending' && (
                <div className="flex items-center justify-end p-6 border-t border-border">
                  <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                    Close
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
