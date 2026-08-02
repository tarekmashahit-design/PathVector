import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { AmbientNetworkCanvas } from '../components/topology/AmbientNetworkCanvas';
import { Logomark } from '../components/icons/Logomark';
import { FloatingInput } from '../components/primitives/FloatingInput';
import { Button } from '../components/primitives/Button';
import { SegmentedControl } from '../components/primitives/SegmentedControl';
import { GoogleIcon, GithubIcon, MicrosoftIcon } from '../components/login/ProviderIcons';

const chips = [
  { label: '47 devices monitored', x: '12%', y: '20%', delay: 0 },
  { label: '3 threats blocked today', x: '58%', y: '38%', delay: 1.4 },
  { label: '99.7% uptime', x: '22%', y: '64%', delay: 2.6 },
];

const testimonials = [
  'PathVector cut our MTTR from 40 minutes to under 5.',
  '“Explain like I’m the on-call engineer” — and it actually does.',
  'We found a rogue DHCP server before a single ticket was filed.',
];

export function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTestimonialIdx((i) => (i + 1) % testimonials.length), 4500);
    return () => clearInterval(t);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    setTimeout(() => {
      if (username === 'admin' && password === 'pathvector') {
        setLoading(false);
        setSuccess(true);
        localStorage.setItem('pv_auth', '1');
        const destination = localStorage.getItem('onboarding_complete') === '1' ? '/app/dashboard' : '/onboarding';
        setTimeout(() => navigate(destination), 650);
      } else {
        setLoading(false);
        setError(true);
        toast.error('Invalid username or password');
      }
    }, 800);
  }

  return (
    <div className="flex min-h-screen bg-base">
      {/* Left panel */}
      <div className="relative hidden w-1/2 overflow-hidden bg-void lg:block">
        <AmbientNetworkCanvas className="absolute inset-0 h-full w-full opacity-70" density={22} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void via-transparent to-void/40" />

        {chips.map((c) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 1, 1, 0], y: [-8, 0, 0, 8] }}
            transition={{ duration: 6, repeat: Infinity, delay: c.delay, times: [0, 0.15, 0.85, 1] }}
            className="absolute rounded-pill border border-border-subtle bg-surface/70 px-3 py-1.5 font-mono text-[11px] text-text-default backdrop-blur-md"
            style={{ left: c.x, top: c.y }}
          >
            {c.label}
          </motion.div>
        ))}

        <div className="absolute bottom-10 left-10 right-10">
          <AnimatePresence mode="wait">
            <motion.p
              key={testimonialIdx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
              className="font-mono text-xs text-text-muted"
            >
              {testimonials[testimonialIdx]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex w-full flex-col justify-center px-8 sm:px-16 lg:w-1/2 lg:px-20">
        <motion.div
          initial={{ opacity: 0, scale: success ? 1 : 0.98 }}
          animate={{ opacity: success ? 0 : 1, scale: success ? 0.96 : 1 }}
          transition={{ duration: 0.4 }}
          className="mx-auto w-full max-w-sm"
        >
          <Link to="/" className="flex items-center gap-2">
            <Logomark size={28} />
            <span className="font-display text-base font-semibold text-text-bright">PathVector</span>
          </Link>

          <h1 className="mt-8 font-display text-2xl font-semibold text-text-bright">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>

          <div className="mt-5">
            <SegmentedControl
              value={mode}
              onChange={setMode}
              options={[
                { label: 'Sign in', value: 'signin' },
                { label: 'Create account', value: 'signup' },
              ]}
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleSubmit}
              className="mt-6 space-y-4"
            >
              <motion.div animate={error ? { x: [0, -10, 10, -10, 10, 0] } : {}} transition={{ duration: 0.4 }}>
                <FloatingInput label="Username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
              </motion.div>
              <motion.div animate={error ? { x: [0, -10, 10, -10, 10, 0] } : {}} transition={{ duration: 0.4, delay: 0.03 }}>
                <FloatingInput label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
              </motion.div>

              {error && <p className="text-xs text-red">Invalid credentials. Try admin / pathvector.</p>}

              <div className="flex justify-end">
                <a href="#" className="text-xs text-text-muted hover:text-text-bright">
                  Forgot password?
                </a>
              </div>

              <Button type="submit" className="w-full" disabled={loading} sheen>
                {loading ? <Loader2 size={15} className="animate-spin" /> : mode === 'signin' ? 'Sign in' : 'Create account'}
              </Button>
            </motion.form>
          </AnimatePresence>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border-subtle" />
            <span className="text-xs text-text-faint">or continue with</span>
            <div className="h-px flex-1 bg-border-subtle" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <GoogleIcon />, label: 'Google' },
              { icon: <GithubIcon />, label: 'GitHub' },
              { icon: <MicrosoftIcon />, label: 'Microsoft' },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => toast.message('SSO coming soon')}
                className="flex items-center justify-center rounded-btn border border-border-subtle bg-surface py-2.5 transition-colors hover:border-blue/40 hover:bg-elevated"
                aria-label={p.label}
              >
                {p.icon}
              </button>
            ))}
          </div>

          <p className="mt-6 font-mono text-[11px] text-text-faint">Demo credentials: admin / pathvector</p>
        </motion.div>

        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="pointer-events-none absolute inset-0 flex items-center justify-center lg:left-1/2"
            >
              <div className="h-0.5 w-40 overflow-hidden rounded-full bg-elevated">
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                  className="h-full w-full bg-blue"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
