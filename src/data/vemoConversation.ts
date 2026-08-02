export interface VemoEvidence {
  point: string;
}

export interface VemoMessage {
  id: string;
  role: 'user' | 'vemo';
  text: string;
  conclusion?: string;
  confidence?: number;
  evidence?: string[];
  fix?: { label: string; snippet: string };
}

export const seededConversation: VemoMessage[] = [
  { id: 'm1', role: 'user', text: 'why is Floor 2 wifi slow?' },
  {
    id: 'm2', role: 'vemo', text: '',
    conclusion: 'Floor 2 Wi-Fi slowness is caused by channel congestion on `AP-FL2-04`, compounded by a client load spike from an unclassified device on the wired side.',
    confidence: 87,
    evidence: [
      '`AP-FL2-04` retransmit rate: 6.1% (baseline 1-2%)',
      '`Gi0/12` on `SW-ACC-07` at 312 Mb/s, 340% above its 30-day baseline',
      '22 active clients on 5GHz radio, 3 more than the AP’s tuned capacity',
    ],
    fix: {
      label: 'Move AP-FL2-04 to a clear DFS channel and rate-limit Gi0/12',
      snippet: 'interface GigabitEthernet0/12\n switchport port-security maximum 1\n storm-control broadcast level 5.00\nend\n\nwifi radio 5ghz channel auto\nwifi radio 5ghz power auto',
    },
  },
];

export interface SuggestionSet {
  page: 'dashboard' | 'topology' | 'devices' | 'security' | 'analytics' | 'automations' | 'default';
  chips: string[];
}

export const suggestionsByPage: SuggestionSet[] = [
  { page: 'dashboard', chips: ['Why did health score drop?', 'Summarize today’s alerts', 'What needs attention first?'] },
  { page: 'topology', chips: ['Explain the SW-DIST-03 fault', 'Show me redundancy gaps', 'Which links are congested?'] },
  { page: 'devices', chips: ['Which devices need firmware updates?', 'Find devices with high CPU', 'Compare SW-CORE-01 and 02'] },
  { page: 'security', chips: ['Summarize open threats', 'Explain the port security risk', 'What changed in the last 24h?'] },
  { page: 'analytics', chips: ['Explain the top prediction', 'What’s driving config hygiene score?', 'Show root cause for AN-1'] },
  { page: 'automations', chips: ['Suggest a new automation', 'Which rules ran most this week?', 'Draft a hardening rule'] },
  { page: 'default', chips: ['What needs my attention?', 'Summarize network health', 'Any predicted failures?'] },
];

const canned: Record<string, VemoMessage> = {
  default: {
    id: 'auto', role: 'vemo', text: '',
    conclusion: 'Network health is at 87/100 — stable overall, with one active fault worth prioritizing.',
    confidence: 90,
    evidence: [
      '`SW-DIST-03` → `SW-ACC-11` uplink down 14 minutes, isolating ~47 Floor 3 endpoints from redundancy',
      '3 active alerts, 1 critical, 2 warning',
      'No other devices trending toward threshold in next 24h',
    ],
    fix: {
      label: 'Clear err-disable state on SW-DIST-03 Gi1/0/1',
      snippet: 'interface GigabitEthernet1/0/1\n shutdown\n no shutdown\nend',
    },
  },
};

export function getCannedResponse(_chip: string): VemoMessage {
  return { ...canned.default, id: `auto-${Date.now()}` };
}
