import { UnauthorizedException } from '@nestjs/common';
import { ParentJwtStrategy } from './parent-jwt.strategy';

describe('ParentJwtStrategy', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  it('maps the JWT payload to a parent principal', async () => {
    const strategy = new ParentJwtStrategy();

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
    const strategy = new ParentJwtStrategy();

    await expect(
      strategy.validate({
        sub: 'admin-1',
        username: 'admin',
        tokenType: 'admin',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
