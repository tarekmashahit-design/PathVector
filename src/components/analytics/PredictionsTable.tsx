import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown } from 'lucide-react';
import { predictions, type Prediction } from '../../data/analytics';
import { Badge } from '../primitives/Badge';

type SortKey = 'device' | 'confidence' | 'horizonRisk';
const riskRank = { high: 3, mid: 2, low: 1 };
const horizonTone = { high: 'red', mid: 'amber', low: 'blue' } as const;

export function PredictionsTable() {
  const [sortKey, setSortKey] = useState<SortKey>('horizonRisk');
  const [asc, setAsc] = useState(false);

  const sorted = useMemo(() => {
    const arr = [...predictions];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'device') cmp = a.device.localeCompare(b.device);
      if (sortKey === 'confidence') cmp = a.confidence - b.confidence;
      if (sortKey === 'horizonRisk') cmp = riskRank[a.horizonRisk] - riskRank[b.horizonRisk];
      return asc ? cmp : -cmp;
    });
    return arr;
  }, [sortKey, asc]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setAsc(!asc);
    else {
      setSortKey(key);
      setAsc(false);
    }
  }

  const headers: { key: SortKey | null; label: string }[] = [
    { key: 'device', label: 'Device' },
    { key: null, label: 'Predicted Issue' },
    { key: 'horizonRisk', label: 'Time Horizon' },
    { key: 'confidence', label: 'Confidence' },
    { key: null, label: 'Recommended Action' },
  ];

  return (
    <div>
      <h3 className="mb-3 font-display text-sm font-semibold text-text-bright">Failure Predictions</h3>
      <div className="overflow-x-auto rounded-card border border-border-subtle">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border-subtle bg-elevated/50 text-[10.5px] uppercase text-text-faint">
              {headers.map((h) => (
                <th key={h.label} className="whitespace-nowrap px-3 py-2.5 font-medium">
                  {h.key ? (
                    <button onClick={() => toggleSort(h.key!)} className="flex items-center gap-1 hover:text-text-bright">
                      {h.label} <ArrowUpDown size={11} />
                    </button>
                  ) : (
                    h.label
                  )}
                </th>
              ))}
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <motion.tr key={p.id} layout transition={{ duration: 0.3 }} className="border-b border-border-subtle/60 last:border-0 hover:bg-elevated">
                <td className="px-3 py-3 font-mono text-blue">{p.device}</td>
                <td className="px-3 py-3 text-text-default">{p.issue}</td>
                <td className="px-3 py-3">
                  <Badge tone={horizonTone[p.horizonRisk]}>{p.horizon}</Badge>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-14 overflow-hidden rounded-full bg-elevated">
                      <div className="h-full rounded-full bg-blue" style={{ width: `${p.confidence}%` }} />
                    </div>
                    <span className="font-mono text-text-muted">{p.confidence}%</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-text-default">{p.action}</td>
                <td className="px-3 py-3">
                  <button className="rounded-btn border border-border-subtle px-2.5 py-1 text-[11px] text-text-muted hover:border-blue/40 hover:text-text-bright">
                    Ask Vemo
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
