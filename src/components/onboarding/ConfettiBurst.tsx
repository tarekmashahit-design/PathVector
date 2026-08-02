import { motion } from 'framer-motion';

const particles = Array.from({ length: 26 }, (_, i) => {
  const angle = (i / 26) * Math.PI * 2;
  const distance = 60 + Math.random() * 90;
  return {
    id: i,
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance - 40,
    size: 3 + Math.random() * 4,
    delay: Math.random() * 0.15,
    color: [ '#38BDF8', '#22D3EE', '#34D399'][i % 3],
  };
});

export function ConfettiBurst() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full"
          style={{ width: p.size, height: p.size, background: p.color }}
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={{ x: p.x, y: p.y, opacity: 0 }}
          transition={{ duration: 1.1, delay: p.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}
