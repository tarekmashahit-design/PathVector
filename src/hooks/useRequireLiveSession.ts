import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLiveSessionToken } from '../lib/liveApi';

/** Mode A pages (dashboard/topology/devices) all need a live session token
 * before they can fetch anything. Bounces to the connect screen immediately
 * if there's no token yet — the per-page fetch effect additionally catches
 * a 401 mid-session (token expired) and calls the same redirect. */
export function useRequireLiveSession(): boolean {
  const navigate = useNavigate();
  const hasToken = !!getLiveSessionToken();

  useEffect(() => {
    if (!hasToken) navigate('/app/live/connect', { replace: true });
  }, [hasToken, navigate]);

  return hasToken;
}
