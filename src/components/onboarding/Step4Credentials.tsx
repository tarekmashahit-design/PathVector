import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Eye, EyeOff, CheckCircle2, AlertTriangle, XCircle, Loader2, ChevronDown, ShieldCheck } from 'lucide-react';
import { useOnboardingStore, uid, type CredentialProfile, type TestResult } from '../../store/onboardingStore';
import { WizardShell } from './WizardShell';
import { StepHeader } from './shared';
import { Button } from '../primitives/Button';
import { cn } from '../../lib/cn';

type ProtocolTab = 'ssh' | 'snmp' | 'netconf' | 'api';
const tabs: { id: ProtocolTab; label: string }[] = [
  { id: 'ssh', label: 'SSH' },
  { id: 'snmp', label: 'SNMP' },
  { id: 'netconf', label: 'NETCONF' },
  { id: 'api', label: 'API Token' },
];

function PasswordInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-btn border border-border-subtle bg-void/40 px-3 py-2 pr-9 text-sm text-text-bright outline-none focus:border-blue/40"
      />
      <button type="button" onClick={() => setShow(!show)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-faint hover:text-text-bright">
        {show ? <EyeOff size={13} /> : <Eye size={13} />}
      </button>
    </div>
  );
}

function TextField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-btn border border-border-subtle bg-void/40 px-3 py-2 text-sm text-text-bright outline-none focus:border-blue/40"
    />
  );
}

