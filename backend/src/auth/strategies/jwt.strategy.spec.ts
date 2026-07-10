import { JwtStrategy } from './jwt.strategy.js';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

describe('JwtStrategy', () => {
  const configService = new ConfigService({ JWT_SECRET: 'test-secret' });

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
        email: 'parent@example.com',
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
