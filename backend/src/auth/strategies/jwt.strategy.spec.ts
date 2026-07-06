import { JwtStrategy } from './jwt.strategy';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtStrategy', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  it('maps the JWT payload to an admin principal', async () => {
    const strategy = new JwtStrategy();

    const result = await strategy.validate({
      sub: 'admin-1',
      username: 'admin',
      tokenType: 'admin',
    });

    expect(result).toEqual({ adminId: 'admin-1', username: 'admin' });
  });

  it('rejects a parent JWT payload', async () => {
    const strategy = new JwtStrategy();

    await expect(
      strategy.validate({
        sub: 'parent-1',
        email: 'parent@example.com',
        tokenType: 'parent',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
