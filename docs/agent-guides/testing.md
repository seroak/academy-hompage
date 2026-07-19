# 테스트와 검증 가이드

## 기본 원칙

- 변경 위험에 비례해 테스트·빌드·실행 로그를 확인한다. 실제 동작을 검증하지 못했으면 구현과 검증 상태를 분리해 보고한다.
- 버그 수정 뒤에는 동일 경로 회귀 테스트를 실행한다. 조건부 분기는 각 경우를 최소 한 번 실행한다.
- 기준선에서 발견한 기존 테스트 실패를 현재 작업과 분리할 수는 있다. 다만 같은 실패가 두 개 이상의 작업에서 반복되면 배포 전 해결 대상으로 승격하고, 제품 동작과 테스트 기대값 중 어느 쪽이 현재 계약인지 확인해 정리한다.
- 기존 dev 서버로 E2E 하기 전 watch 상태와 최근 변경 반영 여부를 확인한다.
- E2E·빌드 전후 `git status`와 diff를 확인한다. `next-env.d.ts`, `tsconfig.tsbuildinfo` 등 생성 파일은 세션 시작 상태를 확인한 뒤 기능 변경이 아니면 정리한다.
- 내비게이션·문구·색상·이미지 로딩 전략을 의도적으로 바꾸면 같은 변경에서 관련 E2E의 테스트 이름과 기대값도 현재 동작에 맞춰 갱신한다.
- `npm run seo:audit`(로컬 Lighthouse) 명령을 실행하기 직전에 반드시 먼저 `uptime`으로 시스템 부하를 확인한다(측정 시작 후·결과를 본 뒤가 아니라 실행 전). load average가 높으면(예: CPU 코어 수 이상) LCP·TBT 수치가 실제보다 크게 나빠질 수 있어, 그 상태로 측정한 결과만으로 회귀를 단정하지 않는다.
- GitHub Actions 공용 러너의 Lighthouse CI는 `throttlingMethod: 'provided'` + `numberOfRuns: 1` 조합 때문에 Total Blocking Time이 임계값 근처에서 크게 흔들린다(무관한 커밋에서도 실패 이력 있음). 로컬 실행이 통과(예: 0ms)하는데 CI만 실패하면 코드 회귀가 아니라 CI 환경 노이즈일 가능성을 먼저 의심한다(`.github/workflows/frontend-seo.yml`에 재시도 루프로 완화돼 있음).
- `seo:audit`이 백그라운드로 띄운 임시 dev 서버도 다른 dev 서버와 동일하게 작업 종료 시 정리하고, 정리 여부를 완료 보고에 명시한다.

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
- 포트 3000·3001을 점유한 프로세스가 여러 개 겹쳐 있을 수 있다(예: 옛 PID와 실제 서비스 PID가 동시에 남아있는 경우). `lsof -i :포트`로 실제로 그 포트를 점유 중인 PID를 먼저 특정한 뒤에만 재시작·종료 대상으로 삼는다.
