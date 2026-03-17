/**
 * OnboardingModal
 *
 * Shown on the Dashboard the first time a verified user logs in.
 * 5-step questionnaire that assigns roles to the user based on their answers.
 *
 * Questions:
 *  1. Welcome — what brings you here?
 *  2. Invest — do you want to buy shares in tokenized cars?
 *  3. Own — do you own a car you'd like to tokenize?
 *  4. Drive — do you want to earn by driving tokenized cars?
 *  5. Review — confirm selections before submitting
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Car, Gauge, ChevronRight, ChevronLeft,
  Check, Sparkles, Loader2, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import type { RegularUserRole } from '@/types/auth';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Question {
  id: number;
  title: string;
  subtitle: string;
  role: RegularUserRole | null; // null = intro question
  icon: React.ElementType;
  color: string;
  bgColor: string;
  yesLabel: string;
  noLabel: string;
}

const QUESTIONS: Question[] = [
  {
    id: 2,
    role: 'investor',
    icon: TrendingUp,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 border-emerald-500/20',
    title: 'Do you want to invest in tokenized cars?',
    subtitle: 'Buy shares in real vehicles and earn passive income from ride revenues and dividend distributions.',
    yesLabel: 'Yes, I want to invest',
    noLabel: 'Not for now',
  },
  {
    id: 3,
    role: 'car_owner',
    icon: Car,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/20',
    title: 'Do you own a car you want to tokenize?',
    subtitle: 'List your vehicle on CarShares, sell ownership shares to investors, and manage professional drivers.',
    yesLabel: 'Yes, I have a car',
    noLabel: 'Not right now',
  },
  {
    id: 4,
    role: 'driver',
    icon: Gauge,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10 border-purple-500/20',
    title: 'Do you want to drive and earn?',
    subtitle: 'Apply to drive tokenized cars, log your rides, and earn a commission from every trip you complete.',
    yesLabel: 'Yes, I want to drive',
    noLabel: 'No thanks',
  },
];

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepDot({ active, completed }: { active: boolean; completed: boolean }) {
  return (
    <div
      className={cn(
        'w-2 h-2 rounded-full transition-all duration-300',
        completed ? 'bg-primary w-6' : active ? 'bg-primary' : 'bg-border',
      )}
    />
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface OnboardingModalProps {
  onComplete: (updatedRoles: RegularUserRole[]) => void;
  onDismiss: () => void;
}

export function OnboardingModal({ onComplete, onDismiss }: OnboardingModalProps) {
  const { user } = useAuth();
  // Step: 0 = intro, 1-3 = questions, 4 = summary
  const [step, setStep] = useState(0);
  // Track yes/no for each role question (keyed by role)
  const [answers, setAnswers] = useState<Record<string, boolean>>({
    investor: true, // investor is always on by default
    car_owner: false,
    driver: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = QUESTIONS.length + 2; // intro + questions + summary

  const answer = useCallback((role: RegularUserRole, value: boolean) => {
    setAnswers((prev) => ({ ...prev, [role]: value }));
    setStep((s) => s + 1);
  }, []);

  const selectedRoles = Object.entries(answers)
    .filter(([, v]) => v)
    .map(([k]) => k as RegularUserRole);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const rolesPayload: RegularUserRole[] = selectedRoles.length > 0 ? selectedRoles : ['investor'];
      await api.post('/users/onboarding/complete', { roles: rolesPayload });
      onComplete(rolesPayload);
    } catch {
      // If call fails, still dismiss so user isn't stuck
      onComplete(['investor' as RegularUserRole]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuestion = QUESTIONS[step - 1]; // null on step 0 (intro) and step 4 (summary)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onDismiss}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-primary via-accent to-primary" />

        {/* Dismiss */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-background-elevated transition-colors z-10"
          aria-label="Skip onboarding"
          title="Skip — you can change roles anytime in settings"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-8">
          {/* Step dots */}
          <div className="flex items-center gap-1.5 mb-8">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <StepDot key={i} active={i === step} completed={i < step} />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* ── Intro step ── */}
            {step === 0 && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h2 className="font-heading text-2xl font-bold text-text-primary mb-2">
                    Welcome, {user?.name?.split(' ')[0] || 'there'}! 👋
                  </h2>
                  <p className="text-text-secondary leading-relaxed">
                    Let's personalise your CarShares experience. We'll ask you a few quick questions so we can set up the right features for you.
                  </p>
                  <p className="text-sm text-text-muted mt-3">
                    You can change your roles anytime from your profile settings.
                  </p>
                </div>
                <Button variant="glow" size="lg" className="w-full" onClick={() => setStep(1)}>
                  Let's get started
                  <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
              </motion.div>
            )}

            {/* ── Role questions (steps 1-3) ── */}
            {step >= 1 && step <= 3 && currentQuestion && (
              <motion.div
                key={`q-${step}`}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className={cn('flex h-14 w-14 items-center justify-center rounded-2xl border', currentQuestion.bgColor)}>
                  <currentQuestion.icon className={cn('h-7 w-7', currentQuestion.color)} />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-muted mb-1">Question {step} of {QUESTIONS.length}</p>
                  <h2 className="font-heading text-xl font-bold text-text-primary mb-3">
                    {currentQuestion.title}
                  </h2>
                  <p className="text-text-secondary leading-relaxed text-sm">
                    {currentQuestion.subtitle}
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => answer(currentQuestion.role!, true)}
                    className="flex items-center justify-between p-4 rounded-xl border-2 border-primary/30 bg-primary/5 hover:border-primary hover:bg-primary/10 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium text-text-primary">{currentQuestion.yesLabel}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-text-muted group-hover:text-primary transition-colors" />
                  </button>
                  <button
                    onClick={() => answer(currentQuestion.role!, false)}
                    className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-border-hover bg-surface hover:bg-background-elevated transition-all text-left group"
                  >
                    <span className="text-text-secondary">{currentQuestion.noLabel}</span>
                    <ChevronRight className="h-4 w-4 text-text-muted group-hover:text-text-secondary transition-colors" />
                  </button>
                </div>
                <button
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  className="flex items-center gap-1 text-sm text-text-muted hover:text-text-secondary transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
              </motion.div>
            )}

            {/* ── Summary step ── */}
            {step === 4 && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="font-heading text-xl font-bold text-text-primary mb-2">
                    Here's your setup
                  </h2>
                  <p className="text-text-secondary text-sm">
                    We'll activate the following roles for your account:
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Investor always shown */}
                  <SummaryRoleCard
                    icon={TrendingUp}
                    label="Investor"
                    description="Browse & invest in tokenized cars"
                    color="text-emerald-400"
                    bgColor="bg-emerald-500/10 border-emerald-500/20"
                    active
                    alwaysOn
                  />
                  {answers.car_owner && (
                    <SummaryRoleCard
                      icon={Car}
                      label="Car Owner"
                      description="Tokenize your vehicle & manage investors"
                      color="text-blue-400"
                      bgColor="bg-blue-500/10 border-blue-500/20"
                      active
                    />
                  )}
                  {answers.driver && (
                    <SummaryRoleCard
                      icon={Gauge}
                      label="Driver"
                      description="Drive tokenized cars & earn commission"
                      color="text-purple-400"
                      bgColor="bg-purple-500/10 border-purple-500/20"
                      active
                    />
                  )}
                  {!answers.car_owner && !answers.driver && (
                    <p className="text-sm text-text-muted italic">
                      Just starting as an investor — you can add more roles later.
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    variant="glow"
                    size="lg"
                    className="w-full"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Confirm & Go to Dashboard
                  </Button>
                  <button
                    onClick={() => setStep(3)}
                    className="flex items-center justify-center gap-1 text-sm text-text-muted hover:text-text-secondary transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Go back and change
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Summary role card ────────────────────────────────────────────────────────

function SummaryRoleCard({
  icon: Icon,
  label,
  description,
  color,
  bgColor,
  active,
  alwaysOn,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  active: boolean;
  alwaysOn?: boolean;
}) {
  return (
    <div className={cn('flex items-center gap-3 p-3 rounded-xl border', active ? bgColor : 'bg-surface border-border opacity-40')}>
      <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg shrink-0', active ? bgColor : 'bg-background-elevated border border-border')}>
        <Icon className={cn('h-4.5 w-4.5', active ? color : 'text-text-muted')} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm text-text-primary">{label}</p>
          {alwaysOn && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">Default</span>
          )}
        </div>
        <p className="text-xs text-text-muted truncate">{description}</p>
      </div>
      {active && <Check className={cn('h-4 w-4 shrink-0', color)} />}
    </div>
  );
}
