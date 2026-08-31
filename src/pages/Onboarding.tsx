import { Loader2 } from 'lucide-react';
import { useOnboardingStore } from '../store/onboardingStore';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { Step1Organization } from '../components/onboarding/Step1Organization';
import { Step2Sites } from '../components/onboarding/Step2Sites';
import { Step3Discovery } from '../components/onboarding/Step3Discovery';
import { Step4Credentials } from '../components/onboarding/Step4Credentials';
import { Step5Scope } from '../components/onboarding/Step5Scope';
import { Step6DiscoveryTopology } from '../components/onboarding/Step6DiscoveryTopology';
import { Step7AIPolicy } from '../components/onboarding/Step7AIPolicy';
import { Step8Notifications } from '../components/onboarding/Step8Notifications';
import { Step9Launch } from '../components/onboarding/Step9Launch';

const steps = [
  Step1Organization,
  Step2Sites,
  Step3Discovery,
  Step4Credentials,
  Step5Scope,
  Step6DiscoveryTopology,
  Step7AIPolicy,
  Step8Notifications,
  Step9Launch,
];

export function Onboarding() {
  const currentStep = useOnboardingStore((s) => s.currentStep);
  const authStatus = useRequireAuth();

  if (authStatus === 'checking') {
    return (
      <div className="flex h-screen w-screen items-center justify-center gap-3 bg-base text-text-muted">
        <Loader2 size={16} className="animate-spin" />
        <span className="font-mono text-xs">Checking session…</span>
      </div>
    );
  }

  const StepComponent = steps[currentStep - 1] ?? Step1Organization;
  return <StepComponent />;
}
