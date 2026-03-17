import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, Eye, EyeOff, User, ChevronRight, ChevronLeft, AlertCircle,
  Car, Check, TrendingUp, Gauge, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_INFO, type RegularUserRole } from '@/types/auth';

const STEPS = [
  { id: 1, title: 'Account', description: 'Create your account' },
  { id: 2, title: 'Roles', description: 'Select your roles' },
  { id: 3, title: 'Terms', description: 'Accept terms' },
];

const ROLE_ICONS = {
  investor: TrendingUp,
  car_owner: Car,
  driver: Gauge,
  admin: Shield,
};

export function Signup() {
  const navigate = useNavigate();
  const { signup, isLoading, error } = useAuth();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // Multi-role selection
  const [selectedRoles, setSelectedRoles] = useState<RegularUserRole[]>(['investor']);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Toggle role selection
  const toggleRole = (role: RegularUserRole) => {
    setSelectedRoles(prev => {
      if (prev.includes(role)) {
        // Don't allow removing the last role
        if (prev.length === 1) return prev;
        return prev.filter(r => r !== role);
      }
      return [...prev, role];
    });
  };

  const handleNextStep = () => {
    setLocalError(null);

    if (step === 1) {
      if (!name || !email || !password || !confirmPassword) {
        setLocalError('Please fill in all fields');
        return;
      }
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match');
        return;
      }
      if (password.length < 6) {
        setLocalError('Password must be at least 6 characters');
        return;
      }
    }

    if (step === 2 && selectedRoles.length === 0) {
      setLocalError('Please select at least one role');
      return;
    }

    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setLocalError(null);
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    setLocalError(null);

    if (!acceptTerms) {
      setLocalError('Please accept the terms and conditions');
      return;
    }

    if (selectedRoles.length === 0) {
      setLocalError('Please select at least one role');
      return;
    }

    try {
      await signup({
        email,
        password,
        name,
        roles: selectedRoles,
        acceptTerms,
      });
      // Account is auto-verified — go straight to login
      navigate('/login', { replace: true });
    } catch {
      // Error is handled by auth context
    }
  };

  const displayError = localError || error;
  const availableRoles = Object.values(ROLE_INFO).filter((r) => r.id !== 'admin' && r.id !== 'driver');

  return (
    <div className="min-h-screen flex">
      {/* Left side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col">
        {/* Car photo */}
        <img
          src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80&auto=format&fit=crop"
          alt="Premium car"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-transparent" />

        {/* Content pinned to bottom */}
        <div className="relative z-10 mt-auto p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="font-heading text-4xl font-bold text-white mb-4">
              Join the Revolution
            </h2>
            <p className="text-lg text-white/80 max-w-md leading-relaxed">
              Become part of a growing community of investors, car owners, and drivers transforming vehicle ownership.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-10">
              <div>
                <p className="font-heading text-3xl font-bold text-white">$2.4M+</p>
                <p className="text-sm text-white/60 mt-1">Total Investment</p>
              </div>
              <div>
                <p className="font-heading text-3xl font-bold text-white">150+</p>
                <p className="text-sm text-white/60 mt-1">Tokenized Cars</p>
              </div>
              <div>
                <p className="font-heading text-3xl font-bold text-white">5,000+</p>
                <p className="text-sm text-white/60 mt-1">Active Users</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          {/* Logo & Title */}
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
                <Car className="h-5 w-5 text-white" />
              </div>
              <span className="font-heading font-bold text-xl text-text-primary">CarShares</span>
            </Link>

            <h1 className="font-heading text-3xl font-bold text-text-primary mb-2">
              Create your account
            </h1>
            <p className="text-text-secondary">
              Start investing in tokenized vehicles today
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl font-medium transition-all ${
                      step > s.id
                        ? 'bg-success text-white'
                        : step === s.id
                        ? 'bg-primary text-white'
                        : 'bg-surface border border-border text-text-muted'
                    }`}
                  >
                    {step > s.id ? <Check className="h-5 w-5" /> : s.id}
                  </div>
                  <span className="text-xs text-text-muted mt-2 hidden sm:block">{s.title}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-3 transition-colors ${
                      step > s.id ? 'bg-success' : 'bg-border'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Error Alert */}
          {displayError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 flex items-start gap-3"
            >
              <AlertCircle className="h-5 w-5 text-error shrink-0 mt-0.5" />
              <p className="text-sm text-error">{displayError}</p>
            </motion.div>
          )}

          {/* Step Content */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div>
                  <Label htmlFor="name" className="text-text-secondary">Full name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="mt-2"
                    inputSize="lg"
                    leftIcon={<User className="h-5 w-5" />}
                    autoComplete="name"
                  />
                </div>

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

                <div>
                  <Label htmlFor="password" className="text-text-secondary">Password</Label>
                  <div className="relative mt-2">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      inputSize="lg"
                      leftIcon={<Lock className="h-5 w-5" />}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-secondary transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-text-secondary">Confirm password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-2"
                    inputSize="lg"
                    leftIcon={<Lock className="h-5 w-5" />}
                    autoComplete="new-password"
                  />
                </div>

                <Button
                  onClick={handleNextStep}
                  className="w-full"
                  size="lg"
                  variant="glow"
                >
                  Continue
                  <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <p className="text-text-secondary mb-4">
                  Select how you want to use CarShares. You can select multiple roles and change them later.
                </p>

                <div className="space-y-3">
                  {availableRoles.map((role) => {
                    const Icon = ROLE_ICONS[role.id];
                    const isSelected = selectedRoles.includes(role.id as RegularUserRole);

                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => toggleRole(role.id as RegularUserRole)}
                        className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-surface hover:border-border-hover'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`flex h-12 w-12 items-center justify-center rounded-xl shrink-0 ${
                              isSelected ? 'bg-primary/20' : 'bg-background-elevated'
                            }`}
                          >
                            <Icon className={`h-6 w-6 ${isSelected ? 'text-primary' : 'text-text-muted'}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className={`font-heading font-bold text-lg ${isSelected ? 'text-primary' : 'text-text-primary'}`}>
                                {role.title}
                              </h3>
                              <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                                isSelected ? 'bg-primary border-primary' : 'border-border'
                              }`}>
                                {isSelected && <Check className="h-4 w-4 text-white" />}
                              </div>
                            </div>
                            <p className="text-sm text-text-secondary mt-1">{role.description}</p>
                            <ul className="mt-3 space-y-1">
                              {role.features.slice(0, 2).map((feature, i) => (
                                <li key={i} className="text-xs text-text-muted flex items-center gap-2">
                                  <Check className="h-3 w-3 text-success" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected roles summary */}
                {selectedRoles.length > 0 && (
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                    <p className="text-sm text-text-secondary">
                      <span className="text-primary font-medium">{selectedRoles.length} role{selectedRoles.length > 1 ? 's' : ''} selected:</span>{' '}
                      {selectedRoles.map(r => ROLE_INFO[r].title).join(', ')}
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={handlePrevStep}
                    variant="ghost"
                    size="lg"
                    className="flex-1"
                  >
                    <ChevronLeft className="h-5 w-5 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={handleNextStep}
                    className="flex-1"
                    size="lg"
                    variant="glow"
                    disabled={selectedRoles.length === 0}
                  >
                    Continue
                    <ChevronRight className="h-5 w-5 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div className="p-6 rounded-2xl bg-surface border border-border">
                  <h3 className="font-heading font-bold text-lg text-text-primary mb-4">
                    Terms & Conditions
                  </h3>
                  <div className="h-48 overflow-y-auto p-4 rounded-xl bg-background-elevated text-sm text-text-secondary leading-relaxed">
                    <p className="mb-4">
                      By creating an account on CarShares, you agree to the following terms:
                    </p>
                    <p className="mb-4">
                      <strong className="text-text-primary">1. Investment Risks:</strong> Investing in tokenized vehicles carries inherent risks. Past performance does not guarantee future results. You should only invest what you can afford to lose.
                    </p>
                    <p className="mb-4">
                      <strong className="text-text-primary">2. KYC Requirements:</strong> You may be required to complete identity verification before accessing certain features or making investments.
                    </p>
                    <p className="mb-4">
                      <strong className="text-text-primary">3. Blockchain Transactions:</strong> All transactions are recorded on the blockchain and are irreversible. Transaction fees may apply.
                    </p>
                    <p className="mb-4">
                      <strong className="text-text-primary">4. Privacy Policy:</strong> We collect and process your data in accordance with our Privacy Policy.
                    </p>
                    <p>
                      <strong className="text-text-primary">5. Platform Rules:</strong> You agree to follow all platform guidelines and not engage in fraudulent activities.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="h-5 w-5 mt-0.5 rounded border-border bg-background-elevated text-primary focus:ring-primary focus:ring-offset-background"
                  />
                  <Label htmlFor="terms" className="text-sm text-text-secondary cursor-pointer leading-relaxed">
                    I have read and agree to the Terms of Service and Privacy Policy. I understand the risks involved in investing in tokenized assets.
                  </Label>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handlePrevStep}
                    variant="ghost"
                    size="lg"
                    className="flex-1"
                    disabled={isLoading}
                  >
                    <ChevronLeft className="h-5 w-5 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="flex-1"
                    size="lg"
                    variant="glow"
                    isLoading={isLoading}
                    disabled={!acceptTerms}
                  >
                    Create Account
                    <ChevronRight className="h-5 w-5 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Link */}
          <p className="mt-8 text-center text-text-secondary">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-primary hover:text-primary-hover transition-colors"
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
