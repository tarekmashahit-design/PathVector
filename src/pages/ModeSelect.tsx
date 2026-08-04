import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Waypoints, UploadCloud, ArrowRight } from 'lucide-react';
import { Logomark } from '../components/icons/Logomark';
import { Badge } from '../components/primitives/Badge';
import { AmbientNetworkCanvas } from '../components/topology/AmbientNetworkCanvas';

export function ModeSelect() {
  const navigate = useNavigate();

  function launchLive() {
    const onboardingDone = localStorage.getItem('onboarding_complete') === '1';
    navigate(onboardingDone ? '/app/dashboard' : '/onboarding');
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden app-canvas-texture px-6">
      <AmbientNetworkCanvas className="absolute inset-0 h-full w-full opacity-40" density={20} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-base/40 via-base/70 to-base" />

      <div className="relative z-10 mb-10 flex flex-col items-center gap-3 text-center">
        <Logomark size={32} />
        <h1 className="font-display text-2xl font-semibold text-text-bright sm:text-3xl">How do you want to work today?</h1>
        <p className="max-w-md text-sm text-text-muted">Both modes share the same dashboards, topology view, and Vemo — only the data source differs.</p>
      </div>

      <div className="relative z-10 grid w-full max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2">
        <motion.button
          onClick={launchLive}
          whileHover={{ y: -3 }}
          className="group flex flex-col items-start gap-4 rounded-hero border border-border-subtle bg-surface/80 p-7 text-left backdrop-blur-md transition-colors hover:border-blue/40 hover:shadow-glow-blue"
        >
          <div className="relative flex h-12 w-12 items-center justify-center rounded-card border border-blue/25 bg-blue/10">
            <Waypoints size={22} className="text-blue" />
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 animate-pulse-dot rounded-full bg-green" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-text-bright">Live Network</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-text-muted">Connect to your infrastructure via SNMP, SSH, and NETCONF.</p>
          </div>
          <span className="mt-auto flex items-center gap-1.5 text-sm font-medium text-blue">
            Launch <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </span>
        </motion.button>

        <motion.button
          onClick={() => navigate('/app/demo')}
          whileHover={{ y: -3 }}
          className="group flex flex-col items-start gap-4 rounded-hero border border-border-subtle bg-surface/80 p-7 text-left backdrop-blur-md transition-colors hover:border-blue/40 hover:shadow-glow-blue"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-card border border-blue/25 bg-blue/10">
            <UploadCloud size={22} className="text-blue" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-semibold text-text-bright">Virtualization Demo</h2>
              <Badge tone="blue">Demo Mode</Badge>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-text-muted">Upload a Packet Tracer or GNS3 file and analyze it instantly.</p>
          </div>
          <span className="mt-auto flex items-center gap-1.5 text-sm font-medium text-blue">
            Start <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </span>
        </motion.button>
      </div>
    </div>
  );
}
