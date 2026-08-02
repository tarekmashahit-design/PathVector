import { motion } from 'framer-motion';

export function VemoOrb({ size = 22 }: { size?: number }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'conic-gradient(from 0deg, #38BDF8, #22D3EE, #0EA5E9, #38BDF8)',
        }}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
      />
      <motion.div
        className="absolute inset-[3px] rounded-full bg-void"
        animate={{ opacity: [0.85, 1, 0.85] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute inset-[6px] rounded-full bg-blue/80 blur-[2px]"
        animate={{ scale: [0.85, 1.05, 0.85], opacity: [0.6, 1, 0.6] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
      />
    </div>
  );
}
