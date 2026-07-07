import {
  ADMIN_AUTH_COOKIE,
  PARENT_AUTH_COOKIE,
  authCookieExtractor,
  clearAuthCookie,
  setAuthCookie,
} from './auth-cookies';

describe('auth cookies', () => {
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
