import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Fuel, Wrench, ChevronLeft, ChevronRight, Upload,
  Car, CheckCircle2, Plus, DollarSign, Calendar,
  FileText, X, Loader2, ImageIcon, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useDriverProfile, useDriverExpenses, useSubmitExpense } from '@/hooks/api/useDriverApi';
import { api } from '@/lib/api-client';
import type { ExpenseType } from '@/types/api';
import { weiToEth } from '@/lib/utils';

const EXPENSE_TYPES = [
  { id: 'fuel', label: 'Fuel', icon: Fuel, color: 'warning' },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench, color: 'info' },
  { id: 'cleaning', label: 'Cleaning', icon: Car, color: 'success' },
  { id: 'other', label: 'Other', icon: DollarSign, color: 'primary' },
];

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function LogExpense() {
  const [selectedCar, setSelectedCar] = useState<number | null>(null);
  const [expenseType, setExpenseType] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: driverProfile } = useDriverProfile();
  const { data: expensesResponse } = useDriverExpenses({ page: 1, limit: 5 });
  const submitExpense = useSubmitExpense();

  const assignedCars = driverProfile?.assignedCar ? [driverProfile.assignedCar] : [];
  const recentExpenses = expensesResponse?.data ?? [];

  // ─── File selection & validation ───────────────────────────────────────────
  const handleFileSelect = useCallback((file: File) => {
    setUploadError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Only images (JPEG, PNG, GIF, WebP) and PDF files are allowed.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`File too large (${formatFileSize(file.size)}). Maximum is 10 MB.`);
      return;
    }

    setReceiptFile(file);

    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setReceiptPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview(null); // PDF — no image preview
    }
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
      // Reset input so same file can be re-selected
      e.target.value = '';
    },
    [handleFileSelect],
  );

  const handleRemoveFile = useCallback(() => {
    setReceiptFile(null);
    setReceiptPreview(null);
    setUploadError(null);
  }, []);

  // ─── Drag & drop ──────────────────────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  // ─── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedCar || !expenseType || !amount) return;
    setIsSubmitting(true);
    try {
      let receiptUrl: string | undefined;

      // 1. Upload receipt file first (if any)
      if (receiptFile) {
        setIsUploading(true);
        try {
          const uploadResult = await api.uploadFile<{ url: string }>(
            '/uploads/receipt',
            receiptFile,
          );
          receiptUrl = uploadResult.url;
        } catch (err) {
          console.error('Receipt upload failed:', err);
          setUploadError('Failed to upload receipt. Please try again.');
          setIsSubmitting(false);
          setIsUploading(false);
          return;
        } finally {
          setIsUploading(false);
        }
      }

      // 2. Submit expense with receipt URL
      const amountWei = (parseFloat(amount) * 1e18).toFixed(0);
      await submitExpense.mutateAsync({
        carId: selectedCar,
        type: expenseType as ExpenseType,
        amount: amountWei,
        description: description || undefined,
        receipt: receiptUrl,
      });

      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setSelectedCar(null);
        setExpenseType(null);
        setAmount('');
        setDescription('');
        setReceiptFile(null);
        setReceiptPreview(null);
        setUploadError(null);
      }, 3000);
    } catch (err) {
      console.error('Failed to submit expense:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <section className="relative py-12 lg:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-warning/5 via-background to-background" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-warning/10 rounded-full blur-3xl" />

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

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warning/10 border border-warning/20 mb-4">
              <Fuel className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium text-warning">Log Expense</span>
            </div>

            <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-2">
              Log an Expense
            </h1>
            <p className="text-text-secondary">
              Record fuel, maintenance, and other operational expenses for reimbursement.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-2xl border border-border bg-surface p-6 md:p-8"
            >
              {isSubmitted ? (
                <div className="text-center py-12">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10 mx-auto mb-4">
                    <CheckCircle2 className="h-8 w-8 text-success" />
                  </div>
                  <h3 className="font-heading font-bold text-xl text-text-primary mb-2">
                    Expense Submitted!
                  </h3>
                  <p className="text-text-secondary">
                    Your expense has been submitted and is pending approval from the car owner.
                  </p>
                </div>
              ) : (
                <>
                  <h2 className="font-heading font-bold text-xl text-text-primary mb-6">
                    Expense Details
                  </h2>

                  {/* Car Selection */}
                  <div className="mb-6">
                    <Label className="text-text-secondary mb-3 block">Select Vehicle</Label>
                    <div className="grid grid-cols-2 gap-4">
                      {assignedCars.length === 0 ? (
                        <div className="col-span-2 flex flex-col items-center justify-center py-8 text-center">
                          <Car className="h-8 w-8 text-text-muted mb-2" />
                          <p className="text-sm text-text-muted">No cars assigned to you yet.</p>
                        </div>
                      ) : (
                        assignedCars.map((car) => (
                          <button
                            key={car.id}
                            onClick={() => setSelectedCar(car.id)}
                            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                              selectedCar === car.id
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-border-hover'
                            }`}
                          >
                            <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-background-elevated shrink-0">
                              <Car className="h-6 w-6 text-text-muted" />
                            </div>
                            <p className="text-sm font-medium text-text-primary text-left">{car.name}</p>
                            {selectedCar === car.id && (
                              <CheckCircle2 className="h-5 w-5 text-primary ml-auto shrink-0" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Expense Type */}
                  <div className="mb-6">
                    <Label className="text-text-secondary mb-3 block">Expense Type</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {EXPENSE_TYPES.map((type) => {
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.id}
                            onClick={() => setExpenseType(type.id)}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                              expenseType === type.id
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-border-hover'
                            }`}
                          >
                            <Icon className={`h-6 w-6 ${
                              expenseType === type.id ? 'text-primary' : 'text-text-muted'
                            }`} />
                            <span className={`text-sm font-medium ${
                              expenseType === type.id ? 'text-primary' : 'text-text-primary'
                            }`}>
                              {type.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Amount & Description */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                    <div>
                      <Label htmlFor="amount" className="text-text-secondary">Amount (ETH)</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.001"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="mt-2"
                        inputSize="lg"
                        leftIcon={<DollarSign className="h-5 w-5" />}
                      />
                    </div>
                    <div>
                      <Label htmlFor="date" className="text-text-secondary">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        className="mt-2"
                        inputSize="lg"
                        leftIcon={<Calendar className="h-5 w-5" />}
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <Label htmlFor="description" className="text-text-secondary">Description</Label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief description of the expense..."
                      rows={3}
                      className="mt-2 w-full px-4 py-3 rounded-xl border border-border bg-background-elevated text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                    />
                  </div>

                  {/* Receipt Upload */}
                  <div className="mb-8">
                    <Label className="text-text-secondary mb-3 block">Upload Receipt</Label>

                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />

                    {receiptFile ? (
                      /* ─── File selected — show preview ─── */
                      <div className="rounded-xl border border-border bg-background-elevated p-4">
                        <div className="flex items-start gap-4">
                          {/* Preview thumbnail */}
                          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-surface border border-border shrink-0 overflow-hidden">
                            {receiptPreview ? (
                              <img
                                src={receiptPreview}
                                alt="Receipt preview"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <FileText className="h-7 w-7 text-error" />
                            )}
                          </div>

                          {/* File info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">
                              {receiptFile.name}
                            </p>
                            <p className="text-xs text-text-muted mt-1">
                              {formatFileSize(receiptFile.size)} • {receiptFile.type.split('/')[1]?.toUpperCase()}
                            </p>
                            <div className="flex items-center gap-1 mt-1.5">
                              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                              <span className="text-xs text-success font-medium">Ready to upload</span>
                            </div>
                          </div>

                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="p-1.5 rounded-lg hover:bg-error/10 text-text-muted hover:text-error transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Replace file */}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-3 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                        >
                          Replace file
                        </button>
                      </div>
                    ) : (
                      /* ─── Drop zone ─── */
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`p-6 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center ${
                          isDragging
                            ? 'border-primary bg-primary/5 scale-[1.01]'
                            : 'border-border hover:border-primary/50 hover:bg-background-elevated/50'
                        }`}
                      >
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl mx-auto mb-3 ${
                          isDragging ? 'bg-primary/10' : 'bg-background-elevated'
                        }`}>
                          {isDragging ? (
                            <ImageIcon className="h-6 w-6 text-primary" />
                          ) : (
                            <Upload className="h-6 w-6 text-text-muted" />
                          )}
                        </div>
                        <p className="text-sm text-text-primary mb-1 font-medium">
                          {isDragging ? 'Drop your receipt here' : 'Click to upload or drag & drop'}
                        </p>
                        <p className="text-xs text-text-muted">PNG, JPG, GIF, WebP or PDF up to 10MB</p>
                      </div>
                    )}

                    {/* Upload error */}
                    {uploadError && (
                      <div className="flex items-center gap-2 mt-3 p-3 rounded-lg bg-error/5 border border-error/10">
                        <AlertCircle className="h-4 w-4 text-error shrink-0" />
                        <span className="text-sm text-error">{uploadError}</span>
                      </div>
                    )}

                    {/* Uploading indicator */}
                    {isUploading && (
                      <div className="flex items-center gap-2 mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm text-primary">Uploading receipt...</span>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleSubmit}
                    isLoading={isSubmitting}
                    variant="glow"
                    size="lg"
                    className="w-full"
                    disabled={!selectedCar || !expenseType || !amount}
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Submit Expense
                  </Button>
                </>
              )}
            </motion.div>
          </div>

          {/* Recent Expenses Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="rounded-2xl border border-border bg-surface overflow-hidden">
              <div className="p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
                    <Fuel className="h-5 w-5 text-warning" />
                  </div>
                  <h3 className="font-heading font-bold text-lg text-text-primary">Recent Expenses</h3>
                </div>
              </div>

              <div className="divide-y divide-border">
                {recentExpenses.length > 0 ? recentExpenses.map((expense) => {
                  const expenseInfo = EXPENSE_TYPES.find((t) => t.id === expense.type);
                  const Icon = expenseInfo?.icon || DollarSign;

                  return (
                    <div key={expense.id} className="p-4 hover:bg-background-elevated/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background-elevated shrink-0">
                          <Icon className="h-5 w-5 text-text-muted" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-text-primary capitalize">{expense.type}</p>
                          <p className="text-xs text-text-muted truncate">{expense.car?.name ?? `Car #${expense.carId}`}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-text-muted">{new Date(expense.submittedAt).toLocaleDateString()}</span>
                            <Badge
                              variant={expense.status === 'approved' ? 'success' : 'warning'}
                              className="text-xs"
                            >
                              {expense.status}
                            </Badge>
                          </div>
                        </div>
                        <span className="font-mono font-medium text-error shrink-0">
                          -{weiToEth(expense.amount)} ETH
                        </span>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="p-6 text-center text-text-muted text-sm">No expenses logged yet.</div>
                )}
              </div>

              <div className="p-4 border-t border-border">
                <Button variant="ghost" className="w-full">
                  View All Expenses
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
