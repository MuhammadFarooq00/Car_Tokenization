import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { ToastContainer, type ToastType } from '@/components/ui/toast';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  success: (title: string, message?: string, duration?: number) => string;
  error: (title: string, message?: string, duration?: number) => string;
  warning: (title: string, message?: string, duration?: number) => string;
  info: (title: string, message?: string, duration?: number) => string;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxToasts?: number;
}

export function ToastProvider({
  children,
  position = 'top-right',
  maxToasts = 5,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const generateId = () => `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = generateId();
    setToasts((prev) => {
      const newToasts = [...prev, { ...toast, id }];
      // Keep only the latest maxToasts
      if (newToasts.length > maxToasts) {
        return newToasts.slice(-maxToasts);
      }
      return newToasts;
    });
    return id;
  }, [maxToasts]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback(
    (title: string, message?: string, duration?: number) => {
      return addToast({ type: 'success', title, message, duration });
    },
    [addToast]
  );

  const error = useCallback(
    (title: string, message?: string, duration?: number) => {
      return addToast({ type: 'error', title, message, duration });
    },
    [addToast]
  );

  const warning = useCallback(
    (title: string, message?: string, duration?: number) => {
      return addToast({ type: 'warning', title, message, duration });
    },
    [addToast]
  );

  const info = useCallback(
    (title: string, message?: string, duration?: number) => {
      return addToast({ type: 'info', title, message, duration });
    },
    [addToast]
  );

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const value: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    clearAll,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} position={position} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Utility hook for common toast patterns
export function useToastActions() {
  const toast = useToast();

  return {
    showSuccess: (title: string, message?: string) => toast.success(title, message),
    showError: (title: string, message?: string) => toast.error(title, message, 8000),
    showWarning: (title: string, message?: string) => toast.warning(title, message, 6000),
    showInfo: (title: string, message?: string) => toast.info(title, message),

    // Common action patterns
    showSaved: () => toast.success('Saved', 'Your changes have been saved successfully'),
    showDeleted: () => toast.success('Deleted', 'Item has been deleted successfully'),
    showCopied: () => toast.success('Copied', 'Copied to clipboard'),
    showNetworkError: () => toast.error('Network Error', 'Please check your internet connection'),
    showUnauthorized: () => toast.error('Unauthorized', 'Please log in to continue'),
    showValidationError: (message: string) => toast.error('Validation Error', message),
    showTransactionPending: () => toast.info('Transaction Pending', 'Please wait while we process your transaction'),
    showTransactionSuccess: (txHash?: string) =>
      toast.success('Transaction Successful', txHash ? `Transaction: ${txHash.slice(0, 10)}...` : undefined),
    showTransactionFailed: (reason?: string) =>
      toast.error('Transaction Failed', reason || 'The transaction could not be completed'),
  };
}
