import type { Device } from '../data/devices';
import type { TopoNode, TopoEdge } from '../data/topology';
import type { Alert } from '../data/alerts';
import type { RiskDevice } from '../data/metrics';

// Mirrors demoApi.ts's DEMO_API_BASE pattern — same backend, same base URL.
export const LIVE_API_BASE = import.meta.env.VITE_DEMO_API_BASE ?? 'http://localhost:8000';

const SESSION_TOKEN_KEY = 'pv_live_session_token';

export function getLiveSessionToken(): string | null {
  return sessionStorage.getItem(SESSION_TOKEN_KEY);
}

export function setLiveSessionToken(token: string): void {
  sessionStorage.setItem(SESSION_TOKEN_KEY, token);
}

export function clearLiveSessionToken(): void {
  sessionStorage.removeItem(SESSION_TOKEN_KEY);
}

/** Thrown when the backend rejects the session token (missing/expired) —
 * callers should redirect to /app/live/connect on this. */
export class LiveSessionError extends Error {}

async function liveFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = getLiveSessionToken();
  const res = await fetch(`${LIVE_API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(token ? { 'X-Session-Token': token } : {}),
    },
  });
  if (res.status === 401) {
    clearLiveSessionToken();
    throw new LiveSessionError('Live session missing or expired');
  }
  return res;
}

export async function connectToDevice(params: { ip: string; username?: string; password?: string; secret?: string }): Promise<{ session_token: string; device_count: number; warnings: string[] }> {
  const res = await fetch(`${LIVE_API_BASE}/api/live/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail ?? 'Failed to connect to device');
  }
  const data = await res.json();
  setLiveSessionToken(data.session_token);
  return data;
}

export interface LiveDashboardStats {
  healthScore: number;
  healthTrend: number;
  totalDevices: number;
  activeAlerts: number;
  uptime: number;
  avgLatency: number;
}

export interface LiveDashboardResponse {
  stats: LiveDashboardStats;
  alerts: Alert[];
  bandwidthSeries: { hour: string; mbps: number }[];
  severityBreakdown: { name: string; value: number; color: string }[];
  riskLeaderboard: RiskDevice[];
}

export async function fetchLiveDashboard(): Promise<LiveDashboardResponse> {
  const res = await liveFetch('/api/live/dashboard');
  if (!res.ok) throw new Error('Failed to load live dashboard');
  return res.json();
}

export async function fetchLiveTopology(): Promise<{ nodes: TopoNode[]; edges: TopoEdge[] }> {
  const res = await liveFetch('/api/live/topology');
  if (!res.ok) throw new Error('Failed to load live topology');
  return res.json();
}

export async function fetchLiveDevices(): Promise<{ devices: Device[] }> {
  const res = await liveFetch('/api/live/devices');
  if (!res.ok) throw new Error('Failed to load live devices');
  return res.json();
}

export async function askLiveVemo(message: string, history?: { role: string; content: string }[]): Promise<{ response: string; confidence: number }> {
  const res = await liveFetch('/api/live/vemo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail ?? 'Vemo request failed');
  }
  return res.json();
}
