import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList, ChevronLeft, Check, X, TrendingUp, Car, Gauge,
  Clock, User, Mail, Search, AlertCircle, Loader2, CheckCircle2, XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAdminPendingOnboarding, useReviewOnboardingRole } from '@/hooks/api/useAdminApi';
import type { ApiUser } from '@/types/api';

// ─── Role display config ─────────────────────────────────────────────────────

const ROLE_CONFIG: Record<string, {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}> = {
  car_owner: {
    label: 'Car Owner',
    icon: Car,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/20',
  },
  driver: {
    label: 'Driver',
    icon: Gauge,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10 border-purple-500/20',
  },
};

// ─── Role badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const config = ROLE_CONFIG[role];
  if (!config) return null;
  const Icon = config.icon;
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border',
      config.bgColor, config.color,
    )}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

// ─── Review modal ─────────────────────────────────────────────────────────────

interface ReviewModalProps {
  user: ApiUser;
  role: string;
  decision: 'approved' | 'rejected';
  onConfirm: (note: string) => void;
  onClose: () => void;
  isPending: boolean;
}

function ReviewModal({ user, role, decision, onConfirm, onClose, isPending }: ReviewModalProps) {
  const [note, setNote] = useState('');
  const config = ROLE_CONFIG[role];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl border',
            decision === 'approved' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20',
          )}>
            {decision === 'approved'
              ? <Check className="h-5 w-5 text-emerald-400" />
              : <X className="h-5 w-5 text-red-400" />
            }
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">
              {decision === 'approved' ? 'Approve' : 'Reject'} Role Request
            </h3>
            <p className="text-xs text-text-muted">
              {config?.label} role for {user.name}
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-background-elevated border border-border">
          <p className="text-sm text-text-secondary">
            {decision === 'approved'
              ? `This will grant ${user.name} the "${config?.label}" role immediately. They'll receive a notification.`
              : `This will reject the "${config?.label}" role request for ${user.name}. The role will be removed from their pending list.`
            }
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            {decision === 'approved' ? 'Note (optional)' : 'Rejection reason (optional)'}
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={decision === 'approved'
              ? 'Add a welcome note...'
              : 'Explain why the request was rejected...'}
            rows={3}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant={decision === 'approved' ? 'default' : 'destructive'}
            className="flex-1"
            onClick={() => onConfirm(note)}
            disabled={isPending}
          >
            {isPending
              ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
              : decision === 'approved'
                ? <Check className="h-4 w-4 mr-2" />
                : <X className="h-4 w-4 mr-2" />
            }
            {decision === 'approved' ? 'Approve' : 'Reject'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── User row ─────────────────────────────────────────────────────────────────

interface UserRowProps {
  user: ApiUser;
  onReview: (user: ApiUser, role: string, decision: 'approved' | 'rejected') => void;
}

function UserRow({ user, onReview }: UserRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border border-border rounded-xl p-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* User info */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-text-primary truncate">{user.name}</p>
            {user.email && (
              <div className="flex items-center gap-1 mt-0.5">
                <Mail className="h-3 w-3 text-text-muted" />
                <p className="text-xs text-text-muted truncate">{user.email}</p>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {/* Current roles (investor shown as badge) */}
              {user.roles.includes('investor') && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400">
                  <TrendingUp className="h-2.5 w-2.5" />
                  Investor
                </span>
              )}
              {user.roles.filter(r => r !== 'investor' && r !== 'admin').map(r => (
                <RoleBadge key={r} role={r} />
              ))}
            </div>
            <div className="flex items-center gap-1 mt-1.5">
              <Clock className="h-3 w-3 text-text-muted" />
              <p className="text-[11px] text-text-muted">
                Registered {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Pending role requests */}
        <div className="flex flex-col gap-2 sm:min-w-[280px]">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Pending Requests</p>
          {user.pendingRoles.map((role) => {
            const config = ROLE_CONFIG[role];
            if (!config) return null;
            return (
              <div key={role} className={cn(
                'flex items-center justify-between gap-3 p-3 rounded-xl border',
                config.bgColor,
              )}>
                <div className="flex items-center gap-2">
                  <config.icon className={cn('h-4 w-4', config.color)} />
                  <span className={cn('text-sm font-medium', config.color)}>{config.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onReview(user, role, 'approved')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-medium transition-colors"
                    title="Approve"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Approve
                  </button>
                  <button
                    onClick={() => onReview(user, role, 'rejected')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs font-medium transition-colors"
                    title="Reject"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function OnboardingManagement() {
  const { data, isLoading } = useAdminPendingOnboarding({ page: 1, limit: 50 });
  const reviewRole = useReviewOnboardingRole();

  const users: ApiUser[] = data?.data ?? [];

  const [search, setSearch] = useState('');
  const [modalState, setModalState] = useState<{
    user: ApiUser;
    role: string;
    decision: 'approved' | 'rejected';
  } | null>(null);

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      (u.email ?? '').toLowerCase().includes(q)
    );
  });

  const handleOpenModal = (user: ApiUser, role: string, decision: 'approved' | 'rejected') => {
    setModalState({ user, role, decision });
  };

  const handleConfirm = (note: string) => {
    if (!modalState) return;
    reviewRole.mutate(
      {
        userId: modalState.user.id,
        role: modalState.role,
        decision: modalState.decision,
        reviewNote: note || undefined,
      },
      { onSuccess: () => setModalState(null) },
    );
  };

  const totalPending = users.reduce((sum, u) => sum + u.pendingRoles.length, 0);

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
            className="max-w-4xl"
          >
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Admin Hub
            </Link>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                <ClipboardList className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h1 className="font-heading text-3xl font-bold text-text-primary">
                  Onboarding Requests
                </h1>
                <p className="text-text-secondary mt-1">
                  Review and approve role requests submitted during user onboarding
                </p>
              </div>
            </div>

            {/* Stats bar */}
            <div className="flex flex-wrap gap-4 mt-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl">
                <Clock className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-medium text-text-primary">{totalPending}</span>
                <span className="text-sm text-text-muted">pending request{totalPending !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl">
                <User className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-text-primary">{users.length}</span>
                <span className="text-sm text-text-muted">user{users.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="container pb-16">
        {/* Search */}
        <div className="relative max-w-sm mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface border border-border mb-4">
              <AlertCircle className="h-8 w-8 text-text-muted" />
            </div>
            <h3 className="font-semibold text-text-primary mb-1">
              {search ? 'No matching requests' : 'No pending requests'}
            </h3>
            <p className="text-sm text-text-muted max-w-xs">
              {search
                ? 'Try adjusting your search query.'
                : 'All onboarding role requests have been reviewed.'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filtered.map((user) => (
              <UserRow key={user.id} user={user} onReview={handleOpenModal} />
            ))}
          </div>
        )}
      </section>

      {/* Review Modal */}
      <AnimatePresence>
        {modalState && (
          <ReviewModal
            user={modalState.user}
            role={modalState.role}
            decision={modalState.decision}
            onConfirm={handleConfirm}
            onClose={() => setModalState(null)}
            isPending={reviewRole.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
