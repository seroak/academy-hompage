# Prisma 운영 가이드

- Prisma Client는 `prisma-client` generator로 `backend/src/generated/prisma`에 생성하며 Git에 커밋하지 않는다.
- `schema.prisma`에는 datasource provider만 둔다. 연결 URL과 seed는 `prisma.config.ts`에서 관리한다.
- 앱과 seed는 `@prisma/adapter-pg`의 `PrismaPg` adapter를 주입한 생성 클라이언트를 사용한다.
- Prisma 7은 migration 후 client 생성·seed를 자동 실행하지 않는다. `npm run prisma:generate`, `npm run prisma:seed`를 명시적으로 실행한다.
- 백엔드는 ESM이므로 상대 import에 `.js` 확장자를 사용한다.
- schema·migration 변경 기능은 목 테스트나 빌드만으로 완료하지 않는다. 대상 DB에 적용하고 실제 API 요청으로 런타임 연결을 확인한다.
- 관계 조회가 필요한 enum 재분류 migration은 `ALTER COLUMN ... USING` 서브쿼리 대신 임시 컬럼 계산 후 단계적으로 교체한다. 실패하면 부분 적용 상태를 먼저 확인한다.
- `prisma migrate dev`가 "The migration `<name>` was modified after it was applied. We need to reset the schema"라며 멈추면 곧바로 `migrate reset`을 쓰지 않는다. 먼저 `_prisma_migrations` 테이블에서 `SELECT migration_name, checksum, finished_at FROM _prisma_migrations WHERE migration_name = '<name>'`을 조회한다. 같은 이름의 행이 여러 개이고 그중 `finished_at IS NULL`(과거 실패한 시도)이 있으면, 성공한 행의 checksum이 현재 파일과 일치하는지 확인한 뒤 실패 행만 `DELETE FROM _prisma_migrations WHERE migration_name = '<name>' AND finished_at IS NULL`로 제거한다(앱 데이터 테이블은 건드리지 않는 부기 정리). 이후 `migrate dev`를 재시도하면 데이터 손실 없이 통과한다.
- 백엔드 TypeScript는 5.7.x~5.9.x를 유지한다. TypeScript 7 업그레이드 전 `ts-jest`와 `typescript-eslint` 지원 범위를 확인한다.
- `prisma` 패키지를 devDependencies에서 dependencies로 승격하면 Prisma Studio 관련 번들(예: `@electric-sql/effect`, `chart.js` 등, 약 200MB)이 런타임 프로덕션 이미지에 함께 딸려온다. 런타임에 필요한 건 `@prisma/client`와 `@prisma/adapter-pg`뿐이므로, `prisma` CLI 자체는 devDependencies에 남기고 Dockerfile 빌드 스테이지에서만 접근하는 편이 이미지 크기에 유리하다.
