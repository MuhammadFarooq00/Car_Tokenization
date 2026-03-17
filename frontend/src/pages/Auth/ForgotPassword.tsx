import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Car, CheckCircle2, AlertCircle, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api-client';

type Step = 'email' | 'sent';

export function ForgotPassword() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      await api.post<{ message: string }>('/auth/forgot-password', { email }, { skipAuth: true });
      setStep('sent');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
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
              {step === 'sent' ? 'Check your email' : 'Reset Password'}
            </h1>
            <p className="text-text-secondary">
              {step === 'email' && 'Enter your email to receive a password reset link'}
              {step === 'sent' && `We sent a reset link to ${email}`}
            </p>
          </div>

          {/* Error Alert */}
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

          {/* Step 1: Email input */}
          {step === 'email' && (
            <form onSubmit={handleRequestReset} className="space-y-5">
              <div>
                <Label htmlFor="email" className="text-text-secondary">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-2"
                  inputSize="lg"
                  leftIcon={<Mail className="h-5 w-5" />}
                  autoComplete="email"
                />
              </div>

              <Button type="submit" variant="glow" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Mail className="h-5 w-5 mr-2" />}
                Send Reset Link
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

          {/* Step 2: Email sent confirmation */}
          {step === 'sent' && (
            <div className="space-y-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-success/10 mx-auto">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>

              <div className="p-5 rounded-xl bg-surface border border-border text-left space-y-3">
                <p className="text-sm text-text-secondary leading-relaxed">
                  If an account exists for <span className="text-text-primary font-medium">{email}</span>, you'll receive a password reset link shortly.
                </p>
                <p className="text-sm text-text-muted leading-relaxed">
                  Click the link in the email to choose a new password. The link expires in <strong className="text-text-secondary">30 minutes</strong>.
                </p>
                <p className="text-xs text-text-muted">
                  Don't see it? Check your spam folder.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => { setStep('email'); setError(null); }}
                >
                  Use a different email
                </Button>
                <Link to="/login">
                  <Button variant="ghost" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                  </Button>
                </Link>
              </div>
            </div>
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
            We take security seriously. Reset your password to regain access to your automotive investment portfolio.
          </p>
        </div>
      </div>
    </div>
  );
}
