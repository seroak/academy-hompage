import {
  ADMIN_AUTH_COOKIE,
  PARENT_AUTH_COOKIE,
  authCookieExtractor,
  clearAuthCookie,
  setAuthCookie,
} from './auth-cookies.js';

describe('auth cookies', () => {
  const originalCookieDomain = process.env.COOKIE_DOMAIN;

  afterEach(() => {
    if (originalCookieDomain === undefined) {
      delete process.env.COOKIE_DOMAIN;
    } else {
      process.env.COOKIE_DOMAIN = originalCookieDomain;
    }
  });

  it('sets httpOnly auth cookies with shared options', () => {
    const response = { cookie: jest.fn() };

    setAuthCookie(response, 'admin', 'admin-token');
    setAuthCookie(response, 'parent', 'parent-token');

    expect(response.cookie).toHaveBeenCalledWith(
      ADMIN_AUTH_COOKIE,
      'admin-token',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/' }),
    );
    expect(response.cookie).toHaveBeenCalledWith(
      PARENT_AUTH_COOKIE,
      'parent-token',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/' }),
    );
  });

  it('applies COOKIE_DOMAIN to auth cookies when set, so subdomains share the session', () => {
    process.env.COOKIE_DOMAIN = 'openmath.io.kr';
    const response = { cookie: jest.fn() };

    setAuthCookie(response, 'parent', 'parent-token');

    expect(response.cookie).toHaveBeenCalledWith(
      PARENT_AUTH_COOKIE,
      'parent-token',
      expect.objectContaining({ domain: 'openmath.io.kr' }),
    );
  });

  it('omits the domain option when COOKIE_DOMAIN is not set (dev/localhost)', () => {
    delete process.env.COOKIE_DOMAIN;
    const response = { cookie: jest.fn() };

    setAuthCookie(response, 'parent', 'parent-token');

    const [, , options] = response.cookie.mock.calls[0];
    expect(options.domain).toBeUndefined();
  });

  it('clears auth cookies with matching paths', () => {
    const response = { clearCookie: jest.fn() };

    clearAuthCookie(response, 'admin');
    clearAuthCookie(response, 'parent');

    expect(response.clearCookie).toHaveBeenCalledWith(
      ADMIN_AUTH_COOKIE,
      expect.objectContaining({ path: '/' }),
    );
    expect(response.clearCookie).toHaveBeenCalledWith(
      PARENT_AUTH_COOKIE,
      expect.objectContaining({ path: '/' }),
    );
  });

  it('extracts JWT values from request cookies', () => {
    const request = {
      headers: {
        cookie: `${ADMIN_AUTH_COOKIE}=admin-token; ${PARENT_AUTH_COOKIE}=parent-token`,
      },
    };

    expect(authCookieExtractor(ADMIN_AUTH_COOKIE)(request)).toBe('admin-token');
    expect(authCookieExtractor(PARENT_AUTH_COOKIE)(request)).toBe('parent-token');
  });
});
