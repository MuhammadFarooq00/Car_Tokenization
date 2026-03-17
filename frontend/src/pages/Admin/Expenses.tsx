import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Receipt, ChevronLeft, ChevronRight, Loader2, Search,
  Check, X, DollarSign, Car, User, Calendar, FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAdminPendingExpenses, useReviewExpense } from '@/hooks/api/useAdminApi';

const STATUS_BADGE: Record<string, { variant: 'warning' | 'success' | 'error'; label: string }> = {
  pending: { variant: 'warning', label: 'Pending' },
  approved: { variant: 'success', label: 'Approved' },
  rejected: { variant: 'error', label: 'Rejected' },
};

const TYPE_LABELS: Record<string, string> = {
  fuel: 'Fuel',
  maintenance: 'Maintenance',
  cleaning: 'Cleaning',
  insurance: 'Insurance',
  other: 'Other',
};

export function ExpensesManagement() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useAdminPendingExpenses({ page, limit: 20 });
  const { mutate: reviewExpense, isPending: reviewing } = useReviewExpense();

  const expenses = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const filtered = search
    ? expenses.filter(
        (e) =>
          e.description?.toLowerCase().includes(search.toLowerCase()) ||
          e.submittedBy?.name?.toLowerCase().includes(search.toLowerCase()) ||
          e.car?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : expenses;

  const handleApprove = (id: string) => reviewExpense({ id, status: 'approved' });
  const handleReject = (id: string) => reviewExpense({ id, status: 'rejected' });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="relative py-12 lg:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-error/5 via-background to-background" />
        <div className="container relative">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-text-secondary bg-background-elevated border border-border hover:text-text-primary hover:border-primary/40 hover:bg-background-hover transition-all mb-6"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Admin
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-error/10 border border-error/20 mb-4">
              <Receipt className="h-4 w-4 text-error" />
              <span className="text-sm font-medium text-error">Expense Reviews</span>
            </div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-2">
              Pending <span className="text-gradient">Expenses</span>
            </h1>
            <p className="text-text-secondary max-w-xl">
              Review and approve or reject driver expense submissions.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container pb-16">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-surface border border-border">
            <p className="text-sm text-text-muted">Total Pending</p>
            <p className="font-heading text-2xl font-bold font-mono text-warning">
              {data?.total ?? 0}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-surface border border-border">
            <p className="text-sm text-text-muted">This Page</p>
            <p className="font-heading text-2xl font-bold font-mono text-text-primary">
              {filtered.length}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-surface border border-border">
            <p className="text-sm text-text-muted">Total Value</p>
            <p className="font-heading text-2xl font-bold font-mono text-primary">
              ${filtered.reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder="Search by description, submitter, or car..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            inputSize="lg"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Receipt className="h-12 w-12 text-text-muted mx-auto mb-4" />
            <p className="text-lg font-medium text-text-primary mb-1">No Pending Expenses</p>
            <p className="text-text-muted">All expense submissions have been reviewed.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {filtered.map((expense) => {
                const badge = STATUS_BADGE[expense.status] || STATUS_BADGE.pending;
                return (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-border bg-surface p-6 hover:border-border/80 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left: Info */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                          <Badge variant="secondary" className="gap-1">
                            <DollarSign className="h-3 w-3" />
                            {TYPE_LABELS[expense.type] || expense.type}
                          </Badge>
                          <span className="font-heading text-xl font-bold text-text-primary">
                            ${parseFloat(expense.amount).toFixed(2)}
                          </span>
                        </div>

                        {expense.description && (
                          <p className="text-sm text-text-secondary flex items-start gap-2">
                            <FileText className="h-4 w-4 mt-0.5 shrink-0" />
                            {expense.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-text-muted flex-wrap">
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {expense.submittedBy?.name || 'Unknown'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Car className="h-3.5 w-3.5" />
                            {expense.car?.name || `Car #${expense.carId}`}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(expense.submittedAt).toLocaleDateString()}
                          </span>
                        </div>

                        {expense.receipt && (
                          <a
                            href={expense.receipt}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <FileText className="h-3 w-3" /> View Receipt
                          </a>
                        )}
                      </div>

                      {/* Right: Actions */}
                      {expense.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="border border-error/30 text-error hover:bg-error/10"
                            onClick={() => handleReject(expense.id)}
                            disabled={reviewing}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleApprove(expense.id)}
                            disabled={reviewing}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-text-muted">
                  Page {page} of {totalPages} ({data?.total ?? 0} expenses)
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
