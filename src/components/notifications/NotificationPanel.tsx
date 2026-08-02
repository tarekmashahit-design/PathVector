import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { useAppShell } from '../../context/AppShellContext';
import { relativeTime } from '../../lib/format';
import type { NotifType } from '../../data/notifications';
import { cn } from '../../lib/cn';

const iconMap: Record<NotifType, typeof AlertTriangle> = {
  critical: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle2,
};

const colorMap: Record<NotifType, string> = {
  critical: 'text-red',
  warning: 'text-amber',
  info: 'text-blue',
  success: 'text-green',
};

export function NotificationPanel() {
  const { notifOpen, setNotifOpen, liveEvents } = useAppShell();

  return (
    <AnimatePresence>
      {notifOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-void/60 backdrop-blur-sm"
            onClick={() => setNotifOpen(false)}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            className="fixed right-0 top-0 z-50 h-full w-[360px] overflow-y-auto border-l border-border-subtle bg-base/95 backdrop-blur-xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border-subtle bg-base/90 px-5 py-4 backdrop-blur-xl">
              <h2 className="font-display text-sm font-semibold text-text-bright">Notifications</h2>
              <button onClick={liveEvents.markAllRead} className="text-xs text-blue hover:underline">
                Mark all read
              </button>
            </div>
            <ul className="divide-y divide-border-subtle">
              <AnimatePresence initial={false}>
                {liveEvents.notifications.map((n) => {
                  const Icon = iconMap[n.type];
                  return (
                    <motion.li
                      key={n.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      onClick={() => liveEvents.markRead(n.id)}
                      className={cn('flex cursor-pointer gap-3 px-5 py-3.5 transition-colors hover:bg-elevated', !n.read && 'bg-blue/[0.04]')}
                    >
                      <Icon size={16} strokeWidth={1.75} className={cn('mt-0.5 flex-shrink-0', colorMap[n.type])} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-text-bright">{n.title}</p>
                        <p
                          className="mt-0.5 text-xs text-text-muted [&_code]:font-mono [&_code]:text-blue"
                          dangerouslySetInnerHTML={{ __html: n.detail.replace(/`([^`]+)`/g, '<code>$1</code>') }}
                        />
                        <p className="mt-1 font-mono text-[10px] text-text-faint">{relativeTime(n.timestamp)}</p>
                      </div>
                      {!n.read && <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue" />}
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
