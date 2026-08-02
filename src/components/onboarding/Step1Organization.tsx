import { Cloud, Server, Layers } from 'lucide-react';
import { useOnboardingStore, type DeploymentType } from '../../store/onboardingStore';
import { WizardShell } from './WizardShell';
import { StepHeader, InfoNote, FieldLabel, TextInput, Select, SelectableCard } from './shared';

const industries = ['Hospital', 'University', 'School', 'Hotel', 'Manufacturing', 'Bank', 'Government', 'Retail', 'Data Center', 'Corporate Office', 'MSP', 'Other'];
const countries = ['United States', 'United Kingdom', 'Turkey', 'Germany', 'France', 'UAE', 'Canada', 'Australia', 'Other'];
const deviceScales = ['1-50', '51-200', '201-500', '500+'];

const deployments: { id: DeploymentType; title: string; desc: string; icon: React.ReactNode; badge?: string }[] = [
  { id: 'cloud', title: 'Cloud', desc: 'PathVector runs in our secure cloud. No infrastructure to manage. Fastest setup.', icon: <Cloud size={18} strokeWidth={1.75} />, badge: 'Recommended' },
  { id: 'onprem', title: 'On-Premise', desc: 'Run PathVector on your own servers. Full data sovereignty. Requires Kubernetes.', icon: <Server size={18} strokeWidth={1.75} /> },
  { id: 'hybrid', title: 'Hybrid', desc: 'Cloud analytics with on-premise data collection. Best of both worlds.', icon: <Layers size={18} strokeWidth={1.75} /> },
];

export function Step1Organization() {
  const s = useOnboardingStore();
  const canContinue = s.orgName.trim().length > 0 && s.industry.length > 0;

  return (
    <WizardShell canContinue={canContinue}>
      <StepHeader title="Your Organization" subtitle="Tell us about your organization so we can tailor PathVector to it." />

      <div className="space-y-5">
        <div>
          <FieldLabel>Organization Name</FieldLabel>
          <TextInput placeholder="e.g. Alexandria General Hospital" value={s.orgName} onChange={(e) => s.setField('orgName', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>Industry</FieldLabel>
            <Select value={s.industry} onChange={(e) => s.setField('industry', e.target.value)}>
              <option value="">Select industry…</option>
              {industries.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <FieldLabel>Country</FieldLabel>
            <Select value={s.country} onChange={(e) => s.setField('country', e.target.value)}>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <FieldLabel>Time Zone</FieldLabel>
          <TextInput value={s.timeZone} onChange={(e) => s.setField('timeZone', e.target.value)} />
        </div>

        <InfoNote>This customizes your dashboards, alert priorities, and AI explanations to match your operational context. It does not affect network functionality.</InfoNote>

        <div className="pt-3">
          <p className="mb-3 font-display text-sm font-semibold text-text-bright">Deployment</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {deployments.map((d) => (
              <SelectableCard
                key={d.id}
                selected={s.deployment === d.id}
                onClick={() => s.setField('deployment', d.id)}
                icon={d.icon}
                title={d.title}
                description={d.desc}
                badge={d.badge}
              />
            ))}
          </div>
        </div>

        <div className="pt-3">
          <p className="mb-3 font-display text-sm font-semibold text-text-bright">Scale</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Number of Sites</FieldLabel>
              <TextInput
                type="number"
                min={1}
                max={50}
                value={s.siteCount}
                onChange={(e) => s.setField('siteCount', Number(e.target.value) || 1)}
              />
            </div>
            <div>
              <FieldLabel>Estimated Network Devices</FieldLabel>
              <Select value={s.deviceScale} onChange={(e) => s.setField('deviceScale', e.target.value)}>
                {deviceScales.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>
      </div>
    </WizardShell>
  );
}