function ProfileCard({ profile, onUpdate }: { profile: CredentialProfile; onUpdate: (p: CredentialProfile) => void }) {
  const [tab, setTab] = useState<ProtocolTab>('ssh');
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-card border border-border-subtle bg-surface p-4">
      <button onClick={() => setExpanded(!expanded)} className="flex w-full items-center justify-between text-left">
        <input
          value={profile.name}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onUpdate({ ...profile, name: e.target.value })}
          className="font-display text-sm font-semibold text-text-bright outline-none"
        />
        <ChevronDown size={14} className={cn('text-text-muted transition-transform', expanded && 'rotate-180')} />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-3 flex gap-1 border-b border-border-subtle">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'border-b-2 px-3 py-2 font-mono text-[11px] transition-colors',
                    tab === t.id ? 'border-blue text-blue' : 'border-transparent text-text-muted hover:text-text-bright',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              {tab === 'ssh' && (
                <>
                  <TextField value={profile.ssh.username} onChange={(v) => onUpdate({ ...profile, ssh: { ...profile.ssh, username: v } })} placeholder="Username" />
                  <PasswordInput value={profile.ssh.password} onChange={(v) => onUpdate({ ...profile, ssh: { ...profile.ssh, password: v } })} placeholder="Password" />
                  <PasswordInput value={profile.ssh.enableSecret} onChange={(v) => onUpdate({ ...profile, ssh: { ...profile.ssh, enableSecret: v } })} placeholder="Enable Secret (optional)" />
                </>
              )}
              {tab === 'snmp' && (
                <>
                  <div className="col-span-2 flex gap-1.5">
                    {(['v2c', 'v3'] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => onUpdate({ ...profile, snmp: { ...profile.snmp, version: v } })}
                        className={cn('rounded-btn border px-3 py-1.5 font-mono text-xs', profile.snmp.version === v ? 'border-blue/40 bg-blue/10 text-blue' : 'border-border-subtle text-text-muted')}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  {profile.snmp.version === 'v2c' ? (
                    <TextField value={profile.snmp.community} onChange={(v) => onUpdate({ ...profile, snmp: { ...profile.snmp, community: v } })} placeholder="Community String" />
                  ) : (
                    <>
                      <TextField value={profile.snmp.username} onChange={(v) => onUpdate({ ...profile, snmp: { ...profile.snmp, username: v } })} placeholder="Username" />
                      <PasswordInput value={profile.snmp.authPassword} onChange={(v) => onUpdate({ ...profile, snmp: { ...profile.snmp, authPassword: v } })} placeholder="Auth Password" />
                      <PasswordInput value={profile.snmp.privPassword} onChange={(v) => onUpdate({ ...profile, snmp: { ...profile.snmp, privPassword: v } })} placeholder="Privacy Password" />
                    </>
                  )}
                </>
              )}
              {tab === 'netconf' && (
                <>
                  <TextField value={profile.netconf.username} onChange={(v) => onUpdate({ ...profile, netconf: { ...profile.netconf, username: v } })} placeholder="Username" />
                  <PasswordInput value={profile.netconf.password} onChange={(v) => onUpdate({ ...profile, netconf: { ...profile.netconf, password: v } })} placeholder="Password" />
                  <TextField value={profile.netconf.port} onChange={(v) => onUpdate({ ...profile, netconf: { ...profile.netconf, port: v } })} placeholder="Port (830)" />
                </>
              )}
              {tab === 'api' && (
                <>
                  <PasswordInput value={profile.apiToken.token} onChange={(v) => onUpdate({ ...profile, apiToken: { ...profile.apiToken, token: v } })} placeholder="API Token" />
                  <TextField value={profile.apiToken.baseUrl} onChange={(v) => onUpdate({ ...profile, apiToken: { ...profile.apiToken, baseUrl: v } })} placeholder="Base URL" />
                  <p className="col-span-2 text-[11px] text-text-faint">For Meraki, UniFi, Aruba Central, and other API-managed platforms.</p>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const testSequence: { protocol: string; status: TestResult['status']; message: string; fix?: string }[] = [
  { protocol: 'SSH', status: 'success', message: 'Connected' },
  { protocol: 'SNMP', status: 'success', message: 'Responding (v3)' },
  { protocol: 'Syslog', status: 'warning', message: 'Not configured yet — will guide you after setup', fix: 'Point your devices\' syslog output at the PathVector collector IP. We\'ll show you the exact commands after setup.' },
  { protocol: 'NETCONF', status: 'success', message: 'Connected' },
  { protocol: 'NetFlow', status: 'warning', message: 'No flow data received yet', fix: 'Enable NetFlow/sFlow export on your core switches pointed at the PathVector collector. Data typically appears within 5 minutes.' },
];

function statusIcon(status: TestResult['status']) {
  if (status === 'testing') return <Loader2 size={14} className="animate-spin text-blue" />;
  if (status === 'success') return <CheckCircle2 size={14} className="text-green" />;
  if (status === 'warning') return <AlertTriangle size={14} className="text-amber" />;
  if (status === 'error') return <XCircle size={14} className="text-red" />;
  return <Loader2 size={14} className="text-text-faint" />;
}

export function Step4Credentials() {
  const s = useOnboardingStore();
  const [openFix, setOpenFix] = useState<string | null>(null);

  function runTests() {
    const pending: TestResult[] = testSequence.map((t) => ({ protocol: t.protocol, status: 'testing', message: '' }));
    s.setField('testResults', pending);
    testSequence.forEach((t, i) => {
      setTimeout(() => {
        s.setField(
          'testResults',
          useOnboardingStore.getState().testResults.map((r) => (r.protocol === t.protocol ? { protocol: t.protocol, status: t.status, message: t.message, fix: t.fix } : r)),
        );
      }, 500 + i * 450);
    });
    s.setField('testsRun', true);
  }

  useEffect(() => {
    if (!s.testsRun) runTests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateProfile(updated: CredentialProfile) {
    s.setField('profiles', s.profiles.map((p) => (p.id === updated.id ? updated : p)));
  }
  function addProfile() {
    s.setField('profiles', [
      ...s.profiles,
      {
        id: uid(),
        name: `Profile ${s.profiles.length + 1}`,
        ssh: { username: '', password: '', enableSecret: '' },
        snmp: { version: 'v2c', community: '', username: '', authProtocol: 'SHA', authPassword: '', privProtocol: 'AES', privPassword: '' },
        netconf: { username: '', password: '', port: '830' },
        apiToken: { token: '', baseUrl: '' },
      },
    ]);
  }

  const canContinue = s.profiles.length > 0;

  return (
    <WizardShell canContinue={canContinue}>
      <StepHeader title="Network Credentials" subtitle="PathVector needs credentials to communicate with your devices. All credentials are encrypted at rest with AES-256." />

      <div className="space-y-3">
        {s.profiles.map((p) => (
          <ProfileCard key={p.id} profile={p} onUpdate={updateProfile} />
        ))}
      </div>

      <Button variant="ghost" className="mt-3 w-full" onClick={addProfile}>
        <Plus size={14} /> Create Profile
      </Button>

      <div className="mt-6 rounded-card border border-border-subtle bg-void/40 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-1.5 font-display text-sm font-semibold text-text-bright">
            <ShieldCheck size={15} className="text-blue" /> Test Credentials
          </p>
          <button onClick={runTests} className="rounded-btn border border-border-subtle px-2.5 py-1 text-[11px] text-text-muted hover:border-blue/40 hover:text-text-bright">
            Re-run
          </button>
        </div>
        <ul className="space-y-2">
          {(s.testResults.length ? s.testResults : testSequence.map((t) => ({ protocol: t.protocol, status: 'pending' as const, message: '', fix: t.fix }))).map((r) => (
            <li key={r.protocol} className="rounded-inset border border-border-subtle bg-surface px-3 py-2.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-mono text-xs text-text-bright">
                  {statusIcon(r.status)}
                  {r.protocol}
                </span>
                <span className={cn('text-xs', r.status === 'success' && 'text-green', r.status === 'warning' && 'text-amber', r.status === 'error' && 'text-red', r.status === 'testing' && 'text-text-muted')}>
                  {r.status === 'testing' ? 'Testing…' : r.message}
                </span>
              </div>
              {r.fix && (
                <div className="mt-1.5">
                  <button onClick={() => setOpenFix(openFix === r.protocol ? null : r.protocol)} className="text-[10.5px] text-blue hover:underline">
                    How to fix
                  </button>
                  <AnimatePresence initial={false}>
                    {openFix === r.protocol && (
                      <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-1.5 overflow-hidden text-[11px] leading-relaxed text-text-muted">
                        {r.fix}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </WizardShell>
  );
}
