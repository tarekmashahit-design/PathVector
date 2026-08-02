import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Send, Mic } from 'lucide-react';
import { toast } from 'sonner';
import { useAppShell } from '../../context/AppShellContext';
import { VemoOrb } from '../primitives/VemoOrb';
import { VemoMessageCard } from './VemoMessageCard';
import { seededConversation, suggestionsByPage, getCannedResponse, type VemoMessage } from '../../data/vemoConversation';

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-1.5 rounded-card rounded-tl-sm border border-border-subtle bg-surface px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-blue"
          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

export function VemoDrawer() {
  const { vemoOpen, setVemoOpen, currentSection } = useAppShell();
  const [messages, setMessages] = useState<VemoMessage[]>(seededConversation);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [typingId, setTypingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chips = (suggestionsByPage.find((s) => s.page === currentSection) ?? suggestionsByPage.find((s) => s.page === 'default'))!.chips;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  function send(text: string) {
    if (!text.trim()) return;
    const userMsg: VemoMessage = { id: `u-${Date.now()}`, role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setThinking(true);
    setTimeout(() => {
      const resp = getCannedResponse(text);
      setThinking(false);
      setMessages((prev) => [...prev, resp]);
      setTypingId(resp.id);
    }, 900 + Math.random() * 500);
  }

  return (
    <AnimatePresence>
      {vemoOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-void/60 backdrop-blur-sm"
            onClick={() => setVemoOpen(false)}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 z-50 flex h-full w-[420px] max-w-full flex-col border-l border-border-subtle bg-base/95 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
              <div className="flex items-center gap-2.5">
                <VemoOrb size={26} />
                <div>
                  <p className="font-display text-sm font-semibold text-text-bright">Vemo</p>
                  <p className="flex items-center gap-1 font-mono text-[10px] text-green">
                    <span className="h-1.5 w-1.5 rounded-full bg-green animate-pulse-dot" /> online
                  </p>
                </div>
              </div>
              <button onClick={() => setVemoOpen(false)} className="rounded-btn p-1.5 text-text-muted hover:bg-elevated hover:text-text-bright">
                <X size={18} />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {messages.map((m) => (
                <VemoMessageCard key={m.id} msg={m} typing={m.id === typingId} />
              ))}
              {thinking && <ThinkingIndicator />}
            </div>

            <div className="border-t border-border-subtle px-5 py-4">
              <div className="mb-3 flex flex-wrap gap-1.5">
                {chips.map((c) => (
                  <button
                    key={c}
                    onClick={() => send(c)}
                    className="rounded-pill border border-border-subtle bg-surface px-2.5 py-1 text-[11px] text-text-muted transition-colors hover:border-blue/40 hover:text-text-bright hover:shadow-glow-blue-sm"
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 rounded-pill border border-border-subtle bg-surface px-3 py-2 focus-within:border-blue/40 focus-within:shadow-glow-blue-sm">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && send(input)}
                  placeholder="Ask about your network…"
                  className="w-full bg-transparent text-sm text-text-default outline-none placeholder:text-text-muted"
                />
                <button
                  onClick={() => toast.message('Voice input coming soon')}
                  className="flex-shrink-0 text-text-muted hover:text-text-bright"
                  aria-label="Voice input"
                >
                  <Mic size={16} />
                </button>
                <button
                  onClick={() => send(input)}
                  className="flex-shrink-0 rounded-full bg-blue p-1.5 text-void transition-transform hover:scale-105 active:scale-95"
                  aria-label="Send"
                >
                  <Send size={13} />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
