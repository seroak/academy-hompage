# academy-hompage 프로젝트 안내

## 지침 파일 동기화

- `CLAUDE.md`와 `AGENTS.md`의 프로젝트 기술·아키텍처·검증·작업 규칙은 같은 의도로 유지한다.
- 도구별 전역 행동 규칙은 각 진입점에만 둘 수 있다.

## 스킬 사용

- 작업 완료 전, 재사용 가능한 프로젝트 전반 교훈이 있으면 관련 `docs/agent-guides/*.md`나 이 파일을 갱신한다. 과거 세션 회고가 필요하면 `/dx:review-claudemd`로 대화 기록을 CLAUDE.md와 대조 분석한다.
- 스킬이 설계·계획 문서 생성이나 커밋을 요구하더라도, 사용자 또는 프로젝트 지침이 채팅 출력을 요구하거나 Git 작업을 승인하지 않았다면 파일 생성·커밋을 수행하지 않는다.

## 검증 원칙

- 완료 전 관련 테스트·빌드와 위험에 비례한 실제 동작을 확인하고, 실제 출력·통과 수를 보고한다.
- 필수 검증을 못 했으면 구현과 검증 상태를 분리하고 미실행 검증을 남은 작업으로 명시한다. 이를 "완료", "정상", "통과"로 표현하지 않는다.
- 카운트 가능한 수치, 파일 존재, DOM·API 동작은 직접 확인한 뒤 보고한다. 사실과 추측을 구분한다.

## 빠른 실행

```bash
# 새 워크트리
./scripts/create-worktree.sh <작업명>

# backend
cd backend
docker compose up -d
npx prisma migrate dev
npm run prisma:generate
npm run prisma:seed
npm run start:dev
npm test

# frontend
cd frontend
npm run dev
npx tsc --noEmit
npx playwright test
npm run build
npm run seo:audit
```

- 새 워크트리는 수동 `git worktree add` 대신 반드시 `./scripts/create-worktree.sh <작업명>`으로 만든다. 이 명령이 `.env` 링크, 양쪽 `npm ci`, Prisma Client 생성을 함께 처리한다.
- 백엔드 테스트는 ESM 설정 때문에 반드시 `npm test`로 실행한다.
- 프론트엔드에는 별도 단위 테스트 러너가 없다. 타입 검사는 `npx tsc --noEmit`, 동작 검증은 Playwright E2E를 사용한다.
- SEO·공개 페이지 성능 변경은 production build 후 `npm run seo:audit`으로 핵심 URL 게이트를 확인한다.
- 새 dev 서버 전 포트 3000·3001 점유와 기존 서버의 최신 watch 상태를 확인한다.

## Meta 광고 자동 분석 운영

