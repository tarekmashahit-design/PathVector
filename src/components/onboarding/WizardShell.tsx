import { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Logomark } from '../icons/Logomark';
import { Button } from '../primitives/Button';
import { useOnboardingStore } from '../../store/onboardingStore';
import { cn } from '../../lib/cn';

const STEP_LABELS = ['Organization', 'Sites', 'Discovery', 'Credentials', 'Scope', 'Topology', 'AI Policy', 'Notify', 'Launch'];

function ProgressBar() {
  const { currentStep, maxStepReached, goToStep } = useOnboardingStore();
  return (
    <div className="mx-auto flex w-full max-w-3xl items-center px-6">
      {STEP_LABELS.map((label, i) => {
        const step = i + 1;
        const done = step < currentStep;
        const active = step === currentStep;
        const reachable = step <= maxStepReached;
        return (
          <div key={label} className="flex flex-1 items-center last:flex-initial">
            <button
              onClick={() => reachable && goToStep(step)}
              disabled={!reachable}
              className="group flex flex-col items-center gap-1.5"
              title={label}
            >
              <motion.span
                animate={{ scale: active ? 1.25 : 1 }}
                className={cn(
                  'flex h-2.5 w-2.5 flex-shrink-0 rounded-full transition-colors',
                  done && 'bg-blue',
                  active && 'bg-blue shadow-[0_0_0_4px_rgba(56,189,248,0.25)]',
                  !done && !active && 'bg-elevated',
                )}
              />
              <span className={cn('hidden font-mono text-[9.5px] sm:block', active ? 'text-blue' : done ? 'text-text-muted' : 'text-text-faint')}>
                {label}
              </span>
            </button>
            {step < STEP_LABELS.length && (
              <div className="mx-1 h-px flex-1 bg-elevated">
                <motion.div
                  initial={false}
                  animate={{ width: step < currentStep ? '100%' : '0%' }}
                  transition={{ duration: 0.4 }}
                  className="h-px bg-blue"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function WizardShell({
  children,
  canContinue = true,
  onContinue,
  isLast = false,
  hideFooter = false,
  wide = false,
}: {
  children: ReactNode;
  canContinue?: boolean;
  onContinue?: () => void;
  isLast?: boolean;
  hideFooter?: boolean;
  wide?: boolean;
}) {
  const navigate = useNavigate();
  const { currentStep, nextStep, prevStep } = useOnboardingStore();

  function handleContinue() {
    if (onContinue) onContinue();
    else nextStep();
  }

  return (
    <div className="flex min-h-screen flex-col app-canvas-texture">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2">
          <Logomark size={24} />
          <span className="font-display text-sm font-semibold text-text-bright">PathVector</span>
        </div>
        <button onClick={() => navigate('/login')} className="text-xs text-text-muted hover:text-text-bright">
          Save &amp; Exit
        </button>
      </header>

      <div className="pb-8 pt-2">
        <ProgressBar />
      </div>

      <main className="flex flex-1 items-start justify-center overflow-y-auto px-6 pb-10">
        <div className={cn('w-full', wide ? 'max-w-[960px]' : 'max-w-[680px]')}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {!hideFooter && (
        <footer className="sticky bottom-0 border-t border-border-subtle bg-base/90 px-6 py-4 backdrop-blur-xl sm:px-10">
          <div className={cn('mx-auto flex items-center justify-between', wide ? 'max-w-[960px]' : 'max-w-[680px]')}>
            <Button variant="ghost" onClick={prevStep} disabled={currentStep === 1}>
              Back
            </Button>
            <Button variant="solid" sheen onClick={handleContinue} disabled={!canContinue}>
              {isLast ? 'Launch PathVector' : 'Continue'}
            </Button>
          </div>
        </footer>
      )}
    </div>
  );
}
