import { JwtStrategy } from './jwt.strategy';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

describe('JwtStrategy', () => {
  const configService = new ConfigService({ JWT_SECRET: 'test-secret' });

  it('maps the JWT payload to an admin principal', async () => {
    const strategy = new JwtStrategy(configService);

    const result = await strategy.validate({
      sub: 'admin-1',
      username: 'admin',
      role: 'SUPER_ADMIN',
      tokenType: 'admin',
    });

    expect(result).toEqual({
      adminId: 'admin-1',
      username: 'admin',
      role: 'SUPER_ADMIN',
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

  it('rejects an admin JWT payload with an unknown role', async () => {
    const strategy = new JwtStrategy(configService);

    await expect(
      strategy.validate({
        sub: 'admin-1',
        username: 'admin',
        role: 'INSTRUCTOR' as never,
        tokenType: 'admin',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
