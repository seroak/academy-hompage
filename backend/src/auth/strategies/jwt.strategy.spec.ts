import { JwtStrategy } from './jwt.strategy.js';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ADMIN_AUTH_COOKIE } from '../auth-cookies.js';

interface ExtractableStrategy {
  _jwtFromRequest: (request: unknown) => string | null;
}

describe('JwtStrategy', () => {
  const configService = new ConfigService({ JWT_SECRET: 'test-secret' });

  it('extracts the token from the admin auth cookie', () => {
    const strategy = new JwtStrategy(configService);
    const request = { headers: { cookie: `${ADMIN_AUTH_COOKIE}=cookie-token` } };

    expect((strategy as unknown as ExtractableStrategy)._jwtFromRequest(request)).toBe(
      'cookie-token',
    );
  });

  it('falls back to the Authorization bearer header when no cookie is present', () => {
    const strategy = new JwtStrategy(configService);
    const request = { headers: { authorization: 'Bearer bearer-token' } };

    expect((strategy as unknown as ExtractableStrategy)._jwtFromRequest(request)).toBe(
      'bearer-token',
    );
  });

  it('maps the JWT payload to an admin principal', async () => {
    const strategy = new JwtStrategy(configService);

    const result = await strategy.validate({
      sub: 'admin-1',
      username: 'admin',
      tokenType: 'admin',
    });

    expect(result).toEqual({
      adminId: 'admin-1',
      username: 'admin',
    });
  });

  it('rejects a parent JWT payload', async () => {
    const strategy = new JwtStrategy(configService);

    await expect(
      strategy.validate({
        sub: 'parent-1',
        tokenType: 'parent',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('accepts an admin JWT payload without a role', async () => {
    const strategy = new JwtStrategy(configService);

    await expect(strategy.validate({
      sub: 'admin-1',
      username: 'admin',
      tokenType: 'admin',
    })).resolves.toEqual({ adminId: 'admin-1', username: 'admin' });
  });
});
