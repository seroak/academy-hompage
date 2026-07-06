# academy-hompage 프로젝트 안내

## 지침 파일 동기화

- 이 프로젝트에서 `CLAUDE.md`를 수정할 때는 같은 의도의 변경을 `AGENTS.md`에도 함께 반영한다.
- `AGENTS.md`를 수정할 때도 같은 의도의 변경을 `CLAUDE.md`에 함께 반영한다.
- 두 파일은 도구별 진입점이 다르므로 문구가 완전히 같을 필요는 없지만, 프로젝트 규칙과 작업 방식은 서로 어긋나면 안 된다.

학원 홈페이지: 공개 사이트(강좌·강사·공지 조회) + 관리자 CRUD(로그인 필요).
`backend/`(NestJS)와 `frontend/`(React)는 완전히 분리된 프로젝트다 — 각자 `npm install`/실행.

## 기술 스택

| 영역 | 스택 |
|------|------|
| Backend | NestJS + Prisma(**6.x 고정, 7.x 금지** — 아래 참고) + PostgreSQL(docker-compose) + JWT(passport-jwt) |
| Frontend | React + Vite + TypeScript + TanStack Query + Zod + Zustand + React Router + Tailwind CSS |

## 구조

```
academy-hompage/
├── backend/
│   ├── docker-compose.yml   # Postgres 16, 포트 5433:5432 (5432는 다른 프로젝트 컨테이너가 점유 중)
│   ├── prisma/schema.prisma # Course / Instructor / Notice / Admin
│   ├── prisma/seed.ts       # 관리자 1 + 강사 3 + 강좌 4 + 공지 2
│   └── src/
│       ├── prisma/          # PrismaService (전역 모듈)
│       ├── courses/ notices/ instructors/  # 각각 controller/service/dto, 동일 CRUD 패턴
│       └── auth/            # JWT 로그인 + JwtAuthGuard (courses/notices/instructors의 POST/PATCH/DELETE에 적용)
└── frontend/
    └── src/
        ├── api/              # fetch + Zod 파싱 (schemas/ 하위에 스키마)
        ├── queries/          # 여러 곳에서 쓰는 조회 훅 + queryKeys.ts (중앙 관리)
        ├── stores/authStore.ts  # Zustand, 관리자 토큰(persist)
        ├── pages/            # 공개 페이지
        └── pages/admin/      # 관리자 전용 (RequireAdmin 가드, hooks/ 아래 mutation 훅)
```

## 실행 명령어

```bash
# Backend
cd backend
docker compose up -d          # Postgres 기동 (최초 1회 또는 재부팅 후)
npx prisma migrate dev         # 스키마 최초 적용/변경 시에만
npx prisma db seed             # 시드 데이터 최초 적용 시에만
npm run start:dev              # http://localhost:3000
npx jest                       # 전체 테스트

# Frontend
cd frontend
npm run dev                    # http://localhost:5173
npm run build                  # tsc -b && vite build
```

관리자 계정(시드): `.env`의 `ADMIN_SEED_USERNAME`/`ADMIN_SEED_PASSWORD` (기본 `admin` / `admin1234`).

## 아키텍처 규칙

- **CRUD 패턴 통일**: courses/notices/instructors는 동일한 구조(controller/service/dto, `findAll`/`findOne`/`create`/`update`/`remove`)를 따른다. 새 도메인 추가 시 이 패턴을 복제한다.
- **인증 가드는 쓰기 작업에만**: `GET`은 공개, `POST`/`PATCH`/`DELETE`에만 `@UseGuards(JwtAuthGuard)`. 새 엔드포인트 추가 시 동일하게 적용.
- **DELETE는 204 반환 필수**: `@HttpCode(HttpStatus.NO_CONTENT)`. Nest 기본값(200 + 빈 바디)은 프론트 `response.json()` 파싱 에러를 유발한다(실제로 겪은 버그, `src/lib/apiClient.ts` 참고).
- **API 응답은 Zod로 파싱**: `frontend/src/api/*.ts`에서 `schema.parse(raw)` 필수, `as T` 단언 금지. 신규 API 함수 작성 시 `api-zod-boundary` 스킬 참고.
- **쿼리 훅 배치**: 2곳 이상에서 쓰면 `src/queries/`, 관리자 페이지 전용(1곳)이면 `src/pages/admin/hooks/`. `queryKeys.ts`는 항상 중앙(`src/queries/queryKeys.ts`)에서 관리.
- **Instructor 삭제**: 담당 강좌가 남아있으면 `ConflictException`(409)을 던진다 — FK 제약 위반을 그대로 노출하지 않는다.

## Prisma 버전 관련 주의

Prisma 7.x는 새 클라이언트 제너레이터(`prisma-client`)가 driver adapter(`@prisma/adapter-pg` 등)를 강제해 `schema.prisma`의 `url = env(...)` 방식이 아예 막힌다. 이 프로젝트는 표준적인 `prisma-client-js` + `DATABASE_URL` 방식을 쓰므로 **Prisma를 7.x로 업그레이드하지 않는다** (`package.json`에 `prisma`/`@prisma/client` 6.19.3 고정). 업그레이드가 필요해지면 driver adapter 전환을 별도 작업으로 계획한다.

## 개발 워크플로

- 백엔드 기능 추가/수정은 TDD(RED-GREEN)로 진행 — `*.spec.ts` 먼저 작성해 실패 확인 후 구현.
- 프론트/백엔드 동시 실행 후 실제 브라우저(Playwright) 또는 curl로 end-to-end 확인 없이 완료 선언하지 않는다.
- 이 git 저장소(`/Users/igyuyeol/Desktop/project`)에는 다수의 독립 프로젝트가 공존한다 — 커밋 시 `academy-hompage/` 밖의 변경을 섞지 않는다.
