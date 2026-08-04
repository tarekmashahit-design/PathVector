import { create } from 'zustand';
import type { DemoFinding, DemoScores, DemoTopology } from '../types/demo';

interface DemoState {
  sessionId: string | null;
  filename: string | null;
  topology: DemoTopology | null;
  findings: DemoFinding[];
  scores: DemoScores | null;
  summary: string | null;
  analysisComplete: boolean;
  error: string | null;

  setSession: (sessionId: string, filename: string) => void;
  setTopology: (topology: DemoTopology) => void;
  setFindings: (findings: DemoFinding[]) => void;
  updateFinding: (finding: DemoFinding) => void;
  setScores: (scores: DemoScores) => void;
  setComplete: (payload: { topology: DemoTopology; findings: DemoFinding[]; scores: DemoScores; summary: string }) => void;
  setError: (message: string) => void;
  reset: () => void;
}

export const useDemoStore = create<DemoState>((set) => ({
  sessionId: null,
  filename: null,
  topology: null,
  findings: [],
  scores: null,
  summary: null,
  analysisComplete: false,
  error: null,

  setSession: (sessionId, filename) => set({ sessionId, filename, topology: null, findings: [], scores: null, summary: null, analysisComplete: false, error: null }),
  setTopology: (topology) => set({ topology }),
  setFindings: (findings) => set({ findings }),
  updateFinding: (finding) =>
    set((s) => {
      const idx = s.findings.findIndex((f) => f.rule_id === finding.rule_id);
      if (idx === -1) return { findings: [...s.findings, finding] };
      const next = [...s.findings];
      next[idx] = finding;
      return { findings: next };
    }),
  setScores: (scores) => set({ scores }),
  setComplete: (payload) => set({ topology: payload.topology, findings: payload.findings, scores: payload.scores, summary: payload.summary, analysisComplete: true }),
  setError: (message) => set({ error: message }),
  reset: () => set({ sessionId: null, filename: null, topology: null, findings: [], scores: null, summary: null, analysisComplete: false, error: null }),
}));
