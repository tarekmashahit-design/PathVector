import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Loader2, Waypoints } from 'lucide-react';
import { AmbientNetworkCanvas } from '../components/topology/AmbientNetworkCanvas';
import { Logomark } from '../components/icons/Logomark';
import { FloatingInput } from '../components/primitives/FloatingInput';
import { Button } from '../components/primitives/Button';
import { connectToDevice } from '../lib/liveApi';

export function LiveConnect() {
  const navigate = useNavigate();
  const [ip, setIp] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ip.trim()) {
      setError('Enter the device IP address to connect.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await connectToDevice({ ip: ip.trim(), username: username.trim(), password });
      toast.success(`Connected — ${result.device_count} device${result.device_count === 1 ? '' : 's'} discovered`);
      navigate('/app/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not connect to that device.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-base px-6">
      <AmbientNetworkCanvas className="absolute inset-0 h-full w-full opacity-30" density={18} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-base/30 via-base/80 to-base" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative z-10 w-full max-w-sm"
      >
        <Link to="/app/mode" className="flex items-center gap-2">
          <Logomark size={28} />
          <span className="font-display text-base font-semibold text-text-bright">PathVector</span>
        </Link>

        <div className="mt-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-card border border-blue/25 bg-blue/10">
            <Waypoints size={18} className="text-blue" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-text-bright">Connect to Device</h1>
            <p className="font-mono text-[11px] text-text-muted">Live Network · SSH via netmiko</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <motion.div animate={error ? { x: [0, -10, 10, -10, 10, 0] } : {}} transition={{ duration: 0.4 }}>
            <FloatingInput label="IP address" value={ip} onChange={(e) => setIp(e.target.value)} autoComplete="off" spellCheck={false} />
          </motion.div>
          <FloatingInput label="Username (optional)" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
          <FloatingInput label="Password (optional)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />

          {error && <p className="text-xs text-red">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading} sheen>
            {loading ? <Loader2 size={15} className="animate-spin" /> : 'Connect'}
          </Button>
        </form>

        <p className="mt-6 font-mono text-[11px] text-text-faint">
          Leave username/password blank for an unauthenticated device. PathVector pulls interfaces, VLANs, CDP
          neighbors, and running-config over SSH — nothing is written back.
        </p>
      </motion.div>
    </div>
  );
}
