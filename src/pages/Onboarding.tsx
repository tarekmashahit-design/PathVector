import { Navigate } from 'react-router-dom';
import { useOnboardingStore } from '../store/onboardingStore';
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

  if (typeof window !== 'undefined' && localStorage.getItem('pv_auth') !== '1') {
    return <Navigate to="/login" replace />;
  }

  const StepComponent = steps[currentStep - 1] ?? Step1Organization;
  return <StepComponent />;
}
