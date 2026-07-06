import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  it('maps the JWT payload to an admin principal', async () => {
    const strategy = new JwtStrategy();

    const result = await strategy.validate({ sub: 'admin-1', username: 'admin' });

    expect(result).toEqual({ adminId: 'admin-1', username: 'admin' });
  });
});
