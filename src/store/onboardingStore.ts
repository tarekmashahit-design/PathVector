import { create } from 'zustand';

export interface Floor {
  id: string;
  name: string;
}
export interface Building {
  id: string;
  name: string;
  floors: Floor[];
}
export interface Site {
  id: string;
  name: string;
  buildings: Building[];
}

export type DeploymentType = 'cloud' | 'onprem' | 'hybrid';
export type DiscoveryMethod = 'auto' | 'import' | 'manual';

export interface CredentialProfile {
  id: string;
  name: string;
  ssh: { username: string; password: string; enableSecret: string };
  snmp: {
    version: 'v2c' | 'v3';
    community: string;
    username: string;
    authProtocol: 'SHA' | 'MD5';
    authPassword: string;
    privProtocol: 'AES' | 'DES';
    privPassword: string;
  };
  netconf: { username: string; password: string; port: string };
  apiToken: { token: string; baseUrl: string };
}

export interface TestResult {
  protocol: string;
  status: 'pending' | 'testing' | 'success' | 'warning' | 'error';
  message: string;
  fix?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface DiscoveredDevice {
  id: string;
  name: string;
  model: string;
  type: 'router' | 'core-switch' | 'access-switch' | 'ap' | 'server';
  ip: string;
  via: string;
}

interface OnboardingState {
  currentStep: number;
  maxStepReached: number;

  // Step 1
  orgName: string;
  industry: string;
  country: string;
  timeZone: string;
  deployment: DeploymentType;
  siteCount: number;
  deviceScale: string;

  // Step 2
  sites: Site[];

  // Step 3
  discoveryMethods: DiscoveryMethod[];
  ipRanges: string;
  uploadedFileName: string | null;

  // Step 4
  profiles: CredentialProfile[];
  testResults: TestResult[];
  testsRun: boolean;

  // Step 5
  monitoringScope: Record<string, boolean>;

  // Step 6
  discoveredDevices: DiscoveredDevice[];
  discoveryComplete: boolean;
  topologyApproved: boolean;

  // Step 7
  automationPolicy: string;

  // Step 8
  integrations: Record<string, { connected: boolean; value?: string }>;
  severityRouting: { critical: string[]; warning: string[]; info: string[] };
  team: TeamMember[];

  // actions
  setField: <K extends keyof OnboardingState>(key: K, value: OnboardingState[K]) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (n: number) => void;
}

const uid = () => Math.random().toString(36).slice(2, 9);

export const useOnboardingStore = create<OnboardingState>((set) => ({
  currentStep: 1,
  maxStepReached: 1,

  orgName: '',
  industry: '',
  country: Intl.DateTimeFormat().resolvedOptions().locale.split('-')[1] ?? 'US',
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  deployment: 'cloud',
  siteCount: 1,
  deviceScale: '1-50',

  sites: [
    {
      id: uid(),
      name: 'Main Campus',
      buildings: [
        {
          id: uid(),
          name: 'Building A',
          floors: [
            { id: uid(), name: 'Floor 1' },
            { id: uid(), name: 'Floor 2' },
          ],
        },
      ],
    },
  ],

  discoveryMethods: ['auto'],
  ipRanges: '',
  uploadedFileName: null,

  profiles: [
    {
      id: uid(),
      name: 'Default',
      ssh: { username: 'admin', password: '••••••••', enableSecret: '' },
      snmp: { version: 'v2c', community: 'PathVector', username: '', authProtocol: 'SHA', authPassword: '', privProtocol: 'AES', privPassword: '' },
      netconf: { username: '', password: '', port: '830' },
      apiToken: { token: '', baseUrl: '' },
    },
  ],
  testResults: [],
  testsRun: false,

  monitoringScope: {
    deviceHealth: true,
    interfaceStats: true,
    syslog: true,
    trafficFlow: true,
    configBackup: true,
    topologyDiscovery: true,
    aiMonitoring: true,
    predictiveAnalytics: true,
    continuousHardening: false,
    userDeviceTracking: false,
    bandwidthMonitoring: true,
    configDriftDetection: true,
  },

  discoveredDevices: [],
  discoveryComplete: false,
  topologyApproved: false,

  automationPolicy: 'approval',

  integrations: {
    email: { connected: true, value: 'admin@pathvector.io' },
    teams: { connected: false },
    slack: { connected: false },
    discord: { connected: false },
    sms: { connected: false },
    pagerduty: { connected: false },
    webhook: { connected: false },
  },
  severityRouting: { critical: ['email'], warning: ['email'], info: [] },
  team: [{ id: uid(), name: 'You', email: 'admin@pathvector.io', role: 'Owner' }],

  setField: (key, value) => set({ [key]: value } as Partial<OnboardingState>),
  nextStep: () =>
    set((s) => {
      const next = Math.min(9, s.currentStep + 1);
      return { currentStep: next, maxStepReached: Math.max(s.maxStepReached, next) };
    }),
  prevStep: () => set((s) => ({ currentStep: Math.max(1, s.currentStep - 1) })),
  goToStep: (n) => set((s) => ({ currentStep: Math.min(s.maxStepReached, Math.max(1, n)) })),
}));

export { uid };
