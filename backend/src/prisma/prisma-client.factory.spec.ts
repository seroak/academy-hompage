import { PrismaPg } from '@prisma/adapter-pg';
import { createPrismaAdapter } from './prisma-client.factory.js';

describe('createPrismaAdapter', () => {
  it('DATABASE_URL로 PostgreSQL 드라이버 어댑터를 만든다', () => {
    const adapter = createPrismaAdapter(
      'postgresql://academy:academy@localhost:5433/academy',
    );

    expect(adapter).toBeInstanceOf(PrismaPg);
  });

  it('DATABASE_URL이 비어 있으면 즉시 실패한다', () => {
    expect(() => createPrismaAdapter(undefined)).toThrow(
      'DATABASE_URL 환경 변수가 필요합니다.',
    );
  });
});
