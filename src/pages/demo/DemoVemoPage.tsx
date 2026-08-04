import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import { VemoOrb } from '../../components/primitives/VemoOrb';
import { Badge } from '../../components/primitives/Badge';
import { useDemoStore } from '../../store/demoStore';
import { askVemo } from '../../lib/demoApi';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  confidence?: number;
}

const SUGGESTIONS = ['What is the biggest risk?', 'Show me all security issues', 'Is there a single point of failure?', 'Which device needs attention first?'];

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-1.5 rounded-card rounded-tl-sm border border-border-subtle bg-surface px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-blue" animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.15 }} />
      ))}
    </div>
  );
}

export function DemoVemoPage() {
  const { sessionId, summary } = useDemoStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (summary) setMessages([{ id: 'seed', role: 'assistant', text: summary }]);
  }, [summary]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  async function send(text: string) {
    if (!text.trim() || !sessionId) return;
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setThinking(true);
    try {
      const history = messages.slice(-10).map((m) => ({ role: m.role, content: m.text }));
      const result = await askVemo(sessionId, text, history);
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', text: result.response, confidence: result.confidence }]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Vemo request failed');
    } finally {
      setThinking(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-64px)] max-w-[720px] flex-col p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <VemoOrb size={26} />
        <div>
          <p className="font-display text-sm font-semibold text-text-bright">Vemo</p>
          <p className="flex items-center gap-1 font-mono text-[10px] text-green">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-green" /> analyzing this network
          </p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pr-1">
        {messages.map((m) => (
          <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            {m.role === 'user' ? (
              <div className="max-w-[85%] rounded-card rounded-tr-sm bg-elevated px-3.5 py-2.5 text-sm text-text-bright">{m.text}</div>
            ) : (
              <div className="w-full max-w-[95%] rounded-card rounded-tl-sm border border-border-subtle bg-surface p-4">
                <p className="text-sm leading-relaxed text-text-bright">{m.text}</p>
                {m.confidence !== undefined && (
                  <div className="mt-2.5">
                    <Badge tone="blue">{m.confidence}% confidence</Badge>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {thinking && <ThinkingIndicator />}
      </div>

      <div className="mt-4 border-t border-border-subtle pt-4">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((c) => (
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
            placeholder="Ask about this network…"
            className="w-full bg-transparent text-sm text-text-default outline-none placeholder:text-text-muted"
          />
          <button onClick={() => send(input)} className="flex-shrink-0 rounded-full bg-blue p-1.5 text-void transition-transform hover:scale-105 active:scale-95" aria-label="Send">
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
