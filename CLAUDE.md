# academy-hompage 프로젝트 안내

## 지침 파일 동기화

- 이 프로젝트에서 `CLAUDE.md`를 수정할 때는 같은 의도의 변경을 `AGENTS.md`에도 함께 반영한다.
- `AGENTS.md`를 수정할 때도 같은 의도의 변경을 `CLAUDE.md`에 함께 반영한다.
- 두 파일은 도구별 진입점이 다르므로 문구가 완전히 같을 필요는 없지만, 프로젝트 규칙과 작업 방식은 서로 어긋나면 안 된다.

## 스킬 사용

- 작업 완료 전 전역 `update-agents` 스킬을 호출한다. 완료한 작업에서 재사용 가능한 프로젝트 전반 지침이 드러난 경우에만 `AGENTS.md`를 수정한다.

학원 홈페이지: 공개 사이트(강좌·강사·공지 조회) + 관리자 CRUD(로그인 필요).
`backend/`(NestJS)와 `frontend/`(React)는 완전히 분리된 프로젝트다 — 각자 `npm install`/실행.

## 기술 스택

| 영역 | 스택 |
|------|------|
| Backend | NestJS + Prisma 7 + PostgreSQL(docker-compose) + JWT(passport-jwt) |
| Frontend | Next.js App Router + React + TypeScript + TanStack Query + Zod + Zustand + Tailwind CSS |

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
        ├── app/              # Next App Router 라우트, metadata/robots/sitemap
        ├── queries/          # 여러 곳에서 쓰는 클라이언트 조회 훅 + queryKeys.ts (중앙 관리)
        ├── stores/authStore.ts  # Zustand, 관리자 토큰(persist)
        └── screens/          # 라우트에서 재사용하는 화면 컴포넌트
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
npm run dev                    # http://localhost:3001
npm run build                  # next build --webpack
```

관리자 계정(시드): `.env`의 `ADMIN_SEED_USERNAME`/`ADMIN_SEED_PASSWORD` (기본 `admin` / `admin1234`).

- 프론트엔드에는 별도 테스트 러너가 없다 — `npx tsc --noEmit`이 사실상의 검증 수단이고, 실제 동작 확인은 브라우저(Playwright)로 한다.
- dev 서버를 새로 띄우기 전 해당 포트(3000/3001)가 이미 점유돼 있는지 먼저 확인한다 — 중복 실행은 `EADDRINUSE`로 조용히 실패할 수 있고, 기존 서버가 stale build(`dist/main`, 옛 `.env`)를 서빙 중이라 방금 수정한 코드가 반영 안 될 수도 있다. E2E 검증 직전에는 기존 프로세스가 watch 모드인지, 최근 변경을 반영했는지 확인한다.

## 아키텍처 규칙

- **CRUD 패턴 통일**: courses/notices/instructors는 동일한 구조(controller/service/dto, `findAll`/`findOne`/`create`/`update`/`remove`)를 따른다. 새 도메인 추가 시 이 패턴을 복제한다.
- **인증 가드는 쓰기 작업에만**: `GET`은 공개, `POST`/`PATCH`/`DELETE`에만 `@UseGuards(JwtAuthGuard)`. 새 엔드포인트 추가 시 동일하게 적용.
- **관리자 권한**: 모든 인증된 관리자는 동일한 전체 권한을 갖는다. 관리자 API에는 서버에서 `JwtAuthGuard`를 적용하고, 프론트 메뉴·페이지 가드는 UX 보조로만 쓴다. 관리자 계정 생성(`POST /admins`)도 인증된 관리자가 수행할 수 있다.
- **단, GET이 개인정보를 반환하면 예외적으로 가드 유지**: 신청자 이름·이메일 등이 포함된 목록/상세 GET(`reservations`, `reservation-groups`의 `findAll`/`findOne` 등)은 클래스 레벨 대신 **메서드 레벨 `@UseGuards(JwtAuthGuard)`**로 개별 유지하고, 같은 컨트롤러에 공개해야 하는 집계/익명 GET(예: `GET /reservation-groups/confirmed-slots` — 요일·시간만 반환)이 있으면 가드 없이 별도 라우트로 추가한다. 공개 라우트는 반드시 `:id` 같은 파라미터 라우트보다 **먼저 선언**해 경로 충돌을 피한다.
- **DELETE는 204 반환 필수**: `@HttpCode(HttpStatus.NO_CONTENT)`. Nest 기본값(200 + 빈 바디)은 프론트 `response.json()` 파싱 에러를 유발한다(실제로 겪은 버그, `src/lib/apiClient.ts` 참고).
- **API 응답은 Zod로 파싱**: `frontend/src/api/*.ts`에서 `schema.parse(raw)` 필수, `as T` 단언 금지. 신규 API 함수 작성 시 `api-zod-boundary` 스킬 참고.
- **Next 라우팅**: 공개 페이지 SEO는 `frontend/src/app/`의 App Router metadata/서버 렌더링을 기준으로 관리한다. 브라우저 상태가 필요한 화면은 `use client` 컴포넌트로 분리한다.
- **Agentation 개발 오버레이**: `agentation`은 `frontend/src/components/AgentationDev.tsx`에서 개발 환경에만 렌더링하고, 루트 레이아웃에 유지한다.
- **쿼리 훅 배치**: 2곳 이상에서 쓰면 `src/queries/`, 관리자 화면 전용(1곳)이면 `src/screens/admin/hooks/`, 공개 화면 전용(1곳)이면 `src/screens/hooks/`. `queryKeys.ts`는 항상 중앙(`src/queries/queryKeys.ts`)에서 관리.
- **Instructor 삭제**: 담당 강좌가 남아있으면 `ConflictException`(409)을 던진다 — FK 제약 위반을 그대로 노출하지 않는다.
- **공유 필드 리네임 시 점검 범위**: 예약/강좌 등 여러 계층에 걸친 필드명을 바꿀 때는 `schema.prisma` → migration → 해당 도메인 양쪽 DTO → 양쪽 service/controller spec → `seed.ts` → 프론트 `schemas/*.schema.ts` → `api/*.ts` → 이를 쓰는 화면(`screens/**`) 순으로 훑는다.
- **알림(이메일 등) 발송 실패 격리**: `NotificationService`류는 SMTP 미설정이거나 발송 실패해도 콘솔 로그로 폴백하고, API 요청 자체는 정상 처리되게 만든다 — 발송 실패가 사용자 요청 실패로 전파되지 않아야 한다. SMTP 미설정 폴백 로그는 subject뿐 아니라 본문(text)도 함께 남긴다 — 인증 링크 등 URL이 본문에 있으면 개발 중 콘솔에서 바로 복사해 쓸 수 있어야 한다.
- **인증 상태의 SSR 반영**: 클라이언트 전역 상태(Zustand)가 SSR 초기 렌더에도 영향을 줘야 하면 `src/lib/cookieStorage.ts`(non-httpOnly 쿠키 저장) + `src/lib/serverAuth.ts`(서버 `cookies()` 읽기) + `initialXxx` prop + mount 게이트 패턴을 따른다. 관리자 세션과 부모(보호자) 세션은 서로 독립적인 별개 상태이므로, 인증 가드를 새로 만들 때 "관리자 세션은 있지만 부모 세션은 없음" 같은 조합을 빠뜨리지 않는다.
- **보호자 로그인 수단**: 소셜 로그인뿐 아니라 이메일/비밀번호("일반 로그인")도 지원한다 — 소셜 전용으로 가정하고 검증·자동화를 생략하지 않는다. 이메일 가입은 즉시 계정을 만들지 않고 매직 링크 인증을 거친다: `POST /auth/parents/signup`이 `ParentEmailVerification`(대기 레코드, `email @unique`)을 upsert하고 인증 메일을 보내며, 링크의 `POST /auth/parents/verify-email`에서만 `ParentUser`가 생성되고 로그인 쿠키가 발급된다. 소셜 전용(`passwordHash` null) 기존 계정과의 병합 분기는 `AuthService.verifyParentEmail`에서 처리한다. 비슷한 "제출 즉시 자원을 만들지 않고 검증 후 생성" 흐름을 추가할 때 이 패턴(대기 테이블 + 토큰 + upsert)을 참고한다.
- **`/apply` 관리자 프리뷰**: 관리자 세션만 있고 부모 세션이 없는 경우 화면 진입(`isAdminPreview`)은 허용하되 실제 제출은 `alert`로 차단한다(`ApplyPage.tsx`).
- **예약 그룹 확정 단위**: `reservation-groups` 확정은 요일·시간 셀 단위가 아니라, 사용자가 고른 개별 `reservation` ID 목록 기준으로 동작한다.
- **로그인 필요 페이지 추가 시**: 새로 만들지 않고 `RequireAdmin`/Header의 기존 리다이렉트+모달 가드 패턴을 복제한다.

## React 상태 관리 규칙

- props, store 값, 쿼리 결과가 바뀌었다는 이유만으로 `useEffect` 안에서 같은 컴포넌트의 state 일부를 보정하지 않는다.
- 외부 값 변화에 맞춰 state를 재설정해야 하면 `key`로 하위 컴포넌트를 재마운트하거나, 렌더링 중 `prevValue` 비교로 같은 컴포넌트 state를 조건부 갱신한다.
- 이벤트, 네트워크 구독, DOM 조작, 타이머처럼 실제 사이드 이펙트가 있는 작업만 `useEffect`에 둔다.

## 프론트엔드 E2E(Playwright)

`frontend/e2e/`에 Playwright 스위트가 있다. 백엔드/DB 없이 완전히 목(mock)으로 동작한다 — 백엔드 계약 검증은 백엔드 Jest 스펙이 담당.

```bash
cd frontend
npx playwright install chromium   # 최초 1회
npx playwright test               # 전체 스위트 실행 (3410/4310 전용 포트, 실백엔드 3000/평소 dev 3001과 무관)
```

- **SSR과 클라이언트 요청은 목킹 방식이 다르다**: 공개 페이지(`app/**`)의 서버 컴포넌트 fetch는 브라우저 `page.route()`로 못 잡는다 — `e2e/mock-server/server.ts`(독립 Node 서버, `NEXT_PUBLIC_API_BASE_URL`로 연결)가 응답한다. `/apply`, `/level-test`, `/admin/*`처럼 클라이언트(TanStack Query)에서 나가는 요청은 각 spec의 `page.route()`로 시나리오별 제어한다.
- **`page.route()` 패턴은 반드시 API origin에 앵커링**: 느슨한 정규식(`/\/courses$/` 등)은 `/admin/courses` 같은 페이지 자체 내비게이션까지 가로채 버린다(실제로 겪은 버그 — 브라우저가 JSON을 그대로 렌더링). `e2e/helpers/intercept.ts`의 `apiPattern()`으로 목 API origin까지 통째로 앵커링해서 쓴다.
- **`next dev`는 프로젝트 디렉토리당 1개만 허용**(포트가 달라도 동시 실행 시 잠금 충돌). `next.config.ts`에 `NEXT_E2E=1`일 때 `distDir: '.next-e2e'`로 분리해 평소 dev 서버(3001, `.next`)와 공존시킨다.
- **Next의 fetch 데이터 캐시(`next: {revalidate}`)는 디스크에 영구 저장**(`.next-e2e/dev/cache/fetch-cache`)돼 dev 서버를 껐다 켜도 살아남는다. `playwright.config.ts`의 webServer 커맨드가 기동 전 이 캐시를 지운다 — 목 서버 응답을 시나리오별로 바꾸는 테스트를 새로 추가할 때 이 점을 놓치면 항상 첫 실행 데이터만 보인다.
- **인증은 실제 로그인 없이 위조 쿠키로 세팅**: `serverAuth.ts`는 JWT 서명 검증을 안 하므로 `e2e/helpers/auth.setup.ts`가 보호자 JWT payload와 관리자 zustand persist 쿠키 storageState를 미리 만들어 재사용한다.
- **`window.alert`/`confirm` 같은 네이티브 다이얼로그는 `page.once('dialog', ...)`를 액션 실행 **전에** 등록**한다 — `page.waitForEvent('dialog')` 뒤에 `await click()`을 두면 동기 `alert()`가 렌더러를 막아 클릭 자체가 영원히 안 끝나는 데드락이 난다.
- **라벨 충돌은 `data-testid`로 해소**: 같은 화면에 동일 라벨(예: 예약 관리 페이지의 "그룹 이름"이 `GroupConfirmForm`/`GroupManagementCard` 양쪽에 존재)이 있으면 `getByLabel`이 strict-mode 위반을 낸다 — 모호한 컨테이너에만 `data-testid`를 붙여 스코프를 좁힌다.

## Prisma 7 운영 규칙

Prisma Client는 `prisma-client` generator로 `backend/src/generated/prisma`에 생성하며 Git에 커밋하지 않는다. `schema.prisma`에는 datasource provider만 두고 연결 URL·seed는 `prisma.config.ts`에서 관리한다. 앱과 seed는 `@prisma/adapter-pg`의 `PrismaPg` adapter를 주입해 생성 클라이언트를 사용한다. Prisma 7은 migration 뒤 자동 client 생성·seed를 실행하지 않으므로 `npm run prisma:generate`, `npm run prisma:seed`를 명시적으로 실행한다. 백엔드는 ESM이므로 상대 import에는 `.js` 확장자를 쓴다.

## 개발 워크플로

- 백엔드 기능 추가/수정은 TDD(RED-GREEN)로 진행 — `*.spec.ts` 먼저 작성해 실패 확인 후 구현.
- 프론트/백엔드 동시 실행 후 실제 브라우저(Playwright) 또는 curl로 end-to-end 확인 없이 완료 선언하지 않는다.
- 이 git 저장소(`/Users/igyuyeol/Desktop/project`)에는 다수의 독립 프로젝트가 공존한다 — 커밋 시 `academy-hompage/` 밖의 변경을 섞지 않는다.
- E2E 검증을 위해 띄운 개발 서버를 종료했다면 완료 보고에 반드시 명시한다 — 다음 턴에서 서버 다운이 새 버그로 오인되는 걸 방지.
- E2E 검증 중 생성한 테스트 데이터(부모 계정, 예약 등)는 완료 보고에 식별자를 명시하고 삭제 여부를 사용자에게 확인받는다.
- **`npm run start:dev`(`nest start --watch`) 재기동 시 EADDRINUSE 주의**: 이미 떠 있는 watch 프로세스를 죽이지 않고 새로 띄우면, 재컴파일된 새 워커가 이전 워커와 포트(3000)를 두고 충돌해 새 워커만 크래시하고 옛 코드가 계속 떠 있는 상태로 남을 수 있다. 코드를 바꾼 뒤 재검증할 때는 `pkill -f "nest start --watch"` 등으로 완전히 정리한 다음 다시 기동하고, curl 등으로 최신 변경(새 라우트·로그 문구 등)이 실제로 반영됐는지 확인한다.
- 예약 도메인 E2E용 테스트 데이터는 `POST /reservations/walk-in`(관리자 토큰, 보호자 인증 불필요)으로 `WAITING` 예약을 먼저 만들고, 그 예약 ID를 `POST /reservation-groups`의 `slots[].reservationId`로 참조해 확정 그룹을 만든다 — 예약과 그룹을 한 번에 생성하는 엔드포인트는 없다.
- 여러 세션에 걸쳐 진행하는 미완성 기능은 완료 전까지 `main`이 항상 빌드 가능한 상태를 유지한다 — 중간 상태로 오래 남으면 무관한 후속 작업의 빌드가 깨질 수 있다.
