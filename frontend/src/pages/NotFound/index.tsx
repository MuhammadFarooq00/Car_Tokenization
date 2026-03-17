import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-xl mx-auto text-center"
        >
          {/* 404 Illustration */}
          <div className="relative mb-8">
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut'
              }}
              className="flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 mx-auto border border-primary/20"
            >
              <Car className="h-20 w-20 text-primary" />
            </motion.div>

            {/* Floating elements */}
            <motion.div
              animate={{
                rotate: 360,
                scale: [1, 1.1, 1]
              }}
              transition={{
                rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
                scale: { duration: 2, repeat: Infinity, repeatType: 'reverse' }
              }}
              className="absolute top-0 right-1/4 w-8 h-8 rounded-full bg-accent/20 border border-accent/30"
            />
            <motion.div
              animate={{
                rotate: -360,
                scale: [1, 1.2, 1]
              }}
              transition={{
                rotate: { duration: 15, repeat: Infinity, ease: 'linear' },
                scale: { duration: 3, repeat: Infinity, repeatType: 'reverse' }
              }}
              className="absolute bottom-0 left-1/4 w-6 h-6 rounded-full bg-primary/20 border border-primary/30"
            />
          </div>

          {/* 404 Text */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-heading text-8xl md:text-9xl font-bold text-gradient mb-4"
          >
            404
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-heading text-2xl md:text-3xl font-bold text-text-primary mb-4"
          >
            Road Not Found
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-text-secondary leading-relaxed max-w-md mx-auto mb-8"
          >
            Looks like you've taken a wrong turn. The page you're looking for doesn't exist or has been moved to a new location.
          </motion.p>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button asChild variant="outline" size="lg">
              <Link to="/" onClick={() => window.history.back()} className="inline-flex items-center gap-2">
                <ArrowLeft className="h-5 w-5" />
                <span>Go Back</span>
              </Link>
            </Button>
            <Button asChild variant="glow" size="lg">
              <Link to="/" className="inline-flex items-center gap-2">
                <Home className="h-5 w-5" />
                <span>Back to Home</span>
              </Link>
            </Button>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 p-6 rounded-2xl bg-surface border border-border"
          >
            <p className="text-sm text-text-muted mb-4">Popular destinations:</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                to="/discover"
                className="px-4 py-2 rounded-xl bg-background-elevated hover:bg-primary/10 text-text-secondary hover:text-primary transition-colors text-sm font-medium"
              >
                Discover Cars
              </Link>
              <Link
                to="/marketplace"
                className="px-4 py-2 rounded-xl bg-background-elevated hover:bg-primary/10 text-text-secondary hover:text-primary transition-colors text-sm font-medium"
              >
                Marketplace
              </Link>
              <Link
                to="/portfolio"
                className="px-4 py-2 rounded-xl bg-background-elevated hover:bg-primary/10 text-text-secondary hover:text-primary transition-colors text-sm font-medium"
              >
                Portfolio
              </Link>
              <Link
                to="/dashboard"
                className="px-4 py-2 rounded-xl bg-background-elevated hover:bg-primary/10 text-text-secondary hover:text-primary transition-colors text-sm font-medium"
              >
                Dashboard
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
