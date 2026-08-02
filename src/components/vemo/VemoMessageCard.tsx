import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronDown, Copy, Zap } from 'lucide-react';
import { toast } from 'sonner';
import type { VemoMessage } from '../../data/vemoConversation';
import { Badge } from '../primitives/Badge';
import { Modal } from '../primitives/Modal';
import { Button } from '../primitives/Button';
import { cn } from '../../lib/cn';

function TypingText({ text, onDone }: { text: string; onDone?: () => void }) {
  const [shown, setShown] = useState('');
  useEffect(() => {
    setShown('');
    let i = 0;
    const t = setInterval(() => {
      i += 2;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(t);
        onDone?.();
      }
    }, 12);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  return <span>{shown}</span>;
}

export function VemoMessageCard({ msg, typing = false }: { msg: VemoMessage; typing?: boolean }) {
  const [evidenceOpen, setEvidenceOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [applied, setApplied] = useState(false);
  const [conclusionDone, setConclusionDone] = useState(!typing);

  if (msg.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-card rounded-tr-sm bg-elevated px-3.5 py-2.5 text-sm text-text-bright">{msg.text}</div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="w-full max-w-[95%] rounded-card rounded-tl-sm border border-border-subtle bg-surface p-4">
        <p className="text-sm leading-relaxed text-text-bright">
          {typing ? <TypingText text={msg.conclusion ?? ''} onDone={() => setConclusionDone(true)} /> : msg.conclusion}
        </p>

        {conclusionDone && msg.confidence !== undefined && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 flex items-center gap-2">
            <Badge tone="blue">{msg.confidence}% confidence</Badge>
          </motion.div>
        )}

        {conclusionDone && msg.evidence && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-3">
            <button
              onClick={() => setEvidenceOpen(!evidenceOpen)}
              className="flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-text-bright"
            >
              <ChevronDown size={13} className={cn('transition-transform', evidenceOpen && 'rotate-180')} />
              Evidence
            </button>
            <motion.div
              initial={false}
              animate={{ height: evidenceOpen ? 'auto' : 0, opacity: evidenceOpen ? 1 : 0 }}
              className="overflow-hidden"
            >
              <ul className="mt-2 space-y-1.5 rounded-inset bg-void/60 p-3 font-mono text-[11.5px] leading-relaxed text-text-default">
                {msg.evidence.map((e, i) => (
                  <li key={i}>• {e}</li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        )}

        {conclusionDone && msg.fix && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-3">
            <p className="mb-1.5 text-xs font-medium text-text-muted">Recommended fix</p>
            <p className="mb-2 text-xs text-text-default">{msg.fix.label}</p>
            <div className="relative rounded-inset border border-border-subtle bg-void">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(msg.fix!.snippet);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="absolute right-2 top-2 rounded-btn p-1.5 text-text-muted hover:bg-elevated hover:text-text-bright"
                aria-label="Copy snippet"
              >
                {copied ? <Check size={13} className="text-green" /> : <Copy size={13} />}
              </button>
              <pre className="overflow-x-auto p-3 pr-9 font-mono text-[11.5px] leading-relaxed text-cyan">{msg.fix.snippet}</pre>
            </div>
            <Button
              variant="solid"
              size="sm"
              className="mt-2.5 w-full"
              disabled={applied}
              onClick={() => setConfirmOpen(true)}
            >
              <Zap size={13} />
              {applied ? 'Fix applied' : 'Apply fix'}
            </Button>
          </motion.div>
        )}

        <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Apply recommended fix?" width={420}>
          <p className="text-sm text-text-default">
            This will push a configuration change based on Vemo's diagnosis. This is a visual simulation — no real device will be modified.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="solid"
              size="sm"
              onClick={() => {
                setConfirmOpen(false);
                setApplied(true);
                toast.success('Fix applied successfully');
              }}
            >
              Confirm & apply
            </Button>
          </div>
        </Modal>
      </div>
    </div>
  );
}
