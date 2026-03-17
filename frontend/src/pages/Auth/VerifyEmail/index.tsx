import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, Car, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api, setTokens } from '@/lib/api-client';

type Status = 'verifying' | 'success' | 'error' | 'no-token';

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<Status>(token ? 'verifying' : 'no-token');
  const [errorMsg, setErrorMsg] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendSent, setResendSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const hasVerified = useRef(false);

  useEffect(() => {
    if (!token || hasVerified.current) return;
    hasVerified.current = true;

    const verify = async () => {
      try {
        const result = await api.get<{ accessToken: string; refreshToken: string }>(
          `/auth/verify-email?token=${encodeURIComponent(token)}`,
          { skipAuth: true },
        );
        // Store tokens and redirect to dashboard
        setTokens(result.accessToken, result.refreshToken);
        setStatus('success');
        setTimeout(() => navigate('/dashboard', { replace: true }), 2500);
      } catch (err: unknown) {
        setStatus('error');
        setErrorMsg(err instanceof Error ? err.message : 'Verification failed');
      }
    };

    verify();
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;
    setResendLoading(true);
    try {
      await api.post('/auth/resend-verification', { email: resendEmail }, { skipAuth: true });
      setResendSent(true);
    } catch {
      setResendSent(true); // Show generic success to prevent enumeration
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md text-center"
      >
        {/* Logo */}
        <Link to="/" className="inline-flex items-center gap-2 mb-10 justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
            <Car className="h-5 w-5 text-white" />
          </div>
          <span className="font-heading font-bold text-xl text-text-primary">CarShares</span>
        </Link>

        {/* Verifying */}
        {status === 'verifying' && (
          <div className="space-y-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 mx-auto">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold text-text-primary mb-2">Verifying your email…</h1>
              <p className="text-text-secondary">Please wait a moment.</p>
            </div>
          </div>
        )}

        {/* Success */}
        {status === 'success' && (
          <div className="space-y-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-success/10 mx-auto">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold text-text-primary mb-2">Email verified!</h1>
              <p className="text-text-secondary">Your account is now active. Redirecting to dashboard…</p>
            </div>
            <Link to="/dashboard">
              <Button variant="glow" size="lg" className="w-full">Go to Dashboard</Button>
            </Link>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="space-y-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-error/10 mx-auto">
              <XCircle className="h-10 w-10 text-error" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold text-text-primary mb-2">Verification failed</h1>
              <p className="text-text-secondary">{errorMsg || 'This link may be invalid or expired.'}</p>
            </div>

            {/* Resend form */}
            {!resendSent ? (
              <form onSubmit={handleResend} className="space-y-3 text-left">
                <p className="text-sm text-text-muted text-center">Request a new verification link:</p>
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                />
                <Button type="submit" variant="glow" className="w-full" disabled={resendLoading}>
                  {resendLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                  Resend Verification Email
                </Button>
              </form>
            ) : (
              <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-sm text-success">
                If that email exists, a new verification link has been sent. Check your inbox.
              </div>
            )}

            <Link to="/login" className="block text-sm text-primary hover:text-primary-hover transition-colors">
              Back to Login
            </Link>
          </div>
        )}

        {/* No token */}
        {status === 'no-token' && (
          <div className="space-y-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-warning/10 mx-auto">
              <Mail className="h-10 w-10 text-warning" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold text-text-primary mb-2">Check your email</h1>
              <p className="text-text-secondary">Click the verification link we sent to your email to activate your account.</p>
            </div>
            <Link to="/login">
              <Button variant="outline" size="lg" className="w-full">Back to Login</Button>
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
