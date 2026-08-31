import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMe, getToken } from '../lib/authApi';

/** Validates pv_token against GET /api/auth/me on mount. Redirects to
 * /login if there's no token, or the backend rejects it (expired/invalid). */
export function useRequireAuth(): 'checking' | 'authed' {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'checking' | 'authed'>('checking');

  useEffect(() => {
    let cancelled = false;
    if (!getToken()) {
      navigate('/login', { replace: true });
      return;
    }
    fetchMe()
      .then(() => {
        if (!cancelled) setStatus('authed');
      })
      .catch(() => {
        if (!cancelled) navigate('/login', { replace: true });
      });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return status;
}
