import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { type ReactNode } from 'react';
import { cn } from '../../lib/cn';

export function SlideOver({
  open,
  onClose,
  width = 480,
  children,
  title,
}: {
  open: boolean;
  onClose: () => void;
  width?: number;
  children: ReactNode;
  title?: ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-void/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            className={cn('fixed right-0 top-0 z-50 h-full overflow-y-auto border-l border-border-subtle bg-base/95 backdrop-blur-xl shadow-2xl')}
            style={{ width }}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border-subtle bg-base/90 px-6 py-4 backdrop-blur-xl">
              <div>{title}</div>
              <button
                onClick={onClose}
                className="rounded-btn p-1.5 text-text-muted transition-colors hover:bg-elevated hover:text-text-bright"
                aria-label="Close panel"
              >
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>
            <div className="px-6 py-5">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
