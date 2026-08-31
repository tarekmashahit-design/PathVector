import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Loader2, MailCheck } from 'lucide-react';
import { AmbientNetworkCanvas } from '../components/topology/AmbientNetworkCanvas';
import { Logomark } from '../components/icons/Logomark';
import { FloatingInput } from '../components/primitives/FloatingInput';
import { Button } from '../components/primitives/Button';
import { register as registerAccount, verify } from '../lib/authApi';

export function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'details' | 'code'>('details');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await registerAccount(email.trim(), password);
      toast.success('Verification code sent to your email');
      setStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await verify(email.trim(), code.trim());
      toast.success('Account verified');
      navigate('/app/mode');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-base">
      <div className="relative hidden w-1/2 overflow-hidden bg-void lg:block">
        <AmbientNetworkCanvas className="absolute inset-0 h-full w-full opacity-70" density={22} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void via-transparent to-void/40" />
      </div>

      <div className="flex w-full flex-col justify-center px-8 sm:px-16 lg:w-1/2 lg:px-20">
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="mx-auto w-full max-w-sm">
          <Link to="/" className="flex items-center gap-2">
            <Logomark size={28} />
            <span className="font-display text-base font-semibold text-text-bright">PathVector</span>
          </Link>

          <AnimatePresence mode="wait">
            {step === 'details' ? (
              <motion.div key="details" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }}>
                <h1 className="mt-8 font-display text-2xl font-semibold text-text-bright">Create your account</h1>
                <p className="mt-1.5 text-sm text-text-muted">We'll email you a 6-digit code to verify it's you.</p>

                <form onSubmit={handleRegister} className="mt-6 space-y-4">
                  <motion.div animate={error ? { x: [0, -10, 10, -10, 10, 0] } : {}} transition={{ duration: 0.4 }}>
                    <FloatingInput label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                  </motion.div>
                  <motion.div animate={error ? { x: [0, -10, 10, -10, 10, 0] } : {}} transition={{ duration: 0.4, delay: 0.03 }}>
                    <FloatingInput label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
                  </motion.div>

                  {error && <p className="text-xs text-red">{error}</p>}

                  <Button type="submit" className="w-full" disabled={loading} sheen>
                    {loading ? <Loader2 size={15} className="animate-spin" /> : 'Send verification code'}
                  </Button>
                </form>

                <p className="mt-6 text-xs text-text-muted">
                  Already have an account?{' '}
                  <Link to="/login" className="text-blue hover:underline">
                    Sign in
                  </Link>
                </p>
              </motion.div>
            ) : (
              <motion.div key="code" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }}>
                <div className="mt-8 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-card border border-blue/25 bg-blue/10">
                    <MailCheck size={18} className="text-blue" />
                  </div>
                  <div>
                    <h1 className="font-display text-xl font-semibold text-text-bright">Check your email</h1>
                    <p className="font-mono text-[11px] text-text-muted">Code sent to {email}</p>
                  </div>
                </div>

                <form onSubmit={handleVerify} className="mt-6 space-y-4">
                  <motion.div animate={error ? { x: [0, -10, 10, -10, 10, 0] } : {}} transition={{ duration: 0.4 }}>
                    <FloatingInput
                      label="6-digit code"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      className="tracking-[0.4em] font-mono"
                    />
                  </motion.div>

                  {error && <p className="text-xs text-red">{error}</p>}

                  <Button type="submit" className="w-full" disabled={loading || code.length !== 6} sheen>
                    {loading ? <Loader2 size={15} className="animate-spin" /> : 'Verify & continue'}
                  </Button>
                </form>

                <button
                  type="button"
                  onClick={() => {
                    setStep('details');
                    setCode('');
                    setError(null);
                  }}
                  className="mt-6 text-xs text-text-muted hover:text-text-bright"
                >
                  ← Use a different email
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
