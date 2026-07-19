import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { createPrismaAdapter } from '../src/prisma/prisma-client.factory.js';

const prisma = new PrismaClient({
  adapter: createPrismaAdapter(process.env.DATABASE_URL),
});

const NUMERIC_ID = /^\d+$/;

function isLegacyMetaValue(value: string | null): boolean {
  if (!value) return false;
  return !NUMERIC_ID.test(value);
}

async function main() {
  const execute = process.argv.includes('--execute');

  const candidates = await prisma.marketingEvent.findMany({
    where: {
      utmSource: 'meta',
      OR: [{ utmCampaign: { not: null } }, { utmContent: { not: null } }],
    },
    select: { id: true, utmCampaign: true, utmContent: true, occurredAt: true },
  });

  const legacy = candidates.filter(
    (e) => isLegacyMetaValue(e.utmCampaign) || isLegacyMetaValue(e.utmContent),
  );

  const grouped = new Map<string, number>();
  for (const e of legacy) {
    const key = `campaign=${e.utmCampaign ?? '-'} content=${e.utmContent ?? '-'}`;
    grouped.set(key, (grouped.get(key) ?? 0) + 1);
  }

  console.log(`utm_source=meta 이벤트 중 이름 기반(비-숫자) 값 ${legacy.length}건 발견:`);
  for (const [key, count] of grouped) {
    console.log(`  ${key} -> ${count}건`);
  }

  if (!execute) {
    console.log('\n미리보기 모드입니다. 실제 삭제하려면 --execute 옵션을 붙여 다시 실행하세요.');
    return;
  }

  const result = await prisma.marketingEvent.deleteMany({
    where: { id: { in: legacy.map((e) => e.id) } },
  });
  console.log(`\n삭제 완료: ${result.count}건`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
