import type { DemoDevice, DemoFinding, DemoScores, DemoTopology } from '../types/demo';

export const DEMO_API_BASE = 'http://localhost:8000';

export async function uploadDemoFile(file: File): Promise<{ session_id: string }> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${DEMO_API_BASE}/api/demo/upload`, { method: 'POST', body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail ?? 'Upload failed');
  }
  return res.json();
}

export async function startFixtureSession(): Promise<{ session_id: string }> {
  const res = await fetch(`${DEMO_API_BASE}/api/demo/fixture`, { method: 'POST' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail ?? 'Failed to start demo session');
  }
  return res.json();
}

export function subscribeToAnalysis(
  sessionId: string,
  handlers: {
    onParsed?: (data: { message: string; topology: DemoTopology; warning?: string }) => void;
    onAnalyzed?: (data: { message: string; findings: DemoFinding[] }) => void;
    onScored?: (data: { message: string; scores: DemoScores }) => void;
    onAiDiagnosed?: (data: { finding: DemoFinding }) => void;
    onComplete?: (data: { topology: DemoTopology; findings: DemoFinding[]; scores: DemoScores; summary: string }) => void;
    onError?: (data: { message: string }) => void;
  },
): () => void {
  const source = new EventSource(`${DEMO_API_BASE}/api/demo/${sessionId}/stream`);

  const bind = (name: string, cb?: (data: any) => void) => {
    if (!cb) return;
    source.addEventListener(name, (e: MessageEvent) => {
      try {
        cb(JSON.parse(e.data));
      } catch {
        // ignore malformed payloads
      }
    });
  };

  bind('parsed', handlers.onParsed);
  bind('analyzed', handlers.onAnalyzed);
  bind('scored', handlers.onScored);
  bind('ai_diagnosed', handlers.onAiDiagnosed);
  bind('complete', (data) => {
    handlers.onComplete?.(data);
    source.close();
  });
  bind('error', (data) => {
    handlers.onError?.(data);
    source.close();
  });

  source.onerror = () => {
    // EventSource retries automatically; if the session is genuinely gone the
    // backend will 404 on reconnect attempts, which shows up as further errors.
  };

  return () => source.close();
}

export async function fetchTopology(sessionId: string): Promise<DemoTopology> {
  const res = await fetch(`${DEMO_API_BASE}/api/demo/${sessionId}/topology`);
  if (!res.ok) throw new Error('Failed to load topology');
  return res.json();
}

export async function fetchFindings(sessionId: string): Promise<DemoFinding[]> {
  const res = await fetch(`${DEMO_API_BASE}/api/demo/${sessionId}/findings`);
  if (!res.ok) throw new Error('Failed to load findings');
  return res.json();
}

export async function fetchScores(sessionId: string): Promise<DemoScores> {
  const res = await fetch(`${DEMO_API_BASE}/api/demo/${sessionId}/scores`);
  if (!res.ok) throw new Error('Failed to load scores');
  return res.json();
}

export async function fetchSummary(sessionId: string): Promise<{ summary: string }> {
  const res = await fetch(`${DEMO_API_BASE}/api/demo/${sessionId}/summary`);
  if (!res.ok) throw new Error('Failed to load summary');
  return res.json();
}

export async function fetchDevice(sessionId: string, deviceId: string): Promise<{ device: DemoDevice; findings: DemoFinding[] }> {
  const res = await fetch(`${DEMO_API_BASE}/api/demo/${sessionId}/device/${deviceId}`);
  if (!res.ok) throw new Error('Failed to load device');
  return res.json();
}

export async function askVemo(sessionId: string, message: string, history?: { role: string; content: string }[]): Promise<{ response: string; confidence: number }> {
  const res = await fetch(`${DEMO_API_BASE}/api/demo/${sessionId}/vemo`, {
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
