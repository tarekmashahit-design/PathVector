// Same backend as demoApi.ts/liveApi.ts — set VITE_DEMO_API_BASE to point
// at the hosted backend in deployment; falls back to localhost for dev.
export const AUTH_API_BASE = import.meta.env.VITE_DEMO_API_BASE ?? 'http://localhost:8000';

const TOKEN_KEY = 'pv_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export interface AuthUser {
  id: string;
  email: string;
  is_verified: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

async function parseErrorDetail(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => ({ detail: fallback }));
  return body.detail ?? fallback;
}

export async function register(email: string, password: string): Promise<{ message: string }> {
  const res = await fetch(`${AUTH_API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await parseErrorDetail(res, 'Registration failed'));
  return res.json();
}

export async function verify(email: string, code: string): Promise<TokenResponse> {
  const res = await fetch(`${AUTH_API_BASE}/api/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });
  if (!res.ok) throw new Error(await parseErrorDetail(res, 'Verification failed'));
  const data: TokenResponse = await res.json();
  setToken(data.access_token);
  return data;
}

export async function login(email: string, password: string): Promise<TokenResponse> {
  const res = await fetch(`${AUTH_API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await parseErrorDetail(res, 'Login failed'));
  const data: TokenResponse = await res.json();
  setToken(data.access_token);
  return data;
}

export async function fetchMe(): Promise<AuthUser> {
  const token = getToken();
  if (!token) throw new Error('Not signed in');
  const res = await fetch(`${AUTH_API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    clearToken();
    throw new Error(await parseErrorDetail(res, 'Session invalid'));
  }
  return res.json();
}

export function logout(): void {
  clearToken();
}
