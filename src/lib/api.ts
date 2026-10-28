export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const TOKEN_KEY = 'st_paul_token_v1';

export function getApiToken(): string {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setApiToken(token: string) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export async function apiHealth(): Promise<boolean> {
  try {
    const res = await fetch('/api/health', { method: 'GET' });
    if (!res.ok) return false;
    const data = await res.json().catch(() => ({}));
    return Boolean(data?.ok || data?.status === 'ok' || data?.success);
  } catch {
    return false;
  }
}

export async function apiRequest<T = Record<string, unknown>>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getApiToken();
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(path, { ...options, headers });
  const data = (await res.json().catch(() => ({}))) as T & { message?: string; token?: string; success?: boolean };
  if (typeof data === 'object' && data && 'token' in data && data.token) {
    setApiToken(String(data.token));
  }
  if (!res.ok) {
    throw new ApiError(data.message || 'تعذر إتمام العملية.', res.status);
  }
  return data;
}
