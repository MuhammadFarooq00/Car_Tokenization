import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Wrench, ChevronLeft, ChevronRight, Clock,
  Loader2, Search, DollarSign, Receipt, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useDriverExpenses } from '@/hooks/api/useDriverApi';
import { weiToEth } from '@/lib/utils';
import type { ApiExpense } from '@/types/api';

const EXPENSE_ICONS: Record<string, typeof Wrench> = {
  fuel: DollarSign,
  maintenance: Wrench,
  insurance: FileText,
  cleaning: Wrench,
};

function statusVariant(status: string): 'success' | 'error' | 'warning' | 'secondary' {
  switch (status) {
    case 'approved':
      return 'success';
    case 'rejected':
      return 'error';
    case 'pending':
      return 'warning';
    default:
      return 'secondary';
  }
}

export function AllExpenses() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const limit = 20;

  const { data: expensesResponse, isLoading } = useDriverExpenses({ page, limit });

  const expenses: ApiExpense[] = expensesResponse?.data ?? [];
  const totalItems = expensesResponse?.total ?? 0;
  const totalPages = Math.ceil(totalItems / limit);

  const filteredExpenses = search.trim()
    ? expenses.filter(
        (e) =>
          e.type.toLowerCase().includes(search.toLowerCase()) ||
          e.description?.toLowerCase().includes(search.toLowerCase()) ||
          e.car?.name?.toLowerCase().includes(search.toLowerCase()),
      )
    : expenses;

  const pageTotal = expenses.reduce((sum, e) => sum + BigInt(e.amount || '0'), 0n);
  const approved = expenses.filter((e) => e.status === 'approved').length;
  const pending = expenses.filter((e) => e.status === 'pending').length;

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
              <Receipt className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">All Expenses</span>
            </div>

            <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-2">
              Expense History
            </h1>
            <p className="text-text-secondary">
              View and search through all your submitted expenses.
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
            <p className="text-xs text-text-muted mt-1">Total Expenses</p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border text-center">
            <p className="text-2xl font-bold text-error font-mono">
              {pageTotal > 0n ? weiToEth(pageTotal.toString(), 4) : '0'} ETH
            </p>
            <p className="text-xs text-text-muted mt-1">Page Total</p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border text-center">
            <p className="text-2xl font-bold text-success font-mono">{approved}</p>
            <p className="text-xs text-text-muted mt-1">Approved</p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border text-center">
            <p className="text-2xl font-bold text-warning font-mono">{pending}</p>
            <p className="text-xs text-text-muted mt-1">Pending</p>
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
            placeholder="Search by type, description, or car name..."
            inputSize="lg"
            leftIcon={<Search className="h-5 w-5" />}
            className="max-w-md"
          />
        </motion.div>

        {/* Expenses List */}
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
            ) : filteredExpenses.length === 0 ? (
              <div className="p-12 text-center">
                <Receipt className="h-10 w-10 text-text-muted mx-auto mb-3" />
                <p className="text-text-muted">
                  {search ? 'No expenses match your search.' : 'No expenses submitted yet.'}
                </p>
                {!search && (
                  <Link to="/driver/log-expense">
                    <Button className="mt-4" size="sm">Log Expense</Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredExpenses.map((expense) => {
                  const Icon = EXPENSE_ICONS[expense.type] || Wrench;
                  return (
                    <div key={expense.id} className="p-5 hover:bg-background-elevated/50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background-elevated shrink-0">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-text-primary capitalize">
                              {expense.type}
                            </p>
                            <Badge variant={statusVariant(expense.status)} className="text-[10px] px-1.5 py-0">
                              {expense.status}
                            </Badge>
                            {expense.receipt && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                <Receipt className="h-2.5 w-2.5 mr-0.5" /> Receipt
                              </Badge>
                            )}
                          </div>

                          <p className="text-sm text-text-muted mb-1">
                            {expense.car?.name ?? `Car #${expense.carId}`}
                          </p>

                          {expense.description && (
                            <p className="text-sm text-text-secondary truncate mb-1">
                              {expense.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(expense.submittedAt).toLocaleDateString()}
                            </span>
                            {expense.approvedAt && (
                              <span className="text-success">
                                Approved {new Date(expense.approvedAt).toLocaleDateString()}
                              </span>
                            )}
                            {expense.receipt && (
                              <a
                                href={expense.receipt}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary hover:underline inline-flex items-center gap-1"
                              >
                                <FileText className="h-3 w-3" /> View Receipt
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-mono font-semibold text-error">
                            -{weiToEth(expense.amount)} ETH
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-border">
                <p className="text-sm text-text-muted">
                  Page {page} of {totalPages} ({totalItems} expenses)
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
