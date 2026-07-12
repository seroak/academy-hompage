# Prisma 운영 가이드

- Prisma Client는 `prisma-client` generator로 `backend/src/generated/prisma`에 생성하며 Git에 커밋하지 않는다.
- `schema.prisma`에는 datasource provider만 둔다. 연결 URL과 seed는 `prisma.config.ts`에서 관리한다.
- 앱과 seed는 `@prisma/adapter-pg`의 `PrismaPg` adapter를 주입한 생성 클라이언트를 사용한다.
- Prisma 7은 migration 후 client 생성·seed를 자동 실행하지 않는다. `npm run prisma:generate`, `npm run prisma:seed`를 명시적으로 실행한다.
- 백엔드는 ESM이므로 상대 import에 `.js` 확장자를 사용한다.
- schema·migration 변경 기능은 목 테스트나 빌드만으로 완료하지 않는다. 대상 DB에 적용하고 실제 API 요청으로 런타임 연결을 확인한다.
- 관계 조회가 필요한 enum 재분류 migration은 `ALTER COLUMN ... USING` 서브쿼리 대신 임시 컬럼 계산 후 단계적으로 교체한다. 실패하면 부분 적용 상태를 먼저 확인한다.
- 백엔드 TypeScript는 5.7.x~5.9.x를 유지한다. TypeScript 7 업그레이드 전 `ts-jest`와 `typescript-eslint` 지원 범위를 확인한다.
