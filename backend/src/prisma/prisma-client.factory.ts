import { PrismaPg } from '@prisma/adapter-pg';

export function createPrismaAdapter(databaseUrl: string | undefined) {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL 환경 변수가 필요합니다.');
  }

  return new PrismaPg({ connectionString: databaseUrl });
}