- 광고 관리 화면은 `/admin/marketing`이다. 홈페이지 행동은 자체 DB, 광고비·노출·링크 클릭은 Meta Marketing API, 상담 이후 단계는 기존 상담 신청 데이터가 기준이다.
- 홈페이지 연결 Meta 광고 URL은 이름이 아닌 동적 ID로 통일한다: `utm_source=meta&utm_medium=paid_social&utm_campaign={{campaign.id}}&utm_content={{ad.id}}`.
- Meta API는 개발자 앱에 Marketing API를 추가하고, Business Portfolio의 시스템 사용자에게 **앱과 실제 광고 계정**을 모두 할당한 뒤 `ads_read` 권한으로 만든 시스템 사용자 토큰을 사용한다. 시스템 사용자 ID·앱 ID는 `META_AD_ACCOUNT_ID`가 아니다.
- 운영 시크릿은 서버의 `backend/.env.production`에만 둔다. 필요한 키는 `META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID`, `META_API_VERSION`, `META_SYNC_ENABLED`이며 토큰 값은 저장소·프론트엔드·로그·채팅에 기록하지 않는다.
- Meta 연동 오류는 먼저 `GET /me/permissions`에서 `ads_read: granted`를 확인하고, 그 **실제 광고 계정 ID**로 `/act_{META_AD_ACCOUNT_ID}/insights`를 직접 조회해 권한과 계정 ID를 구분한다. `{"data":[]}`는 권한 성공이며 해당 기간의 광고 데이터가 없다는 뜻이다.
- `/me/permissions`·`/insights`·`/debug_token`처럼 서로 다른 엔드포인트가 모두 동일한 `error.code`(예: `200 "API access blocked"`)로 실패하면 계정 ID나 개별 권한 문제가 아니라 **개발자 계정·시스템 사용자 토큰 자체가 Meta 쪽에서 차단된 상태**다. `developers.facebook.com/apps/`가 `개발자 플랫폼 차단 사용자 오류` 화면으로 리다이렉트되는지 먼저 확인한다.
- 여러 비즈니스 포트폴리오에 로그인 가능한 계정으로 Ads Manager를 확인할 때는, 화면에 처음 뜨는 비즈니스를 실제 운영 대상으로 가정하지 않는다 — 먼저 실제 운영 광고 계정 ID를 확보한 뒤 화면의 `business_id`·`act`와 대조한다.
- `/admin/marketing`의 `지금 동기화`는 수동 실행이며, 성공 시 반영 건수와 마지막 성공 시각을 표시한다. 광고 집행 전에는 `새로 반영된 광고 데이터가 없습니다`가 정상일 수 있다. 동시 실행은 별도 안내로 표시한다.
- Meta API 장애나 미설정 상태여도 홈페이지 상담 신청과 관리자 상담 관리는 계속 동작해야 한다. GA4·Meta Pixel·자체 행동 이벤트에 보호자·자녀 개인정보를 보내지 않는다.
- Ads Manager·청구 화면의 상태를 보고하기 직전에 화면을 새로고침하고 `business_id`, `act` 및 선택된 캠페인·광고 세트·광고 ID가 실제 운영 대상을 가리키는지 확인한다. 오래 열린 탭이나 새로고침 전 문구만으로 결제수단·게시·게재 상태를 단정하지 않는다.
- 결제수단은 실제 광고 계정의 청구 화면에서 새로고침 후 마스킹된 결제수단과 기본 여부까지 확인한다. 로딩 중이거나 이전 화면의 `추가한 결제 수단이 없습니다` 문구는 최종 근거로 사용하지 않는다.
- 게시 상태는 캠페인·광고 세트·광고를 각각 확인하고 `임시 저장`, `처리/검토 중`, `예약됨`, `활동 중`을 구분해 보고한다. `검토 후 게시(n개)`는 미게시 변경이 남았다는 뜻이므로 게시 실패로 해석하지 말고, 게시본과 남은 초안을 이름·ID로 분리한다.
- Instagram 전용이라고 보고하려면 수동 노출 위치에서 Instagram 외 모든 플랫폼과 `제외된 노출 위치에 제한적인 지출 허용`이 꺼졌고 저장됐는지 확인한다. 어드밴티지+ 노출 위치가 켜져 있으면 Facebook·Messenger·Audience Network·WhatsApp 등에도 게재될 수 있음을 명시한다.
- 일정·예산·타겟·노출 위치는 과거에 입력한 값이 아니라 현재 게시된 광고 세트에서 다시 확인한다. 확인하지 못한 값은 `이전 설정` 또는 `미확인`으로 구분하며 현재값처럼 단정하지 않는다.

## 변경 전 읽을 가이드

| 변경 영역 | 가이드 |
|---|---|
| API, 인증, 폼, TanStack Query, React, 예약 그룹 | [architecture.md](docs/agent-guides/architecture.md) |
| Playwright, 실제 서버 검증, 생성 파일, 테스트 데이터 | [testing.md](docs/agent-guides/testing.md) |
| Prisma schema, migration, seed | [prisma.md](docs/agent-guides/prisma.md) |
| Docker, Vercel, 도메인, 배포 | [deployment.md](docs/agent-guides/deployment.md) |
| Git, 커밋, 장기 작업 | [workflow.md](docs/agent-guides/workflow.md) |

## 필수 프로젝트 규칙

- 쓰기 API는 `JwtAuthGuard`, 공개 GET은 가드 없이 둔다. 개인정보 GET만 메서드 단위 가드를 유지한다.
- 프론트 API 응답은 Zod로 파싱하고 `as T` 단언을 쓰지 않는다. 프론트 검증과 별개로 Nest DTO에서도 입력을 검증한다.
- `DELETE`는 204를 반환한다.
- Prisma schema·migration 변경은 대상 DB에 적용하고 실제 API 요청으로 검증한다.
- 통합 경로 변경은 양쪽 서버와 Playwright 또는 curl로 확인한다. 정적 단일 영역 변경에 양쪽 서버를 강제하지 않는다.
- 운영 Compose 명령은 프로젝트 루트에서 실행한다. 루트 `.env.production`은 Compose 치환용이고, 백엔드 런타임 환경변수는 `backend/.env.production`에서 관리한다.
- `(healthy)`는 백엔드·DB 상태만 확인한다. OAuth 등 외부 연동 설정은 실제 흐름으로 별도 검증한다.
- lint 경고 해결에 임계값 상향·규칙 비활성화·예외 추가를 쓰려면 먼저 사용자 승인을 받는다.
- E2E·빌드 후 `git status`와 diff로 생성 파일 변경을 확인한다. 기존 사용자 변경은 덮어쓰지 않는다.
- 공유 DB에 남는 테스트 데이터만 식별자·삭제 여부를 보고한다. 전용 임시 DB는 계획대로 폐기하고 사실만 보고한다.
