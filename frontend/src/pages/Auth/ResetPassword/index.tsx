import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft, Car, CheckCircle2, AlertCircle, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api-client';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <div className="text-center space-y-6 max-w-md">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-error/10 mx-auto">
            <XCircle className="h-10 w-10 text-error" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">Invalid reset link</h1>
          <p className="text-text-secondary">This password reset link is missing its token. Please request a new one.</p>
          <Link to="/forgot-password">
            <Button variant="glow" size="lg" className="w-full">Request New Link</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword }, { skipAuth: true });
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reset password. The link may be expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-primary to-accent">
                <Car className="h-5 w-5 text-white" />
              </div>
              <span className="font-heading font-bold text-xl text-text-primary">CarShares</span>
            </Link>
            <h1 className="font-heading text-3xl font-bold text-text-primary mb-2">
              {done ? 'Password Reset!' : 'Choose New Password'}
            </h1>
            <p className="text-text-secondary">
              {done ? 'Redirecting to login…' : 'Enter your new password below.'}
            </p>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 flex items-start gap-3"
            >
              <AlertCircle className="h-5 w-5 text-error shrink-0 mt-0.5" />
              <p className="text-sm text-error">{error}</p>
            </motion.div>
          )}

          {/* Success */}
          {done ? (
            <div className="text-center space-y-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-success/10 mx-auto">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>
              <p className="text-text-secondary">Your password has been reset. Redirecting to login…</p>
              <Link to="/login">
                <Button variant="glow" size="lg" className="w-full">Go to Login</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="new-password" className="text-text-secondary">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="mt-2"
                  inputSize="lg"
                  leftIcon={<Lock className="h-5 w-5" />}
                  autoComplete="new-password"
                />
              </div>

              <div>
                <Label htmlFor="confirm-password" className="text-text-secondary">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="mt-2"
                  inputSize="lg"
                  leftIcon={<Lock className="h-5 w-5" />}
                  autoComplete="new-password"
                />
              </div>

              <Button type="submit" variant="glow" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Lock className="h-5 w-5 mr-2" />}
                Reset Password
              </Button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="text-sm text-primary hover:text-primary-hover transition-colors inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Link>
              </div>
            </form>
          )}
        </motion.div>
      </div>

      {/* Right side - Decorative */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center bg-linear-to-br from-primary/10 via-accent/5 to-background">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        </div>
        <div className="relative text-center p-12">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-accent mx-auto mb-8">
            <Lock className="h-10 w-10 text-white" />
          </div>
          <h2 className="font-heading text-3xl font-bold text-text-primary mb-4">
            Secure Account Recovery
          </h2>
          <p className="text-text-secondary max-w-md">
            Choose a strong password to protect your investment portfolio.
          </p>
        </div>
      </div>
    </div>
  );
}
