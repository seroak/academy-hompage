export const ADMIN_AUTH_COOKIE = 'academy-admin-session';
export const PARENT_AUTH_COOKIE = 'academy-parent-session';

const AUTH_COOKIE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;

type AuthKind = 'admin' | 'parent';

export interface CookieResponse {
  cookie: (name: string, value: string, options: AuthCookieOptions) => void;
}

export interface ClearCookieResponse {
  clearCookie: (name: string, options: Omit<AuthCookieOptions, 'maxAge'>) => void;
}

interface AuthCookieOptions {
  httpOnly: boolean;
  sameSite: 'lax';
  secure: boolean;
  path: string;
  maxAge: number;
  domain?: string;
}

interface CookieRequest {
  headers?: { cookie?: string };
}

function cookieName(kind: AuthKind) {
  return kind === 'admin' ? ADMIN_AUTH_COOKIE : PARENT_AUTH_COOKIE;
}

function cookieOptions(): AuthCookieOptions {
  const domain = process.env.COOKIE_DOMAIN;
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: AUTH_COOKIE_MAX_AGE_MS,
    ...(domain ? { domain } : {}),
  };
}

// Must mirror cookieOptions() (minus maxAge) so the clearing cookie's
// Domain/Path/SameSite/Secure match what the browser stored — otherwise
// the browser treats it as a different cookie and never deletes the session.
function clearCookieOptions(): Omit<AuthCookieOptions, 'maxAge'> {
  const { maxAge: _maxAge, ...rest } = cookieOptions();
  return rest;
}

export function setAuthCookie(response: CookieResponse, kind: AuthKind, token: string) {
  response.cookie(cookieName(kind), token, cookieOptions());
}

export function clearAuthCookie(response: ClearCookieResponse, kind: AuthKind) {
  response.clearCookie(cookieName(kind), clearCookieOptions());
}

export function authCookieExtractor(name: string) {
  return (request: CookieRequest | null) => {
    const cookieHeader = request?.headers?.cookie;
    if (!cookieHeader) {
      return null;
    }

    const cookies = cookieHeader.split(';').map((entry) => entry.trim());
    const match = cookies.find((entry) => entry.startsWith(`${name}=`));
    if (!match) {
      return null;
    }

    const value = match.slice(name.length + 1);
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };
}
