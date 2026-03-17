import { Link, useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home, ChevronLeft, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ErrorPage() {
  const error = useRouteError();

  let errorTitle = 'Something Went Wrong';
  let errorMessage = 'An unexpected error occurred. Please try again later.';
  let errorCode: string | number | undefined;

  if (isRouteErrorResponse(error)) {
    errorCode = error.status;
    errorTitle = error.statusText || errorTitle;
    errorMessage = error.data?.message || errorMessage;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-error/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-warning/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-lg w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo */}
          <Link to="/" className="inline-flex items-center gap-2 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
              <Car className="h-6 w-6 text-white" />
            </div>
            <span className="font-heading font-bold text-2xl text-text-primary">CarShares</span>
          </Link>

          {/* Error Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1, type: 'spring' }}
            className="flex h-32 w-32 items-center justify-center rounded-full bg-error/10 border border-error/20 mx-auto mb-8"
          >
            <AlertTriangle className="h-16 w-16 text-error" />
          </motion.div>

          {/* Error Code */}
          {errorCode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="mb-4"
            >
              <span className="font-mono text-6xl font-bold text-gradient">{errorCode}</span>
            </motion.div>
          )}

          {/* Error Title */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="font-heading text-3xl font-bold text-text-primary mb-4"
          >
            {errorTitle}
          </motion.h1>

          {/* Error Message */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="text-text-secondary mb-8 max-w-md mx-auto"
          >
            {errorMessage}
          </motion.p>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button onClick={handleRetry} variant="glow" size="lg" className="inline-flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              <span>Try Again</span>
            </Button>
            <Button onClick={handleGoBack} variant="outline" size="lg" className="inline-flex items-center gap-2">
              <ChevronLeft className="h-5 w-5" />
              <span>Go Back</span>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link to="/" className="inline-flex items-center gap-2">
                <Home className="h-5 w-5" />
                <span>Home</span>
              </Link>
            </Button>
          </motion.div>

          {/* Support Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.6 }}
            className="mt-12 p-6 rounded-2xl bg-surface border border-border"
          >
            <h3 className="font-heading font-bold text-text-primary mb-2">
              Need Help?
            </h3>
            <p className="text-sm text-text-muted mb-4">
              If this problem persists, please contact our support team.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
              <a
                href="mailto:support@carshares.io"
                className="text-primary hover:text-primary-hover transition-colors"
              >
                support@carshares.io
              </a>
              <span className="hidden sm:inline text-text-muted">|</span>
              <Link
                to="/help"
                className="text-primary hover:text-primary-hover transition-colors"
              >
                Help Center
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
