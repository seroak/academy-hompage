import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ParentJwtStrategy } from './parent-jwt.strategy.js';
import { PARENT_AUTH_COOKIE } from '../auth-cookies.js';

interface ExtractableStrategy {
  _jwtFromRequest: (request: unknown) => string | null;
}

describe('ParentJwtStrategy', () => {
  const configService = new ConfigService({ JWT_SECRET: 'test-secret' });

  it('extracts the token from the parent auth cookie', () => {
    const strategy = new ParentJwtStrategy(configService);
    const request = { headers: { cookie: `${PARENT_AUTH_COOKIE}=cookie-token` } };

    expect((strategy as unknown as ExtractableStrategy)._jwtFromRequest(request)).toBe(
      'cookie-token',
    );
  });

  it('falls back to the Authorization bearer header when no cookie is present', () => {
    const strategy = new ParentJwtStrategy(configService);
    const request = { headers: { authorization: 'Bearer bearer-token' } };

    expect((strategy as unknown as ExtractableStrategy)._jwtFromRequest(request)).toBe(
      'bearer-token',
    );
  });

  it('maps the JWT payload to a parent principal', async () => {
    const strategy = new ParentJwtStrategy(configService);

    const result = await strategy.validate({
      sub: 'parent-1',
      email: 'parent@example.com',
      name: '김보호',
      tokenType: 'parent',
    });

    expect(result).toEqual({
      parentUserId: 'parent-1',
      email: 'parent@example.com',
      name: '김보호',
    });
  });

  it('rejects an admin JWT payload', async () => {
    const strategy = new ParentJwtStrategy(configService);

    await expect(
      strategy.validate({
        sub: 'admin-1',
        username: 'admin',
        tokenType: 'admin',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
