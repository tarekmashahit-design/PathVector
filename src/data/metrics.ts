export const bandwidthSeries = Array.from({ length: 24 }, (_, i) => {
  const hour = i;
  const base = 420 + Math.sin((hour - 6) / 3.8) * 260 + (hour > 8 && hour < 19 ? 180 : 0);
  return { hour: `${String(hour).padStart(2, '0')}:00`, mbps: Math.max(60, Math.round(base + Math.random() * 40)) };
});

export const severityBreakdown = [
  { name: 'Info', value: 14, color: '#38BDF8' },
  { name: 'Warning', value: 5, color: '#22D3EE' },
  { name: 'Critical', value: 2, color: '#475569' },
];

export interface RiskDevice {
  rank: number;
  device: string;
  risk: number;
}

export const riskLeaderboard: RiskDevice[] = [
  { rank: 1, device: 'SW-DIST-03', risk: 91 },
  { rank: 2, device: 'SW-ACC-11', risk: 84 },
  { rank: 3, device: 'SW-CORE-02', risk: 63 },
  { rank: 4, device: 'SW-ACC-07', risk: 52 },
  { rank: 5, device: 'AP-FL2-04', risk: 41 },
];

export const dashboardStats = {
  healthScore: 87,
  healthTrend: 2,
  totalDevices: 23,
  activeAlerts: 3,
  uptime: 99.7,
  avgLatency: 2.4,
};

export const sparkTemplates = {
  devices: [21, 22, 22, 23, 23, 23, 23],
  alerts: [1, 2, 2, 3, 2, 3, 3],
  uptime: [99.9, 99.8, 99.9, 99.7, 99.8, 99.7, 99.7],
  latency: [2.1, 2.2, 2.0, 2.6, 2.3, 2.5, 2.4],
};
