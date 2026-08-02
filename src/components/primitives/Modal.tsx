import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { type ReactNode } from 'react';

export function Modal({
  open,
  onClose,
  children,
  title,
  width = 480,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: ReactNode;
  width?: number;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-void/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              key="modal-panel"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 4 }}
              transition={{ type: 'spring', stiffness: 360, damping: 30 }}
              className="max-h-[85vh] w-full overflow-y-auto rounded-hero border border-border-subtle bg-surface shadow-2xl"
              style={{ maxWidth: width }}
            >
              <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
                <div className="font-display text-base font-semibold text-text-bright">{title}</div>
                <button onClick={onClose} className="rounded-btn p-1.5 text-text-muted hover:bg-elevated hover:text-text-bright" aria-label="Close">
                  <X size={18} strokeWidth={1.75} />
                </button>
              </div>
              <div className="p-6">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
