# 테스트와 검증 가이드

## 기본 원칙

- 변경 위험에 비례해 테스트·빌드·실행 로그를 확인한다. 실제 동작을 검증하지 못했으면 구현과 검증 상태를 분리해 보고한다.
- 버그 수정 뒤에는 동일 경로 회귀 테스트를 실행한다. 조건부 분기는 각 경우를 최소 한 번 실행한다.
- 기존 dev 서버로 E2E 하기 전 watch 상태와 최근 변경 반영 여부를 확인한다.
- E2E·빌드 전후 `git status`와 diff를 확인한다. `next-env.d.ts`, `tsconfig.tsbuildinfo` 등 생성 파일은 세션 시작 상태를 확인한 뒤 기능 변경이 아니면 정리한다.

## Frontend Playwright

```bash
cd frontend
npx playwright install chromium
npx playwright test
```

- E2E는 3410·4310 포트를 쓰며 실제 백엔드·일반 dev 서버와 분리된다.
- 공개 SSR fetch는 `e2e/mock-server/server.ts`가 응답한다. 클라이언트 요청은 각 spec의 `page.route()`로 제어한다.
- `page.route()`는 `e2e/helpers/intercept.ts`의 `apiPattern()`으로 API origin까지 앵커링한다.
- `NEXT_E2E=1`은 `.next-e2e`를 사용한다. fetch 캐시는 webServer 시작 전 지운다.
- 인증은 `auth.setup.ts`의 관리자·보호자 storageState를 사용한다.
- 네이티브 dialog는 클릭 전에 `page.once('dialog', ...)`를 등록한다.
- 라벨 충돌은 모호한 컨테이너에만 `data-testid`를 두고 POM과 spec을 함께 갱신한다.

## 실제 서버 검증

- 통합 경로가 바뀌면 backend와 frontend를 모두 실행하고 Playwright 또는 curl로 확인한다.
- 실제 보호자 세션이 필요하면 위조 쿠키 대신 가입·이메일 인증으로 발급된 서명 JWT를 Playwright context에 httpOnly 쿠키로 주입한다.
- 예약 도메인 E2E 데이터는 `POST /reservations/walk-in`으로 `WAITING` 예약을 만들고, 그 ID를 `POST /reservation-groups`의 slot `reservationId`로 참조해 확정 그룹을 만든다.
- 공유 개발 DB에 생성한 테스트 데이터는 식별자와 삭제 여부를 보고한다. 전용 임시 DB는 계획대로 폐기하고 사실만 보고한다.
- `nest start --watch` 재기동 전 기존 프로세스를 정리하고 curl로 최신 라우트·응답이 실제 반영됐는지 확인한다.
