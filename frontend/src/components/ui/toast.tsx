import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const TOAST_ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const TOAST_STYLES = {
  success: {
    container: 'bg-success/10 border-success/30',
    icon: 'text-success',
    title: 'text-success',
    progress: 'bg-success',
  },
  error: {
    container: 'bg-error/10 border-error/30',
    icon: 'text-error',
    title: 'text-error',
    progress: 'bg-error',
  },
  warning: {
    container: 'bg-warning/10 border-warning/30',
    icon: 'text-warning',
    title: 'text-warning',
    progress: 'bg-warning',
  },
  info: {
    container: 'bg-info/10 border-info/30',
    icon: 'text-info',
    title: 'text-info',
    progress: 'bg-info',
  },
};

export function Toast({ id, type, title, message, duration = 5000, onClose }: ToastProps) {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  const Icon = TOAST_ICONS[type];
  const styles = TOAST_STYLES[type];

  useEffect(() => {
    if (isPaused || duration === 0) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - 100 / (duration / 100);
        if (newProgress <= 0) {
          clearInterval(interval);
          onClose(id);
          return 0;
        }
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [id, duration, onClose, isPaused]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={cn(
        'relative w-full max-w-sm overflow-hidden rounded-xl border backdrop-blur-md shadow-lg',
        styles.container
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0">
            <Icon className={cn('h-5 w-5', styles.icon)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn('font-medium text-sm', styles.title)}>{title}</p>
            {message && (
              <p className="mt-1 text-sm text-text-secondary">{message}</p>
            )}
          </div>
          <button
            onClick={() => onClose(id)}
            className="shrink-0 p-1 rounded-lg hover:bg-background-elevated/50 transition-colors"
          >
            <X className="h-4 w-4 text-text-muted hover:text-text-primary" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {duration > 0 && (
        <div className="h-1 bg-background-elevated/30">
          <motion.div
            className={cn('h-full', styles.progress)}
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      )}
    </motion.div>
  );
}

export interface ToastContainerProps {
  toasts: Array<{
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
  }>;
  onClose: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

const POSITION_CLASSES = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
};

export function ToastContainer({
  toasts,
  onClose,
  position = 'top-right',
}: ToastContainerProps) {
  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col gap-3 pointer-events-none',
        POSITION_CLASSES[position]
      )}
    >
      <AnimatePresence mode="sync">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              id={toast.id}
              type={toast.type}
              title={toast.title}
              message={toast.message}
              duration={toast.duration}
              onClose={onClose}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
